# Dashboard Upgrade Modal — Implementation Specification

**Status:** Ready for Implementation
**Author:** Clio (Planning)
**Date:** 2026-03-24
**Task:** Всплывающее окно апгрейда для новых пользователей на /dashboard

---

## 1. Overview

A dark-themed modal shown **once** to new free-plan users on their first `/dashboard` visit, offering a PRO plan upgrade with monthly/yearly toggle, feature comparison, countdown promo badge, and a "Pay Now" CTA that routes through the existing authenticated Stripe checkout.

---

## 2. Blocker Resolution Matrix

| # | Source | Blocker | Resolution |
|---|--------|---------|------------|
| 1 | QA Кямран | localStorage flag must persist on both "Pay Now" and "X" close | Flag `tubeforge_upgrade_modal_shown` set **before** any action (close or checkout) — see §4.2 |
| 2 | QA Кямран | Timer must use fixed anchor, not relative | Countdown anchors to `UPGRADE_PROMO_END_DATE` from `src/lib/constants.ts` — see §4.5 |
| 3 | QA Кямран | Mobile layout ≤375px must be correct | Spec includes responsive breakpoints with max-height scroll — see §5.3 |
| 4 | DevSecOps Vault | No Stripe keys/price IDs/session logic client-side | "Pay Now" calls `trpc.billing.createCheckout.useMutation()` exclusively — see §4.4 |
| 5 | Dev Lead Макс | Lazy-load the modal component | `React.lazy()` + `Suspense` in Dashboard.tsx — see §3.2 |
| 6 | Dev Lead Макс | Prices in config, not hardcoded in JSX | All pricing from `UPGRADE_MODAL_CONFIG` in `src/lib/constants.ts` — see §4.3 |
| 7 | Dev Lead Макс | Pay Now → authenticated server route | Uses existing `trpc.billing.createCheckout` mutation — see §4.4 |
| 8 | Dev Lead Макс | localStorage flag set in onClose before redirect | Flag written synchronously before `window.location.assign()` — see §4.2 |
| 9 | Dev Lead Макс | Timer anchored to fixed date | `UPGRADE_PROMO_END_DATE` constant, not `Date.now() + offset` — see §4.5 |

---

## 3. Architecture

### 3.1 New Files

| File | Purpose |
|------|---------|
| `src/components/ui/DashboardUpgradeModal.tsx` | Modal component (~250-350 LOC) |

### 3.2 Modified Files

| File | Change |
|------|--------|
| `src/views/Dashboard/Dashboard.tsx` | Add lazy-loaded modal import + show-once gate logic (~15 LOC) |
| `src/lib/constants.ts` | Add `UPGRADE_MODAL_CONFIG` and `UPGRADE_PROMO_END_DATE` (~30 LOC) |
| `src/locales/en.json` | Add `upgradeModal.*` keys (~20 keys) |
| `src/locales/ru.json` | Add `upgradeModal.*` keys (~20 keys) |
| `src/locales/es.json` | Add `upgradeModal.*` keys (~20 keys) |
| `src/locales/kk.json` | Add `upgradeModal.*` keys (~20 keys) |

### 3.3 Integration in Dashboard.tsx

```tsx
// Lazy-load — blocker #5
const DashboardUpgradeModal = React.lazy(
  () => import('@/components/ui/DashboardUpgradeModal')
);

// Inside Dashboard component:
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const { plan, isLoading: planLoading } = usePlanLimits();

useEffect(() => {
  if (planLoading) return;
  if (plan !== 'FREE') return;
  const flag = localStorage.getItem('tubeforge_upgrade_modal_shown');
  if (!flag) {
    setShowUpgradeModal(true);
  }
}, [plan, planLoading]);

// In JSX — wrap in Suspense
{showUpgradeModal && (
  <Suspense fallback={null}>
    <DashboardUpgradeModal
      onClose={() => {
        localStorage.setItem('tubeforge_upgrade_modal_shown', '1');
        setShowUpgradeModal(false);
      }}
    />
  </Suspense>
)}
```

**Key decisions:**
- `usePlanLimits()` already exists and returns `plan` — reuse it to gate on `FREE` plan only.
- Flag checked **after** plan loads to avoid flash on returning PRO users.
- `Suspense fallback={null}` — no loading spinner for a modal (imperceptible delay).

---

## 4. Component Specification: `DashboardUpgradeModal`

### 4.1 Props Interface

```tsx
interface DashboardUpgradeModalProps {
  onClose: () => void; // Parent handles localStorage + state cleanup
}
```

### 4.2 Show-Once Guard (Blocker #1, #8)

The `onClose` callback provided by Dashboard.tsx **always** sets localStorage before hiding the modal. This is called on:

1. **"X" button click** → `onClose()`
2. **Backdrop click** → `onClose()`
3. **Escape key** → `onClose()`
4. **"Pay Now" click** → `onClose()` is called **synchronously before** `createCheckout` redirect

```tsx
const handlePayNow = () => {
  onClose(); // Sets localStorage FIRST — blocker #8
  createCheckout.mutate(
    { plan: 'PRO', annual: isAnnual },
    {
      onSuccess: (data) => {
        if (data.url) window.location.assign(data.url);
      },
      onError: () => {
        toast.error(t('upgradeModal.checkoutError'));
      },
    }
  );
};
```

**QA verification criteria:** After any dismiss path (X, backdrop, Escape, Pay Now), `localStorage.getItem('tubeforge_upgrade_modal_shown')` must equal `'1'`, and the modal must NOT reappear on page reload or hard refresh.

### 4.3 Pricing Configuration (Blocker #6)

Add to `src/lib/constants.ts`:

```tsx
export const UPGRADE_MODAL_CONFIG = {
  monthly: {
    originalPrice: 19,    // Struck-through display price
    promoPrice: 12,       // Actual monthly price
    currency: '$',
  },
  yearly: {
    originalPrice: 190,   // Struck-through display price (annual total)
    promoPrice: 115,      // Actual annual total
    promoMonthly: 9.58,   // Display as "per month"
    currency: '$',
  },
  features: [
    { key: 'personalizedFeed',  free: true,  pro: true  },
    { key: 'videoScoring',      free: false, pro: true  },
    { key: 'keywordResearch',   free: false, pro: true  },
    { key: 'outliers',          free: false, pro: true  },
    { key: 'browserExtension',  free: false, pro: true  },
  ] as const,
} as const;
```

**Rationale:** Prices are already in `BillingPage.tsx` as `$12/mo` and `$115/yr`. The modal config mirrors these but adds original/promo display values. When pricing changes, update this single config.

### 4.4 Stripe Integration (Blocker #4, #7)

**CRITICAL SECURITY REQUIREMENT:** The modal must contain **zero** Stripe keys, price IDs, or session-creation logic.

```tsx
const createCheckout = trpc.billing.createCheckout.useMutation();

// On "Pay Now":
createCheckout.mutate({ plan: 'PRO', annual: isAnnual });
```

The existing `billing.createCheckout` tRPC procedure:
- **Input:** `{ plan: 'PRO' | 'STUDIO', annual?: boolean }`
- **Server-side:** Resolves the Stripe price ID from `STRIPE_PRICE_PRO` / `STRIPE_PRICE_PRO_ANNUAL` env vars
- **Returns:** `{ url: string | null }` — redirect URL to Stripe Checkout
- **Auth:** Protected route (requires authenticated session)
- **Rate limit:** 5/min per user

No changes needed to the billing router.

### 4.5 Countdown Timer (Blocker #2, #9)

Add to `src/lib/constants.ts`:

```tsx
/** ISO 8601 date string — promo ends at this fixed point in time.
 *  Update this value to extend or restart the promo period.
 *  Set to a past date to disable the promo badge entirely. */
export const UPGRADE_PROMO_END_DATE = '2026-04-30T23:59:59Z';
```

Timer implementation in the modal:

```tsx
const [timeLeft, setTimeLeft] = useState(() =>
  Math.max(0, new Date(UPGRADE_PROMO_END_DATE).getTime() - Date.now())
);

useEffect(() => {
  if (timeLeft <= 0) return;
  const id = setInterval(() => {
    setTimeLeft((prev) => {
      const next = new Date(UPGRADE_PROMO_END_DATE).getTime() - Date.now();
      return Math.max(0, next);
    });
  }, 1000);
  return () => clearInterval(id);
}, [timeLeft > 0]); // Only re-subscribe when crossing zero boundary
```

**Display rules:**
- `timeLeft > 0`: Show badge "Limited time promo" with `DD:HH:MM:SS` countdown
- `timeLeft <= 0`: Hide the promo badge entirely (do NOT show "00:00:00:00")

**QA verification criteria:** Timer must survive page reload and show the same target time. Two tabs opened simultaneously must show identical countdowns (±1s).

### 4.6 State Diagram

```
[Dashboard Mount]
       │
       ▼
  planLoading? ──yes──▶ (wait)
       │ no
       ▼
  plan === 'FREE'? ──no──▶ (skip modal)
       │ yes
       ▼
  localStorage has flag? ──yes──▶ (skip modal)
       │ no
       ▼
  [Show Modal]
       │
       ├── X / Backdrop / Escape
       │       │
       │       ▼
       │   onClose() → set flag → hide modal
       │
       └── Pay Now
               │
               ▼
           onClose() → set flag
               │
               ▼
           createCheckout.mutate()
               │
               ├── onSuccess → redirect to Stripe
               └── onError → toast error
```

---

## 5. UI/UX Specification

### 5.1 Visual Design

- **Backdrop:** `rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(8px)` — consistent with `ShortcutsModal`
- **Modal container:** Dark background (`#1a1a2e` or theme dark surface), `border-radius: 16px`, `max-width: 480px`, centered
- **Z-index:** `9999` — matches existing modal pattern
- **Animation:** Fade-in backdrop (200ms) + slide-up content (300ms cubic-bezier) — reuse `shortcutsModalFadeIn` / `shortcutsModalSlideUp` keyframes

### 5.2 Content Layout (top to bottom)

1. **Close button (X)** — top-right, 32x32 hit target
2. **Header** — "Upgrade to Pro" (h2, bold, white)
3. **Billing toggle** — "Monthly" / "Yearly" pill switcher, blue highlight on active
4. **Price block:**
   - Struck-through original price (gray, smaller)
   - Current promo price (large, white, bold)
   - "/month" or "/year" suffix
5. **Feature comparison table:**
   - Columns: Feature | Free | Pro
   - Rows from `UPGRADE_MODAL_CONFIG.features`
   - Checkmark (green) / dash (gray) icons
6. **Promo badge** — "Limited time promo" with countdown timer, blue/indigo accent background, rounded
7. **Total line** — "Total: $X.XX" right-aligned
8. **"Pay Now" button** — full-width, blue (`#3b82f6`), hover darker, `border-radius: 12px`, bold white text
9. **Loading state** — "Pay Now" shows spinner + disabled state during `createCheckout.isLoading`

### 5.3 Responsive Behavior (Blocker #3)

| Breakpoint | Behavior |
|------------|----------|
| `≥768px` (desktop) | Modal centered, `max-width: 480px`, fixed position |
| `<768px` (tablet) | Modal `width: 90vw`, `max-width: 480px` |
| `≤375px` (mobile) | Modal `width: 100vw`, `max-height: 90vh`, `overflow-y: auto`, `border-radius: 16px 16px 0 0`, docked to bottom of screen (bottom-sheet pattern) |

**Mobile-specific adjustments at ≤375px:**
- Reduce internal padding from `24px` to `16px`
- Price font-size from `2rem` to `1.5rem`
- Feature table font-size from `0.875rem` to `0.8125rem`
- "Pay Now" button height: `48px` minimum (touch-friendly)
- Scroll indicator (subtle gradient fade at bottom edge) if content overflows

**QA verification criteria (mobile ≤375px):**
- No horizontal scroll
- All text readable without truncation
- "Pay Now" button fully visible above keyboard
- Close button accessible (not hidden by notch)
- Content scrollable when overflowing

---

## 6. Accessibility

- `role="dialog"` and `aria-modal="true"` on container
- `aria-labelledby` pointing to heading ID
- Focus trap: Tab cycles within modal (X button → toggle → Pay Now → X button)
- Escape key closes modal
- `aria-live="polite"` on countdown timer (avoid screenreader spam — update only on minute boundaries)
- `tabIndex={-1}` on dialog container, auto-focus on mount

---

## 7. Localization Keys

Add to all locale files (`en.json`, `ru.json`, `es.json`, `kk.json`):

```json
{
  "upgradeModal": {
    "title": "Upgrade to Pro",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "originalPrice": "was ${price}",
    "perMonth": "/month",
    "perYear": "/year",
    "featurePersonalizedFeed": "Personalized Feed",
    "featureVideoScoring": "Video Scoring",
    "featureKeywordResearch": "Keyword Research",
    "featureOutliers": "Outliers",
    "featureBrowserExtension": "Browser Extension",
    "free": "Free",
    "pro": "Pro",
    "promoBadge": "Limited time promo",
    "total": "Total",
    "payNow": "Pay Now",
    "paying": "Processing...",
    "checkoutError": "Checkout failed. Please try again.",
    "included": "Included",
    "notIncluded": "Not included"
  }
}
```

---

## 8. Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User upgrades to PRO mid-session, revisits dashboard | Modal does NOT appear (`plan !== 'FREE'` gate) |
| User clears localStorage | Modal appears again (acceptable — they deliberately cleared storage) |
| `createCheckout` returns `url: null` | Show toast error, modal remains open, flag still set |
| `createCheckout` network error | Show toast error, modal remains open, flag still set |
| Promo end date is in the past | Promo badge hidden, prices still shown normally |
| User on STUDIO plan | Modal does NOT appear (`plan !== 'FREE'` gate) |
| User is unauthenticated | Dashboard requires auth — not reachable without session |
| Slow network (checkout takes >3s) | "Pay Now" shows loading spinner, button disabled |
| Multiple rapid "Pay Now" clicks | Button disabled during `createCheckout.isLoading` — rate limit also server-side (5/min) |

---

## 9. Testing Requirements (QA Кямран Scenarios)

### T1: Show-Once Logic
1. Log in as free user → navigate to `/dashboard`
2. Assert modal is visible
3. Close modal (X button)
4. Assert `localStorage.getItem('tubeforge_upgrade_modal_shown') === '1'`
5. Reload page (F5) → assert modal does NOT appear
6. Hard refresh (Ctrl+Shift+R) → assert modal does NOT appear
7. Open new tab → navigate to `/dashboard` → assert modal does NOT appear

### T2: Monthly/Yearly Toggle
1. Assert default state is "Monthly"
2. Toggle to "Yearly" → assert price shows annual values from config
3. Toggle back to "Monthly" → assert price shows monthly values
4. Click "Pay Now" on Yearly → assert `createCheckout` called with `{ plan: 'PRO', annual: true }`

### T3: Countdown Timer
1. Assert timer shows `DD:HH:MM:SS` format
2. Wait 2 seconds → assert timer decreased by ~2 seconds
3. Open two tabs → assert both show same countdown (±1s)
4. If promo expired → assert promo badge is hidden

### T4: Stripe Redirect
1. Click "Pay Now" → assert `trpc.billing.createCheckout` mutation called
2. Assert no Stripe keys in client bundle (`grep -r 'sk_test\|sk_live\|price_' src/components/ui/DashboardUpgradeModal.tsx` returns empty)
3. Assert redirect to Stripe checkout URL on success

### T5: Close Button & Backdrop
1. Click X → assert modal closes, flag set
2. Reopen scenario: clear flag, reload → click backdrop → assert modal closes, flag set
3. Press Escape → assert modal closes, flag set

### T6: Mobile Layout (≤375px)
1. Set viewport to 375x667 (iPhone SE)
2. Assert no horizontal scrollbar
3. Assert "Pay Now" button fully visible
4. Assert content scrollable if overflowing
5. Assert close button not obscured

---

## 10. Security Checklist (DevSecOps Vault)

- [ ] **No Stripe keys client-side** — component uses only `trpc.billing.createCheckout` mutation
- [ ] **No price IDs client-side** — server resolves price IDs from env vars
- [ ] **No session-creation logic client-side** — Stripe session created server-side in `billing.ts`
- [ ] **Authenticated route** — `createCheckout` is a protected tRPC procedure
- [ ] **Rate limited** — 5 actions/min/user on `createCheckout`
- [ ] **No XSS vectors** — all display values from constants or locale keys, no dangerouslySetInnerHTML
- [ ] **localStorage key** — plain flag ('1'), no sensitive data stored

---

## 11. Implementation Checklist (Dev Lead Макс)

- [ ] Add `UPGRADE_MODAL_CONFIG` and `UPGRADE_PROMO_END_DATE` to `src/lib/constants.ts`
- [ ] Add locale keys to `en.json`, `ru.json`, `es.json`, `kk.json`
- [ ] Create `src/components/ui/DashboardUpgradeModal.tsx`
- [ ] Integrate in `Dashboard.tsx` with `React.lazy()` + `Suspense`
- [ ] Verify lazy chunk splits correctly (`npm run build` — check for separate chunk)
- [ ] Test all 6 QA scenarios (T1–T6)
- [ ] Run `grep -r 'sk_test\|sk_live\|price_\|whsec_' src/components/ui/DashboardUpgradeModal.tsx` — must return empty
- [ ] Verify mobile layout on 375px viewport
