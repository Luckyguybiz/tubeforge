# TubeForge Deployment Checklist

Step-by-step guide for taking TubeForge from development to a live production environment.

---

## 1. Stripe Live Mode Setup

### 1.1 Create Products & Prices

1. Log into [Stripe Dashboard](https://dashboard.stripe.com) and switch to **Live mode** (toggle in the top-right).
2. Go to **Product catalog > Add product** and create two products:

   | Product     | Suggested name | Billing   |
   |-------------|---------------|-----------|
   | Pro plan    | TubeForge Pro | Monthly recurring |
   | Studio plan | TubeForge Studio | Monthly recurring |

3. Set prices in your target currency (e.g. $9.99/mo for Pro, $24.99/mo for Studio).
4. Copy the **Price IDs** (`price_xxx`) or **Product IDs** (`prod_xxx`) — both formats are supported by the app.
5. Set these as env vars:
   ```
   STRIPE_PRICE_PRO=price_xxx
   STRIPE_PRICE_STUDIO=price_xxx
   ```

### 1.2 Get Live API Keys

1. Go to **Developers > API keys**.
2. Copy the **Secret key** (`sk_live_xxx`) — set it as `STRIPE_SECRET_KEY`.
3. The app does NOT use a publishable key on the client (checkout is server-initiated via tRPC).

### 1.3 Configure Webhook Endpoint

1. Go to **Developers > Webhooks > Add endpoint**.
2. Set the endpoint URL to:
   ```
   https://tubeforge.co/api/webhooks/stripe
   ```
   (The legacy path `/api/stripe/webhook` also works — it re-exports the same handler.)
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_xxx`) and set it as `STRIPE_WEBHOOK_SECRET`.

### 1.4 Configure Customer Portal

1. Go to **Settings > Billing > Customer portal**.
2. Enable: update payment method, view invoices, cancel subscription.
3. Set the default return URL to `https://tubeforge.co/dashboard`.

### 1.5 Test the Integration

1. Before going fully live, use [Stripe Test Clocks](https://dashboard.stripe.com/test/billing/subscriptions/test-clocks) to simulate subscription lifecycles.
2. Verify that plan upgrades, downgrades, cancellations, and failed payments all update the user's `plan` field in the database correctly.
3. Confirm webhook idempotency: the app uses a `processedEvent` table to deduplicate — verify no double charges or plan flips.

---

## 2. Domain & DNS Configuration

### 2.1 DNS Records

Set the following DNS records for `tubeforge.co`:

| Type  | Name | Value                          | TTL  |
|-------|------|-------------------------------|------|
| A     | @    | (your server IP)              | 300  |
| CNAME | www  | tubeforge.co                  | 300  |

If using Cloudflare, enable the orange cloud (proxy) for DDoS protection.

### 2.2 Verify Propagation

```bash
dig +short tubeforge.co A
dig +short www.tubeforge.co CNAME
```

---

## 3. SSL/TLS Certificate

### Option A: Let's Encrypt with Certbot (recommended for VPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tubeforge.co -d www.tubeforge.co
```

Certbot auto-renews via a systemd timer. Verify:
```bash
sudo systemctl status certbot.timer
```

### Option B: Cloudflare Full (Strict)

If proxying through Cloudflare, set SSL mode to **Full (Strict)** and use a Cloudflare Origin Certificate on the server.

---

## 4. Environment Variables (Production)

Copy `.env.example` to `.env` on the production server and fill in all `[REQUIRED]` values:

```bash
# Minimum required for the app to start:
DATABASE_URL="postgresql://user:password@localhost:5432/tubeforge"
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_GOOGLE_ID="<from Google Cloud Console>"
AUTH_GOOGLE_SECRET="<from Google Cloud Console>"
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_PRICE_PRO="price_xxx"
STRIPE_PRICE_STUDIO="price_xxx"
NEXT_PUBLIC_APP_URL="https://tubeforge.co"
```

Additional production-recommended vars:
```bash
# Email (at least one provider)
RESEND_API_KEY="re_xxx"
EMAIL_FROM="noreply@tubeforge.co"

# Error monitoring
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Logging
LOG_LEVEL="info"
```

Important: ensure `.env` is in `.gitignore` (it already is) and never committed.

---

## 5. Database Migration

### 5.1 Initial Setup

```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run all migrations against the production database
npx prisma migrate deploy
```

### 5.2 Verify Schema

```bash
npx prisma db pull --print
```

Confirm the `ProcessedEvent` table exists (used for webhook idempotency) along with `User.stripeId`, `User.plan`, `Payout`, and `VpnPeer` tables.

### 5.3 Backups

Set up daily PostgreSQL backups:
```bash
# Example cron job (add to crontab -e)
0 3 * * * pg_dump -Fc tubeforge > /backups/tubeforge-$(date +\%Y\%m\%d).dump
```

---

## 6. Build & PM2 Setup

### 6.1 Build the App

```bash
cd /home/ubuntu/tubeforge-next
npm ci
npx prisma generate
npm run build
```

### 6.2 PM2 Process Manager

Install PM2 globally if not already installed:
```bash
npm install -g pm2
```

Create `ecosystem.config.cjs`:
```js
module.exports = {
  apps: [
    {
      name: 'tubeforge',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/home/ubuntu/tubeforge-next',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

Start and persist across reboots:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # follow the printed command to enable on boot
```

### 6.3 Nginx Reverse Proxy

Example `/etc/nginx/sites-available/tubeforge`:
```nginx
server {
    listen 80;
    server_name tubeforge.co www.tubeforge.co;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tubeforge.co www.tubeforge.co;

    ssl_certificate /etc/letsencrypt/live/tubeforge.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tubeforge.co/privkey.pem;

    # Max body size for video uploads / server actions
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tubeforge /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Cron Jobs & Healthchecks

### 7.1 Application Healthcheck

Add a cron job to verify the app is responding:
```bash
# Check every 5 minutes, restart PM2 if down
*/5 * * * * curl -sf https://tubeforge.co > /dev/null || pm2 restart tubeforge
```

### 7.2 Stripe Webhook Health

Monitor webhook delivery in the Stripe Dashboard under **Developers > Webhooks > (your endpoint)**. Stripe shows delivery success rate and recent failures. Set up Stripe email alerts for repeated failures.

### 7.3 Database Cleanup (optional)

Prune old processed webhook events (idempotency records) older than 30 days:
```sql
-- Run weekly via cron or a scheduled task
DELETE FROM "ProcessedEvent" WHERE "createdAt" < NOW() - INTERVAL '30 days';
```

---

## 8. Chrome Extension Submission

The Chrome extension lives in the `extension/` directory (if present; otherwise built separately).

### 8.1 Pre-submission Checklist

- [ ] Update `manifest.json` version number
- [ ] Ensure `permissions` are minimal (only what the extension actually needs)
- [ ] Verify the extension works with the production domain (`tubeforge.co`)
- [ ] Create promotional images: 440x280 (small tile), 920x680 (large tile), 1280x800 (marquee)
- [ ] Write a clear store listing description

### 8.2 Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Pay the one-time $5 developer registration fee (if not already done).
3. Click **New Item** and upload a `.zip` of the extension directory.
4. Fill in listing details, screenshots, and privacy practices.
5. Submit for review (typically 1-3 business days).

### 8.3 Post-publication

- Pin the published extension URL in your site footer / download page.
- Monitor reviews and crash reports in the developer dashboard.

---

## 9. Error Monitoring (Sentry)

### 9.1 Setup

1. Create a project at [sentry.io](https://sentry.io) (or self-hosted) for Next.js.
2. Copy the **Client DSN** and set:
   ```
   NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
   ```
3. The app already has `@sentry/nextjs` integrated with client, server, and edge configs.
4. Source map upload is currently disabled (`sourcemaps.disable: true` in `next.config.ts`). To enable:
   - Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` env vars.
   - Remove or set `disable: false` in the Sentry config.

### 9.2 Alerts

Configure alert rules in Sentry:
- **High-priority**: Any unhandled exception in `/api/webhooks/stripe` (payment flow)
- **Medium**: Error rate > 5% over 5 minutes
- **Low**: New issue first seen

---

## 10. Google OAuth — Production Setup

1. Go to [Google Cloud Console > APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent).
2. If the app is still in "Testing" mode, click **Publish App** to allow any Google user to sign in (not just test users).
3. Under **Credentials**, ensure the OAuth 2.0 Client has:
   - **Authorized redirect URI**: `https://tubeforge.co/api/auth/callback/google`
4. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` to the production credentials.

---

## 11. Go-Live Checklist (Final)

- [ ] All `[REQUIRED]` env vars set (see `.env.example`)
- [ ] `npx prisma migrate deploy` completed successfully
- [ ] `npm run build` completes without errors
- [ ] PM2 running and app responds at `https://tubeforge.co`
- [ ] Google OAuth sign-in works (consent screen published, redirect URI set)
- [ ] Stripe checkout creates a subscription (test with a real card or Stripe test card in live mode)
- [ ] Stripe webhook receives events (check Stripe Dashboard > Webhooks for 200 responses)
- [ ] Plan upgrade/downgrade correctly updates `user.plan` in the database
- [ ] Customer portal accessible (manage subscription, view invoices)
- [ ] Email delivery working (payment receipts, plan change notifications)
- [ ] Sentry receiving error reports
- [ ] SSL certificate valid and auto-renewing
- [ ] Database backups configured
- [ ] Healthcheck cron running
- [ ] `.env` file is NOT committed to git
