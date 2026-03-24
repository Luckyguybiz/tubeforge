# DevSecOps Security Audit — Dashboard Upgrade Popup Modal

**Date:** 2026-03-24
**Auditor:** DevSecOps Pipe (CI/CD & Security)
**Scope:** Stripe integration security for the new `UpgradePopupModal` component and its server-side checkout flow
**Branch:** climpire/2c04d217
**Verdict:** PASS (with 2 advisory warnings)

---

## 1. Subtask #9 — Stripe API Key Hygiene

**Status: PASS**

| Check | File | Result |
|-------|------|--------|
| `STRIPE_SECRET_KEY` loaded from env | `src/lib/env.ts:54` | `requireEnv('STRIPE_SECRET_KEY')` — crashes on startup if missing in production |
| No `NEXT_PUBLIC_STRIPE*` env vars | Full codebase grep | Zero matches — secret key never exposed to browser bundle |
| `next.config.ts` env block | `next.config.ts:10-13` | Only `AUTH_URL` and `NEXTAUTH_URL` exposed — no Stripe vars |
| `.gitignore` covers `.env*` | `.gitignore:9-16` | All `.env`, `.env.*`, `.env.local`, `.env.production`, `.env.staging` excluded |
| Server-side Stripe instantiation | `billing.ts:18-20`, `webhooks/stripe/route.ts:12-14` | Both use `env.STRIPE_SECRET_KEY` — server-only module |
| Price IDs from env, not client | `billing.ts:121-129` | `env.STRIPE_PRICE_PRO`, `env.STRIPE_PRICE_PRO_ANNUAL` etc. — never sent to browser |
| Client component has zero secrets | `UpgradePopupModal.tsx` | No API keys, price IDs, or Stripe objects — calls tRPC `billing.createCheckout` only |

### Conclusion
Stripe secret key is loaded exclusively from environment variables via the validated `env` module, instantiated only on the server, and never leaked to the client bundle. **No remediation required.**

---

## 2. Subtask #10 — Broader Security Audit

### 2.1 Webhook Signature Verification — PASS

- `src/app/api/webhooks/stripe/route.ts:37-41`: Uses `stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)` to verify every incoming webhook
- Missing signature header returns 400 immediately (line 31)
- Payload size capped at 1MB (line 18)

### 2.2 Idempotency Guards — PASS

All 8 webhook event handlers use the `ProcessedEvent` table with unique constraint on `stripeEventId`:
- `checkout.session.completed` (line 121)
- `customer.subscription.deleted` (line 156)
- `customer.subscription.updated` (lines 192, 220)
- `customer.subscription.created` (line 286)
- `customer.subscription.paused` (line 321)
- `customer.subscription.resumed` (line 354)
- `invoice.paid` (line 461 — via unique constraint on `Payout.stripeEventId`)
- `invoice.payment_failed` (line 523)

Duplicate events are caught via `P2002` Prisma unique constraint violations and logged as warnings.

### 2.3 Rate Limiting — PASS

- `billing.ts:13-16`: `checkBillingRate()` enforces 5 requests/minute/user on `createCheckout`, `createPortal`, `cancelSubscription`, `reactivateSubscription`
- Uses the shared `rateLimit()` utility with user-specific identifier

### 2.4 Authentication — PASS

- All billing procedures use `protectedProcedure` (requires valid session)
- `createCheckout` validates `plan` enum (`PRO` | `STUDIO`) and `annual` boolean via Zod schema
- Race condition on Stripe customer creation handled atomically (`updateMany` with `stripeId: null` guard, line 93)

### 2.5 Content Security Policy — PASS

- `src/lib/security-headers.ts:17`: `connect-src` includes `https://js.stripe.com` for Stripe.js
- `frame-ancestors 'none'` prevents clickjacking
- `object-src 'none'` blocks plugin-based attacks
- HSTS with 2-year max-age, includeSubDomains, preload (line 44)

### 2.6 Client-Side Data Privacy — PASS

- `UpgradePopupModal.tsx` stores only 2 items in localStorage:
  - `tf_upgrade_popup_shown` — string `"1"` (boolean flag)
  - `tf_upgrade_popup_deadline` — numeric timestamp
- No PII, tokens, or session data stored client-side

### 2.7 Checkout URL Validation — PASS (with advisory)

- `UpgradePopupModal.tsx:61`: `data.url.startsWith('https://')` prevents non-HTTPS redirects
- URL originates from Stripe API `checkout.sessions.create()` which always returns `https://checkout.stripe.com/...`

---

## 3. Advisory Warnings (MEDIUM/LOW — No Code Changes Required)

### W-1: Checkout URL Domain Allowlist (MEDIUM)

**File:** `src/components/ui/UpgradePopupModal.tsx:61`
**Finding:** The URL is validated as HTTPS but not restricted to Stripe domains. Since the URL comes directly from the Stripe SDK response (not user input), exploitation risk is negligible — an attacker would need to compromise the Stripe API itself.
**Recommendation:** For defense-in-depth, consider adding a domain check: `url.startsWith('https://checkout.stripe.com')`. This is advisory only; no code change required for this release.

### W-2: Webhook Secret Optional in Dev (LOW)

**File:** `src/lib/env.ts:55`
**Finding:** `STRIPE_WEBHOOK_SECRET` uses `optionalInDev()` — returns empty string in development mode. This is acceptable for local dev but production must enforce it.
**Current mitigation:** In production, `optionalInDev()` throws if the var is missing (line 35-36). This is sufficient.
**Recommendation:** Ensure CI/CD pipeline validates that `STRIPE_WEBHOOK_SECRET` is set before production deploy. Advisory only.

---

## 4. Cross-Reference with QA Findings

| QA Finding | DevSecOps Assessment |
|------------|---------------------|
| Missing Escape key handler | UX issue, not security — no impact |
| Z-index collision risk | UI layering issue, not security — no impact |
| No focus trap | Accessibility concern; minor phishing vector if modal can be tabbed behind — LOW risk, acceptable |
| Pay button active after timer expiry | Business logic decision — checkout still validates server-side, no security impact |

---

## 5. Final Verdict

| Category | Status |
|----------|--------|
| Stripe secret key hygiene | **PASS** |
| No client-side secret exposure | **PASS** |
| Webhook signature verification | **PASS** |
| Idempotency on all events | **PASS** |
| Rate limiting on billing ops | **PASS** |
| Input validation (Zod) | **PASS** |
| CSP / security headers | **PASS** |
| localStorage data privacy | **PASS** |
| Overall | **PASS** — Ship-ready with 2 advisory notes |

No CRITICAL or HIGH severity issues found. The implementation follows Stripe security best practices.
