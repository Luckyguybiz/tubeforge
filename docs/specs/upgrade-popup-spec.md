# Upgrade Popup Modal - Implementation Specification

**Component:** `UpgradePopupModal`
**Location:** `src/components/ui/UpgradePopupModal.tsx`
**Integration point:** `src/views/Dashboard/Dashboard.tsx`
**Status:** Ready for development

---

## 1. Overview

Dark-themed modal shown **once** to **free-plan users** on first `/dashboard` visit. Offers Pro upgrade with monthly/yearly toggle, feature comparison, countdown promo, and Stripe checkout.

---

## 2. Show-once logic (QA Blocker #1 + DevSecOps #3)

### 2.1 localStorage flag

Key: `upgradeModalShown`

**Set the flag on BOTH events:**
- Modal close (X button or Escape key)
- "Pay Now" click (before redirect)

This prevents re-show if user navigates away during Stripe checkout.

### 2.2 Graceful localStorage fallback (DevSecOps Blocker)

```ts
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* silent */ }
}
```

If localStorage is unavailable (Safari private mode, storage full), the modal simply shows again on next visit. No crash, no error.

### 2.3 Pro-subscription gating (QA Blocker #4)

Modal must NOT render if user already has a Pro or Studio plan. Check `profile.data?.plan` from the existing `trpc.user.getProfile.useQuery()` in Dashboard. Pseudocode:

```ts
const shouldShowModal =
  profile.data?.plan === 'FREE' &&
  !safeGetItem('upgradeModalShown');
```

---

## 3. Stripe Price IDs - Server-side only (DevSecOps Blocker #1)

**Price IDs MUST NOT be hardcoded in the client component.**

The modal calls the existing `billing.createCheckout` tRPC mutation, which already reads price IDs from server-side env vars:

| Env var | Purpose |
|---------|---------|
| `STRIPE_PRICE_PRO` | Monthly Pro price |
| `STRIPE_PRICE_PRO_ANNUAL` | Annual Pro price |

### 3.1 Correct price ID per toggle state (QA Blocker #5)

The `createCheckout` mutation already accepts `{ plan: 'PRO', annual: boolean }`. The modal must pass the correct `annual` value matching the Monthly/Yearly toggle:

```ts
createCheckout.mutate({ plan: 'PRO', annual: isYearly });
```

No client-side price ID needed. The existing server router at `src/server/routers/billing.ts:118-129` handles the annual/monthly resolution.

---

## 4. Countdown timer (QA Blockers #2)

### 4.1 Persistent across refresh

Store countdown end timestamp in localStorage:

Key: `upgradePromoEnd`
Value: ISO timestamp string (e.g., `Date.now() + 48 * 60 * 60 * 1000`)

On mount:
1. Read `upgradePromoEnd` from localStorage
2. If missing or expired, set new one (48h from now)
3. Calculate remaining time from stored value

### 4.2 Edge case: timer at 00:00:00

When timer reaches zero:
- Display `00:00:00` (not negative values)
- Keep the modal functional (do NOT auto-dismiss)
- "Limited time promo" badge stays visible, timer frozen at zero
- `clearInterval` on cleanup

### 4.3 Cleanup

```ts
useEffect(() => {
  const interval = setInterval(updateTimer, 1000);
  return () => clearInterval(interval);
}, []);
```

---

## 5. Focus trap + Escape key (QA Blocker #3)

### 5.1 Focus trap

On modal open:
- Focus the first focusable element (Monthly/Yearly toggle)
- Trap Tab/Shift+Tab within modal
- On close, return focus to previously focused element

Implementation: use `useRef` for the modal container, query all focusable elements (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`), cycle through on Tab.

### 5.2 Escape key

```ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);
```

### 5.3 Backdrop click

Clicking the overlay behind the modal also closes it. Event must check `e.target === e.currentTarget` to avoid closing on inner clicks.

---

## 6. UI Specification

### 6.1 Layout

```
+--------------------------------------------------+
|  [X]                                              |
|                                                   |
|  Upgrade to Pro                                   |
|  Get full access to all TubeForge tools           |
|                                                   |
|  [Monthly] [Yearly - Save 40%]    toggle          |
|                                                   |
|  ┌──────────────────────────────────────────────┐ |
|  │ Feature         │   Free   │      Pro        │ |
|  │─────────────────│──────────│─────────────────│ |
|  │ Personalized    │    -     │      check      │ |
|  │ Video Scoring   │    -     │      check      │ |
|  │ Keyword Research│    -     │      check      │ |
|  │ Outliers        │    -     │      check      │ |
|  │ Browser Ext.    │    -     │      check      │ |
|  └──────────────────────────────────────────────┘ |
|                                                   |
|  [Limited time promo]  HH:MM:SS                   |
|                                                   |
|  ~$29/mo~  $17/mo                                 |
|  Total: $17 billed monthly                        |
|                                                   |
|  [ Pay Now ]                                      |
+--------------------------------------------------+
```

### 6.2 Pricing display

| Toggle | Old price | New price | Total text |
|--------|-----------|-----------|------------|
| Monthly | $29/mo | $17/mo | Total: $17 billed monthly |
| Yearly | $29/mo | $17/mo | Total: $204/year ($17/mo) billed annually |

Prices are display-only strings (not from Stripe API). Actual billing handled server-side.

### 6.3 Feature comparison table

| Feature | Free | Pro |
|---------|------|-----|
| Personalized Feed | - | check |
| Video Scoring | - | check |
| Keyword Research | - | check |
| Outliers | - | check |
| Browser Extension | - | check |

### 6.4 Style tokens

| Property | Value |
|----------|-------|
| Overlay | `rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(4px)` |
| Modal bg | Use theme `C.card` (dark) |
| Border | `1px solid` theme `C.border` |
| Border radius | `16px` |
| Max width | `480px` |
| CTA button bg | `#3b82f6` (blue-500) |
| CTA button hover | `#2563eb` (blue-600) |
| Promo badge bg | `rgba(59, 130, 246, 0.15)` |
| Promo badge text | `#60a5fa` |
| Old price | `C.dim` with `text-decoration: line-through` |
| Z-index | `1000` |

---

## 7. Dashboard integration

### 7.1 Lazy-load the modal

```tsx
import { lazy, Suspense } from 'react';
const UpgradePopupModal = lazy(() => import('@/components/ui/UpgradePopupModal'));
```

### 7.2 Render conditionally

Inside `Dashboard()`, after `profile.data` is loaded:

```tsx
{shouldShowModal && (
  <Suspense fallback={null}>
    <UpgradePopupModal onClose={() => setShowUpgradeModal(false)} />
  </Suspense>
)}
```

### 7.3 State management

```tsx
const [showUpgradeModal, setShowUpgradeModal] = useState(false);

useEffect(() => {
  if (
    profile.data &&
    profile.data.plan === 'FREE' &&
    !safeGetItem('upgradeModalShown')
  ) {
    setShowUpgradeModal(true);
  }
}, [profile.data]);
```

---

## 8. Mobile responsiveness

| Viewport | Modal width | Padding | Font scale |
|----------|-------------|---------|------------|
| >= 640px | `max-width: 480px` | `32px` | Base |
| < 640px | `calc(100vw - 32px)` | `20px` | 0.9x |
| < 400px | `calc(100vw - 16px)` | `16px` | 0.85x |

- Feature table scrolls horizontally on very narrow screens
- Pay Now button is `width: 100%` on mobile
- Modal is vertically centered with `max-height: 90vh` and `overflow-y: auto`

---

## 9. Accessibility

- `role="dialog"` and `aria-modal="true"` on modal container
- `aria-labelledby` pointing to heading ID
- Focus trap (see section 5.1)
- Escape key close (see section 5.2)
- All interactive elements keyboard-accessible
- Sufficient color contrast (WCAG AA)

---

## 10. Security checklist (DevSecOps)

| Item | Status | Notes |
|------|--------|-------|
| Stripe price IDs from env vars only | REQUIRED | Use existing `billing.createCheckout` - no client-side IDs |
| No price IDs in JS bundle | REQUIRED | Modal only sends `{ plan: 'PRO', annual: bool }` |
| localStorage graceful fallback | REQUIRED | try/catch wrapper, no crash on unavailability |
| XSS prevention | REQUIRED | No `dangerouslySetInnerHTML`, all strings via React JSX |
| CSP compliance | REQUIRED | No inline scripts, only inline styles (Next.js standard) |

---

## 11. QA test scenarios

### Unit tests (`UpgradePopupModal.test.tsx`)

1. **localStorage flag on close:** Click X -> verify `upgradeModalShown` set -> remount -> modal not shown
2. **localStorage flag on Pay Now:** Click Pay Now -> verify `upgradeModalShown` set before mutation fires
3. **Timer persistence:** Set `upgradePromoEnd` -> remount -> verify timer continues from stored value
4. **Timer at 00:00:00:** Set expired `upgradePromoEnd` -> verify displays `00:00:00`, no negative
5. **Focus trap:** Tab through all focusable elements -> verify cycling within modal
6. **Escape key:** Press Escape -> verify modal closes + flag set
7. **Pro user gating:** Set `profile.data.plan = 'PRO'` -> verify modal never renders
8. **Annual toggle:** Toggle to Yearly -> click Pay Now -> verify `annual: true` passed to mutation
9. **Monthly default:** Load modal -> click Pay Now -> verify `annual: false` passed

### E2E smoke tests

1. New FREE user -> navigate to /dashboard -> modal appears
2. Close modal -> refresh -> modal does NOT appear
3. PRO user -> navigate to /dashboard -> modal does NOT appear

---

## 12. Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/UpgradePopupModal.tsx` | CREATE | Modal component with all logic |
| `src/views/Dashboard/Dashboard.tsx` | MODIFY | Add lazy import + conditional render (lines ~7, ~240-250) |

**No Prisma migration needed** - using localStorage for show-once flag (sufficient for this use case, avoids schema change for a UI preference).

---

## 13. Blocker resolution matrix

| # | Source | Blocker | Resolution |
|---|--------|---------|------------|
| 1 | QA | localStorage on close + Pay Now | Section 2.1 |
| 2 | QA | Persistent countdown timer | Section 4.1 |
| 3 | QA | Timer edge case 00:00:00 | Section 4.2 |
| 4 | QA | Focus trap + Escape key | Section 5 |
| 5 | QA | Pro-subscription gating | Section 2.3 |
| 6 | QA | Correct Stripe price ID per toggle | Section 3.1 |
| 7 | DevSecOps | Stripe price IDs from env vars | Section 3 |
| 8 | DevSecOps | No price IDs in client bundle | Section 3 |
| 9 | DevSecOps | localStorage graceful fallback | Section 2.2 |
| 10 | PM | Lazy-load modal | Section 7.1 |
| 11 | PM | Timer cleanup on unmount | Section 4.3 |
| 12 | PM | Server-side `/api/stripe/checkout` with env mapping | Section 3 (existing tRPC route) |
