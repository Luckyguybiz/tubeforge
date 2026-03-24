# DevSecOps Security Audit: Dashboard Upgrade Modal

**Date:** 2026-03-24
**Auditor:** Pipe (DevSecOps)
**Component:** `DashboardUpgradeModal` (QA stub at `src/components/ui/DashboardUpgradeModal.tsx`)
**Related:** `src/server/routers/billing.ts`, `src/lib/env.ts`, `src/lib/security-headers.ts`

---

## 1. Stripe priceId — Environment Variable Verification

### Status: PASS

**Requirement:** Stripe price IDs must be loaded from environment variables, never hardcoded in source code.

**Findings:**

| Layer | File | Status |
|-------|------|--------|
| Server env registry | `src/lib/env.ts:56-59` | `STRIPE_PRICE_PRO`, `STRIPE_PRICE_STUDIO`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_STUDIO_ANNUAL` all read from `process.env` |
| Billing router | `src/server/routers/billing.ts:121-129` | Price resolution uses `env.STRIPE_PRICE_PRO` / `env.STRIPE_PRICE_PRO_ANNUAL` — no hardcoded `price_xxx` or `prod_xxx` |
| `.env.example` | Lines 34-42 | Placeholder values (`price_xxx`) documented correctly |
| Client component (QA stub) | `DashboardUpgradeModal.tsx:118-121` | Calls `createCheckout.mutate({ plan: 'PRO' })` — sends plan name, not price ID. Server resolves price from env. |
| Source code scan | `src/**/*.{ts,tsx}` | All `price_` / `sk_` / `prod_` literals appear only in test files (`__tests__/`) |

**Conclusion:** No Stripe secrets or price IDs are hardcoded in production code. The architecture correctly separates plan selection (client) from price resolution (server). The `billing.createCheckout` endpoint accepts `{ plan: 'PRO'|'STUDIO', annual?: boolean }` and resolves the actual Stripe price ID server-side from validated env vars.

---

## 2. localStorage Unavailability — Graceful Fallback

### Status: PASS

**Requirement:** The component must handle `localStorage` being unavailable (private browsing, disabled storage, storage quota exceeded) without crashing.

**Findings:**

The QA stub implements `safeGetItem` / `safeSetItem` wrapper functions (lines 28-42):

```typescript
function safeGetItem(key: string): string | null {
  try { return window.localStorage.getItem(key); }
  catch { return null; }
}

function safeSetItem(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); }
  catch { /* Graceful fallback */ }
}
```

**Behavior when localStorage is unavailable:**
- `safeGetItem` returns `null` → modal shows (correct — fail-open for promo display)
- `safeSetItem` silently catches → flag not persisted → modal may reappear on next visit
- No `window.localStorage` access outside these wrappers — no unguarded throws

**Assessment:** Fail-open behavior (showing the modal again) is acceptable for a promotional component. The alternative (fail-closed, never showing) would hurt conversion. No crash path exists.

---

## 3. CSP / Security Headers Compatibility

### Status: PASS

**Findings:**

| CSP Directive | Modal Requirement | Status |
|---------------|-------------------|--------|
| `style-src 'self' 'unsafe-inline'` | Component uses inline `style={}` props | Compatible |
| `connect-src 'self' ... https://js.stripe.com` | tRPC calls go to `'self'`; Stripe checkout is a page navigation (`window.location.href`), not a fetch | Compatible |
| `frame-ancestors 'none'` | Modal is not an iframe | No conflict |
| `script-src 'self' 'unsafe-inline'` | No inline scripts in modal | Compatible |

---

## 4. Additional Security Findings

### 4.1 MEDIUM — `annual` parameter not passed to checkout mutation

**File:** QA stub `DashboardUpgradeModal.tsx:118-121`

```typescript
const handlePayNow = useCallback(() => {
  safeSetItem(STORAGE_KEY, '1');
  const plan = interval === 'yearly' ? 'PRO' : 'PRO';
  createCheckout.mutate({ plan }); // Missing: annual field
}, [interval, createCheckout]);
```

The billing router expects `{ plan, annual?: boolean }` (billing.ts:72). Without `annual: true` for yearly interval, the server always resolves to `STRIPE_PRICE_PRO` (monthly), making the yearly toggle non-functional for billing.

**Recommended fix for dev team:**
```typescript
createCheckout.mutate({ plan: 'PRO', annual: interval === 'yearly' });
```

**Severity:** MEDIUM — functional bug, not a security vulnerability. No code change made per review policy.

### 4.2 LOW — Display prices hardcoded client-side

**File:** QA stub lines 54-57

```typescript
const PRICES = {
  monthly: { original: 29, discounted: 19 },
  yearly: { original: 290, discounted: 149 },
};
```

Display prices are static in the component. If Stripe prices change, the modal will show stale amounts. For MVP this is acceptable — the actual charge amount is determined server-side by Stripe. There is no financial risk (user sees accurate price on Stripe checkout page), but it could cause confusion.

**Recommendation:** Consider fetching display prices from a server endpoint or config in a future iteration.

**Severity:** LOW — UX inconsistency risk, not a security issue.

### 4.3 LOW — Countdown timer resets on page refresh

**File:** QA stub line 96

```typescript
const countdown = useCountdown(Date.now() + 24 * 60 * 60 * 1000);
```

The 24-hour countdown restarts from `Date.now()` on every mount. It does not persist the deadline to localStorage. Users can "reset" the timer by refreshing. This is a UX honesty concern, not a security issue.

**Recommendation:** Persist countdown deadline to localStorage alongside the seen flag, or use a server-side promo expiration timestamp.

**Severity:** LOW — No security impact.

### 4.4 INFO — Modal does not check existing subscription status

The component shows for all users whose `localStorage` flag is unset, including users who may already be on Pro plan. The dev team should consider gating on `user.plan === 'FREE'` from the profile query to avoid showing upgrade prompts to paying subscribers.

---

## 5. Rate Limiting & Auth

### Status: PASS

The `billing.createCheckout` endpoint (billing.ts:73-74) applies:
- `protectedProcedure` — requires authenticated session
- `checkBillingRate` — 5 requests per minute per user

No additional rate limiting needed for the modal's checkout button.

---

## 6. Summary

| Check | Result | Severity |
|-------|--------|----------|
| Stripe priceId from env vars only | PASS | — |
| localStorage graceful fallback | PASS | — |
| CSP/security headers compatible | PASS | — |
| `annual` param missing in checkout call | WARNING | MEDIUM |
| Display prices hardcoded client-side | WARNING | LOW |
| Countdown timer not persisted | WARNING | LOW |
| No subscription status gate | INFO | LOW |
| Auth + rate limiting on billing endpoint | PASS | — |
| No XSS vectors (no user input rendered) | PASS | — |
| No secrets in client bundle | PASS | — |

**Overall verdict:** No CRITICAL or HIGH issues. The component is safe to implement. The MEDIUM finding (missing `annual` parameter) should be addressed by the dev team during implementation. All LOW items are documented for future improvement.
