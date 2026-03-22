# TUBEFORGE — Complete Platform State
## Date: March 22, 2026

---

## 1. OVERVIEW

**TubeForge** is an AI-powered platform for YouTube creators. It provides video editing, AI thumbnail generation, metadata optimization, analytics, content planning, video downloading/analysis, video translation, VPN, and more — all in a single SaaS dashboard.

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **API Layer:** tRPC v11
- **ORM:** Prisma (PostgreSQL)
- **Database:** PostgreSQL (direct connection; PgBouncer installed but not primary due to prepared statement issues)
- **Payments:** Stripe (Checkout, Webhooks, Customer Portal)
- **State Management:** Zustand
- **Auth:** Auth.js v5 (NextAuth) — Google OAuth + dev-only Credentials provider
- **Email:** Resend (transactional emails)
- **AI APIs:** OpenAI (DALL-E 3, GPT), Anthropic (Claude), ElevenLabs (TTS/voice cloning), fal.ai, Runway ML
- **Video Processing:** Cobalt API, yt-dlp API (separate PM2 process)
- **Styling:** CSS-in-JS (inline styles), dark/light theme via Zustand
- **i18n:** i18next + react-i18next (4 languages)
- **Monitoring:** Sentry, structured logger
- **Process Manager:** PM2 (cluster mode, 4 instances)
- **Reverse Proxy:** Caddy (auto-SSL)

### Server
- **Host:** ubuntu@57.128.254.111 (OVH VPS, 12GB RAM, 2GB swap)
- **Domain:** tubeforge.co
- **Reverse Proxy:** Caddy with auto-SSL, HSTS, gzip/zstd compression
- **Git HEAD:** `d0d8f71f20f74e86e65a23d9e3c462f9d964b131`

---

## 2. ARCHITECTURE

### File Counts
- **Source files:** 366 files in `src/`

### Directory Structure (`src/`)
| Directory       | Purpose                                            |
|-----------------|----------------------------------------------------|
| `app/`          | Next.js App Router — pages, API routes, layouts    |
| `components/`   | Shared UI components                               |
| `hooks/`        | Custom React hooks                                 |
| `lib/`          | Utility libraries, configs, helpers                |
| `locales/`      | i18n JSON translation files (ru, en, kk, es)       |
| `server/`       | tRPC routers, DB client, auth config               |
| `stores/`       | Zustand state stores                               |
| `types/`        | TypeScript type definitions                        |
| `views/`        | Page-level view components (Editor, Dashboard etc) |
| `__tests__/`    | Jest test suites                                   |
| `App.jsx`       | Legacy monolith (126KB, kept for reference)        |

### Route Groups (Pages)
**App (authenticated):** `src/app/(app)/`
- `/dashboard` — Main dashboard
- `/editor` — Video editor (scenes, AI generation)
- `/thumbnails` — Thumbnail canvas editor (DALL-E 3)
- `/metadata` — SEO metadata optimizer
- `/preview` — Video preview / publish check
- `/tools` — Tools hub (24 tools)
- `/tools/[toolId]` — Individual tool pages
- `/analytics` — YouTube analytics
- `/shorts-analytics` — Shorts analytics
- `/tiktok-analytics` — TikTok analytics
- `/billing` — Stripe subscription management
- `/referral` — Referral program dashboard
- `/settings` — User settings
- `/team` — Team management
- `/admin` — Admin panel
- `/brand` — Brand kit
- `/media` — Media library / asset manager
- `/welcome` — Onboarding flow

**Auth:** `src/app/(auth)/`
- `/login` — Google OAuth login
- `/register` — Registration

**Legal:** `src/app/(legal)/`
- `/terms`, `/privacy`, `/dpa`, `/sla`, `/security`, `/oferta`

**Public:**
- `/` — Landing page
- `/about`, `/contact`, `/help`, `/status`
- `/blog`, `/blog/[slug]`
- `/changelog`, `/api-docs`, `/gallery`
- `/compare/[slug]` — Competitor comparison pages
- `/vpn` — VPN service page
- `/share/[id]` — Public project sharing
- `/profile/[userId]` — Public user profiles

### API Routes
| Route                                | Purpose                                |
|--------------------------------------|----------------------------------------|
| `/api/auth/[...nextauth]`            | Auth.js handlers (Google OAuth)        |
| `/api/trpc/[...trpc]`               | tRPC endpoint                          |
| `/api/webhooks/stripe`              | Stripe webhook handler                 |
| `/api/stripe/webhook`               | Stripe webhook (legacy route)          |
| `/api/health`                        | Health check                           |
| `/api/og`                            | Open Graph image generation            |
| `/api/newsletter`                    | Newsletter signup                      |
| `/api/upload`                        | File upload handler                    |
| `/api/collaboration/stream`         | Real-time collaboration SSE stream     |
| `/api/user/export`                  | GDPR data export                       |
| `/api/v1/projects`                  | Public API for projects                |
| `/api/auth-debug`                   | Auth diagnostics (debug)               |
| `/api/cron/cleanup`                 | Scheduled cleanup tasks                |
| `/api/cron/emails`                  | Drip email sequence cron               |
| `/api/cron/health`                  | Cron health check                      |
| `/api/tools/promo`                  | Tool promotional endpoint              |
| `/api/tools/shorts-analytics`       | Shorts analytics API                   |
| `/api/tools/tiktok-analytics`       | TikTok analytics API                   |
| `/api/tools/tiktok-download`        | TikTok video download                  |
| `/api/tools/tts`                    | Text-to-speech (ElevenLabs)            |
| `/api/tools/video-translate`        | Video translation/dubbing              |
| `/api/tools/youtube-download`       | YouTube video download/analysis        |

### tRPC Routers (`src/server/routers/`)
| Router          | Purpose                                    |
|-----------------|--------------------------------------------|
| `_app.ts`       | Root router (merges all sub-routers)       |
| `admin.ts`      | Admin panel procedures                     |
| `ai.ts`         | AI generation (images, text, scenes)       |
| `analytics.ts`  | YouTube analytics data                     |
| `apikey.ts`     | API key management                         |
| `asset.ts`      | Media asset CRUD                           |
| `billing.ts`    | Stripe checkout, portal, subscription info |
| `brand.ts`      | Brand kit management                       |
| `comment.ts`    | Project comments                           |
| `folder.ts`     | Design folder management                  |
| `media.ts`      | Media library operations                   |
| `project.ts`    | Project CRUD, scenes, sharing              |
| `referral.ts`   | Referral program (code, earnings, payouts) |
| `scene.ts`      | Scene-level operations                     |
| `stock.ts`      | Stock media (Pexels)                       |
| `team.ts`       | Team management, invites, roles            |
| `toolHistory.ts`| Tool usage history tracking                |
| `user.ts`       | User profile, settings, onboarding         |
| `videoTask.ts`  | Async video generation tasks               |
| `vpn.ts`        | WireGuard VPN peer management              |
| `webhook.ts`    | Webhook management                         |
| `youtube.ts`    | YouTube channel/video data                 |

### Database Models (Prisma)
| Model              | Purpose                                        |
|--------------------|------------------------------------------------|
| `User`             | Users with plan (FREE/PRO/STUDIO), role, Stripe ID, referral |
| `Account`          | OAuth provider accounts (NextAuth)             |
| `Session`          | User sessions (NextAuth)                       |
| `VerificationToken`| Email verification tokens                      |
| `Channel`          | YouTube channels linked to users               |
| `Project`          | Video projects with title, tags, thumbnail     |
| `Scene`            | Individual scenes within projects              |
| `Team`             | Team workspaces                                |
| `TeamMember`       | Team membership with roles (OWNER/ADMIN/EDITOR/VIEWER) |
| `TeamActivityLog`  | Team audit trail                               |
| `Asset`            | Uploaded media files                           |
| `DesignFolder`     | Hierarchical folder structure for assets       |
| `ProcessedEvent`   | Stripe webhook idempotency tracking            |
| `Payout`           | Referral earnings payouts                      |
| `VpnPeer`          | WireGuard VPN peer configs                     |
| `AuditLog`         | System-wide audit log                          |

### Zustand Stores (`src/stores/`)
| Store                    | Purpose                              |
|--------------------------|--------------------------------------|
| `useEditorStore`         | Video editor state (scenes, canvas)  |
| `useThemeStore`          | Dark/light theme toggle              |
| `useLocaleStore`         | Language selection (ru/en/kk/es)     |
| `useMetadataStore`       | Metadata editor state                |
| `useThumbnailStore`      | Thumbnail canvas state               |
| `useNotificationStore`   | Toast notifications                  |
| `useMobileMenuStore`     | Mobile menu open/close               |
| `usePresenceStore`       | Real-time collaboration presence     |
| `useVersionStore`        | Project version history              |
| `useActivityStore`       | User activity tracking               |
| `useContentPlannerStore` | Content planner calendar state       |

### Key Libraries (`src/lib/`)
| File                  | Purpose                                          |
|-----------------------|--------------------------------------------------|
| `activity-log.ts`     | Audit log helpers                                |
| `analytics-events.ts` | Analytics event tracking                         |
| `api-keys.ts`         | API key generation/validation                    |
| `blog-posts.ts`       | Blog content data                                |
| `cache.ts`            | In-memory TTL cache                              |
| `changelog.ts`        | Changelog entries                                |
| `constants.ts`        | Theme colors, plan limits, keyboard shortcuts    |
| `crypto.ts`           | Encryption utilities                             |
| `csv.ts`              | CSV export helpers                               |
| `element-presets.ts`  | Canvas element presets                           |
| `email-templates.ts`  | HTML email templates (welcome, drip, etc.)       |
| `email.ts`            | Resend email sending utility                     |
| `env.ts`              | Environment variable validation                  |
| `feature-flags.ts`    | Feature flag system                              |
| `ffmpeg.ts`           | FFmpeg helpers for video processing              |
| `fonts.ts`            | Font definitions for thumbnail editor            |
| `help-articles.ts`    | Help center content                              |
| `history.ts`          | Undo/redo history management                     |
| `i18n.ts`             | i18next initialization                           |
| `logger.ts`           | Structured logging (createLogger)                |
| `rate-limit.ts`       | Rate limiting utility                            |
| `sanitize.ts`         | Input sanitization (XSS prevention)              |
| `security-headers.ts` | Security header definitions                      |
| `storage.ts`          | File storage helpers                             |
| `subtitle-parser.ts`  | SRT/VTT subtitle parsing                         |
| `templates.ts`        | Project/scene templates                          |
| `toolUsageTracker.ts` | Tool usage analytics                             |
| `trpc.ts`             | tRPC client initialization                       |
| `types.ts`            | Shared TypeScript types                          |
| `utils.ts`            | General utility functions                        |
| `validation.ts`       | Input validation schemas (Zod)                   |
| `wireguard.ts`        | WireGuard VPN config generation                  |

---

## 3. FEATURES — WHAT WORKS

### Authentication
| Feature              | Status    | Notes                                      |
|----------------------|-----------|--------------------------------------------|
| Google OAuth         | WORKING   | Auth.js v5, JWT strategy, PrismaAdapter    |
| Dev-login (email)    | DEV ONLY  | Credentials provider, NODE_ENV=development |
| Session caching      | WORKING   | Plan/role cached in JWT, 5-min TTL refresh |
| Rate limiting (auth) | WORKING   | 30 req/min per IP on /api/auth/            |

### Billing (Stripe)
| Feature              | Status    | Notes                                      |
|----------------------|-----------|--------------------------------------------|
| 3 Plans              | WORKING   | FREE / PRO / STUDIO                        |
| Stripe Checkout      | WORKING   | createCheckout mutation                    |
| Customer Portal      | WORKING   | For managing subscriptions                 |
| Webhook handling     | WORKING   | checkout.session.completed, sub events     |
| Plan limits          | WORKING   | Projects, AI gens, storage per plan        |
| Referral system      | WORKING   | Auto-generated codes, earnings, payouts    |

**Plan Limits:**
| Limit            | FREE   | PRO    | STUDIO     |
|------------------|--------|--------|------------|
| Projects         | 3      | 25     | Unlimited  |
| AI Generations   | 5/mo   | 100/mo | Unlimited  |
| Scenes/project   | 10     | 50     | 200        |
| Team members     | 0      | 0      | 10         |
| Storage          | 500MB  | 5GB    | 50GB       |

### Tools (24 total)
| #  | Tool                  | Status    | Category      |
|----|-----------------------|-----------|---------------|
| 1  | Video Editor          | WORKING   | creation      |
| 2  | Thumbnail Editor      | WORKING   | creation      |
| 3  | Metadata Optimizer    | WORKING   | optimization  |
| 4  | Preview/Publish Check | WORKING   | publishing    |
| 5  | AI Image Generator    | WORKING   | ai            |
| 6  | AI Voiceover Generator| WORKING   | ai            |
| 7  | YouTube Video Analyzer| WORKING   | optimization  |
| 8  | Cut & Crop            | WORKING   | video         |
| 9  | Subtitle Editor       | WORKING   | video         |
| 10 | Video Compressor      | WORKING   | free          |
| 11 | MP3 Converter         | WORKING   | free          |
| 12 | Background Remover    | WORKING   | ai            |
| 13 | Video Translator      | WORKING   | audio         |
| 14 | Content Planner       | WORKING   | publishing    |
| 15 | AI Video Generator    | WORKING   | ai (catalog)  |
| 16 | AI Speech Enhancer    | STUB      | ai            |
| 17 | AI Video Gen (Veo3)   | STUB      | ai            |
| 18 | AI Brainstormer       | STUB      | ai            |
| 19 | AI Vocal Remover      | STUB      | ai            |
| 20 | AI Creator            | STUB      | ai            |
| 21 | AutoClip              | STUB      | video         |
| 22 | Subtitle Remover      | STUB      | video         |
| 23 | Reddit Video Generator| STUB      | video         |
| 24 | Fake Texts Video      | STUB      | video         |
| 25 | TikTok Downloader     | STUB      | downloaders   |
| 26 | Audio Balancer        | STUB      | free          |
| 27 | Voice Changer         | STUB      | audio         |
| 28 | AI Face Swap          | STUB      | ai            |
| 29 | Scenario Writer       | STUB      | creation      |
| 30 | Analytics (YouTube)   | STUB      | optimization  |
| 31 | Scheduler             | STUB      | publishing    |

> **15 tools are WORKING**, **16 tools are STUB** (UI card shown, marked as coming soon)

### Core Features
| Feature              | Status    | Notes                                      |
|----------------------|-----------|--------------------------------------------|
| Dashboard            | WORKING   | Project list, stats, featured tools        |
| Editor               | WORKING   | Scene editor, AI generation, canvas        |
| Thumbnails           | WORKING   | Full canvas editor with DALL-E 3           |
| Metadata             | WORKING   | AI-powered title/desc/tag optimizer        |
| Preview              | WORKING   | Pre-publish checklist                      |
| Team management      | WORKING   | Invites, roles (STUDIO plan only)          |
| Settings             | WORKING   | Profile, preferences, notifications        |
| Admin panel          | WORKING   | User management, stats (ADMIN role only)   |
| Media library        | WORKING   | Upload, folders, asset management          |
| Brand kit            | WORKING   | Brand colors, logos, fonts                 |
| Referral program     | WORKING   | Dashboard, codes, earnings tracking        |
| VPN (WireGuard)      | WORKING   | Peer generation, config download           |
| Blog                 | WORKING   | Static blog with slug-based routes         |
| Gallery              | WORKING   | Public project showcase                    |
| Changelog            | WORKING   | Version history page                       |
| Help center          | WORKING   | Help articles                              |
| Status page          | WORKING   | Service health status                      |
| API docs             | WORKING   | Public API documentation                   |
| Onboarding           | WORKING   | Welcome flow with demo project creation    |
| Keyboard shortcuts   | WORKING   | Global + editor shortcuts, help modal      |

### i18n (Internationalization)
| Language   | File          | Key Count |
|------------|---------------|-----------|
| Russian    | `ru.json`     | ~2046     |
| English    | `en.json`     | ~2046     |
| Kazakh     | `kk.json`     | ~2046     |
| Spanish    | `es.json`     | ~2046     |

Default language: Russian (`ru`). Fallback: Russian.

### Email System (Resend)
| Template            | Trigger                              |
|---------------------|--------------------------------------|
| `welcome`           | First sign-in (immediate)            |
| `feature_discovery` | Day 3 after signup (cron)            |
| `social_proof`      | Day 7 after signup (cron)            |
| `upgrade_nudge`     | Day 14, FREE plan only (cron)        |
| `reengagement-day3` | Day 3, inactive users (cron)         |
| `reengagement-day7` | Day 7, inactive users (cron)         |
| `reengagement-day14`| Day 14, inactive users (cron)        |

Email cron runs via `/api/cron/emails` with Bearer token auth (`CRON_SECRET`).

---

## 4. INFRASTRUCTURE

### PM2 Cluster
- **4 instances** of Next.js in cluster mode (port 3000)
- **1 instance** of yt-api (YouTube download proxy)
- **pm2-logrotate** module installed
- Max memory restart: 512MB per instance
- Current status: All 5 processes ONLINE

### Caddy Reverse Proxy
- Auto-SSL via Let's Encrypt for `tubeforge.co`
- `www.tubeforge.co` redirects to `tubeforge.co`
- HSTS with preload, X-Frame-Options DENY, nosniff
- gzip + zstd compression
- 5-minute read/write timeout (for video translation)
- Access logs at `/var/log/caddy/access.log` (10MB rotation, 5 kept)
- Port 80 health check responder

### Database
- **PostgreSQL** — direct connection via DATABASE_URL
- **PgBouncer** — installed and active, but not primary (prepared statement compatibility issues)
- Prisma ORM with comprehensive indexes on all models

### Security
- **fail2ban** — Active with sshd jail
- **Edge rate limiting** — 300 req/min general, 30 req/min auth endpoints
- **Security headers** — HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **CSRF protection** — via Auth.js
- **XSS prevention** — HTML stripping in user-facing inputs, sanitize.ts
- **Stripe webhook signature verification** — constructEvent with signing secret
- **VPN encryption** — AES encryption for WireGuard private keys

### Backups & Maintenance
- **DB backup cron:** Daily at 3:00 AM via `scripts/backup.sh`
- **Health check cron:** Every 5 minutes via `scripts/healthcheck.sh`
- **Swap:** 2GB configured, ~8MB used
- **Memory:** 12GB total, ~4.2GB used
- **Log rotation:** pm2-logrotate module + system logrotate

---

## 5. KNOWN ISSUES / BLOCKERS

| Issue                                    | Severity | Details                                                    |
|------------------------------------------|----------|------------------------------------------------------------|
| Stripe webhook secret placeholder        | MEDIUM   | Verify STRIPE_WEBHOOK_SECRET is real, not placeholder      |
| YooKassa not integrated                  | LOW      | Russian payment system not yet added                       |
| Server location (FZ-242)                 | LOW      | OVH VPS, consider CDN or edge for latency                  |
| PgBouncer not primary                    | LOW      | Active but reverted to direct PG due to prepared statements|
| Jest tests broken                        | MEDIUM   | 154 test suites fail — ESM import issue in setup.ts        |
| ~16 stub tools                           | LOW      | UI cards exist but tools are coming soon                 |
| RESEND_API_KEY may not be set            | LOW      | Emails silently skip if key missing                        |
| High PM2 restart count                   | MEDIUM   | ~566-570 restarts per instance, investigate memory leaks   |

---

## 6. RECENT CHANGES (This Session)

```
d0d8f71 Fix: Creator Run game, streaming download, back nav, project delete, DB schema sync
774a449 Major update: Landing CRO, onboarding, Sentry, dead code cleanup, a11y
ad98d53 CRITICAL: Fix XSS vulnerability in YoutubeDownloader - strip HTML from comments
7d58a76 Fix 15+ bugs from mass testing: security, billing, tools, API
447312c Fix CRITICAL: add /api/og, /api/newsletter, /api/cron, /oferta, /vpn to publicPaths
44dee6d VideoTranslator: replace drop background with add subtitles option
6aa89f0 Add oferta page, email sequence cron, Caddy 5min timeout for video translate
7de95d8 Phase 2-4: Legal compliance, billing rewards, PgBouncer, mobile UX, marketing
761d557 Phase 0-1: Security hardening, infrastructure, SEO, tools fixes, i18n
b44fb86 Add comprehensive commercial launch plan based on 8-agent deep audit
5bbfbea fix: video translator voice quality — default 1 speaker, drop background audio
d3856ff fix: better upload UX — show animated bar instead of 0%
b20e986 fix: video translator — increase upload limit, fix 502 on large files
104569a fix: show real ElevenLabs status instead of fake progress bar
2831182 feat: add Video Translator featured card to dashboard
40346d3 feat: Video Translator — AI dubbing with voice cloning via ElevenLabs
a2a48ca fix: YouTube API TOS compliance — add branding, disclosure, remove monetization
8eb2832 feat: YouTube Analyzer — full competitor analysis with channel stats, comments
937ce30 feat: YouTube Analyzer — full-width grid layout, remove generic tips
b6bce5e feat: redesign YouTube Analyzer with Apple-style circular gauges
```

---

## 7. KEY FILES

| File                                        | Purpose                                       |
|---------------------------------------------|-----------------------------------------------|
| `src/server/auth.ts`                        | Auth.js v5 config — Google OAuth, JWT, callbacks, welcome email, demo project |
| `src/middleware.ts`                          | Edge middleware — rate limiting, auth check, security headers |
| `src/app/api/webhooks/stripe/route.ts`      | Stripe webhook — plan upgrades/downgrades, VPN revocation, emails |
| `src/server/routers/_app.ts`                | Root tRPC router merging all sub-routers       |
| `src/server/routers/billing.ts`             | Stripe checkout, portal, subscription queries  |
| `src/server/routers/ai.ts`                  | AI generation procedures (images, text, scenes)|
| `src/server/routers/project.ts`             | Project CRUD, sharing, public gallery          |
| `src/server/routers/team.ts`                | Team management, invites, role changes         |
| `src/server/routers/referral.ts`            | Referral program logic                         |
| `src/server/routers/vpn.ts`                 | WireGuard VPN peer management                  |
| `src/lib/constants.ts`                      | Theme, plan limits, keyboard shortcuts, canvas defaults |
| `src/lib/email-templates.ts`                | HTML email templates with dark mode support    |
| `src/lib/email.ts`                          | Resend email sending utility                   |
| `src/lib/env.ts`                            | Environment variable validation (Zod)          |
| `src/lib/i18n.ts`                           | i18next initialization (4 languages)           |
| `src/lib/rate-limit.ts`                     | Rate limiting utility                          |
| `src/lib/wireguard.ts`                      | WireGuard config generation/encryption         |
| `src/lib/logger.ts`                         | Structured logger (createLogger)               |
| `src/lib/cache.ts`                          | In-memory TTL cache                            |
| `src/views/Editor/ToolsHub.tsx`             | Tools hub — all 31 tool definitions            |
| `prisma/schema.prisma`                      | Database schema (16 models, enums, indexes)    |
| `ecosystem.config.js`                       | PM2 config (4 cluster instances, port 3000)    |
| `/etc/caddy/Caddyfile`                      | Caddy reverse proxy config                     |
| `scripts/backup.sh`                         | Database backup script (cron daily 3AM)        |
| `scripts/healthcheck.sh`                    | Health check script (cron every 5min)          |

---

## 8. ENVIRONMENT VARIABLES

| Variable                  | Description                                      |
|---------------------------|--------------------------------------------------|
| `DATABASE_URL`            | PostgreSQL connection string                     |
| `AUTH_SECRET`             | Auth.js JWT signing secret                       |
| `AUTH_URL`                | Auth.js base URL (https://tubeforge.co)          |
| `NEXTAUTH_URL`           | NextAuth URL (legacy, same as AUTH_URL)           |
| `AUTH_GOOGLE_ID`          | Google OAuth client ID                           |
| `AUTH_GOOGLE_SECRET`      | Google OAuth client secret                       |
| `STRIPE_SECRET_KEY`       | Stripe API secret key                            |
| `STRIPE_WEBHOOK_SECRET`   | Stripe webhook signing secret                    |
| `STRIPE_PRICE_PRO`        | Stripe price/product ID for PRO plan             |
| `STRIPE_PRICE_STUDIO`     | Stripe price/product ID for STUDIO plan          |
| `OPENAI_API_KEY`          | OpenAI API key (GPT, DALL-E 3)                   |
| `ELEVENLABS_API_KEY`      | ElevenLabs API key (TTS, voice cloning)          |
| `FAL_KEY`                 | fal.ai API key (image/video generation)          |
| `YOUTUBE_API_KEY`         | YouTube Data API key                             |
| `PEXELS_API_KEY`          | Pexels stock media API key                       |
| `COBALT_API_URL`          | Cobalt video download API URL                    |
| `YT_DLP_API_URL`          | yt-dlp download service URL                      |
| `CRON_SECRET`             | Bearer token for cron endpoints                  |
| `VPN_SERVER_ENDPOINT`     | WireGuard VPN server endpoint                    |
| `VPN_SERVER_PUBLIC_KEY`   | WireGuard server public key                      |
| `VPN_ENCRYPTION_KEY`      | AES key for encrypting VPN private keys          |
| `NEXT_PUBLIC_APP_URL`     | Public app URL (https://tubeforge.co)            |
| `NEXT_PUBLIC_YM_ID`       | Yandex Metrika counter ID                        |
| `LOG_LEVEL`               | Logging level (debug/info/warn/error)            |

---

## 9. TEST STATUS

**Status: FAILING**

All 154 test suites fail due to ESM import configuration issue:
```
SyntaxError: Cannot use import statement outside a module
  at src/__tests__/setup.ts:1 — import '@testing-library/jest-dom';
```

**Root cause:** Jest is not configured to handle ESM/TypeScript imports. The `setup.ts` file uses ESM `import` syntax but Jest expects CommonJS. Needs `ts-jest` or `@swc/jest` transformer configuration.

**Test suites exist for:** Editor store, Locale store, Metadata store, Notification store, Theme store, Thumbnail store, and 148 others.

---

## 10. DEPLOYMENT PROCESS

### Standard Deployment
```bash
# SSH into server
ssh ubuntu@57.128.254.111

# Navigate to project
cd /home/ubuntu/tubeforge-next

# Pull latest changes
git pull origin main

# Install dependencies (if package.json changed)
npm install

# Build the application
npm run build

# Reload PM2 (zero-downtime)
pm2 reload ecosystem.config.js

# Verify deployment
pm2 list
curl -s https://tubeforge.co/api/health
```

### Database Migration
```bash
npx prisma migrate deploy    # Apply pending migrations
npx prisma generate          # Regenerate client
npm run build                 # Rebuild with new schema
pm2 reload ecosystem.config.js
```

### Emergency Rollback
```bash
git log --oneline -5          # Find previous good commit
git checkout <commit-hash>    # Checkout stable version
npm run build
pm2 reload ecosystem.config.js
```

### Monitoring
```bash
pm2 logs tubeforge            # Live application logs
pm2 monit                     # CPU/Memory monitoring
tail -f /var/log/caddy/access.log  # HTTP access logs
tail -f /var/log/tubeforge-health.log  # Health check logs
```
