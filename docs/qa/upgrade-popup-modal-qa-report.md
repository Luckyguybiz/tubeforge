# QA Report: UpgradePopupModal

**Component**: `src/components/ui/UpgradePopupModal.tsx`
**Integration**: `src/views/Dashboard/Dashboard.tsx` (line 313)
**Date**: 2026-03-24
**Test file**: `src/__tests__/components/UpgradePopupModal.test.tsx` (28 tests, all passing)

---

## Test Coverage Summary

| Scenario | Tests | Status |
|----------|-------|--------|
| Show-once logic (first visit shows, reload doesn't) | 3 | PASS |
| New-user gate (FREE only, PRO/STUDIO blocked) | 3 | PASS |
| Monthly/Yearly toggle (price switching) | 4 | PASS |
| Countdown timer (render, persist, tick, expire) | 4 | PASS |
| Close button + backdrop dismiss | 2 | PASS |
| Pay Now (mutate params, localStorage flag) | 3 | PASS |
| Feature comparison table (all 5 rows + headers) | 2 | PASS |
| Promo badge ("Limited time promo") | 1 | PASS |
| Accessibility (role, aria-modal, aria-label) | 2 | PASS |
| Total due / header content | 4 | PASS |
| **Total** | **28** | **ALL PASS** |

---

## Code Review Findings

### MEDIUM — Missing Escape key handler

**File**: `UpgradePopupModal.tsx`
**Severity**: MEDIUM
**Description**: The modal does not close when pressing the Escape key. This is a standard UX expectation for modals and is required by WAI-ARIA dialog pattern.
**Recommendation**: Add `useEffect` with `keydown` listener for Escape that calls `handleClose`.

### MEDIUM — Z-index collision risk

**File**: `UpgradePopupModal.tsx:143`
**Severity**: MEDIUM
**Description**: The modal content uses `Z_INDEX.MODAL_BACKDROP + 1 = 1000`, which equals `Z_INDEX.CONTEXT_MENU (1000)`. If a context menu were somehow triggered behind the modal, it could render at the same z-level.
**Recommendation**: Consider adding a dedicated `MODAL_CONTENT` z-index value to `constants.ts` (e.g., 1050) between `CONTEXT_MENU` and `DROPDOWN`.

### LOW — No focus trap

**File**: `UpgradePopupModal.tsx`
**Severity**: LOW
**Description**: The modal does not trap keyboard focus. Tab key can move focus to elements behind the modal backdrop. This is a WAI-ARIA best practice for modal dialogs.
**Recommendation**: Implement focus trapping or use a library like `@radix-ui/react-dialog`.

### LOW — Pay button active after timer expiry

**File**: `UpgradePopupModal.tsx:361`
**Severity**: LOW
**Description**: When the countdown expires and shows "Offer expired", the Pay Now button remains active. User can still click to initiate checkout. This may be intentional (offer still works, just urgency messaging changes) but should be confirmed with product.
**Recommendation**: Confirm with PM whether the button should be disabled or the promo pricing should change after expiry.

### INFO — Stripe URL validation

**File**: `UpgradePopupModal.tsx:61`
**Severity**: INFO
**Description**: The `onSuccess` callback validates `data.url && data.url.startsWith('https://')`. The backend can return `{ url: null, updated: true }` when updating an existing subscription (billing.ts:180). In that case, the modal would show error toast "Failed to create checkout session" even though the operation succeeded. This is not reachable in practice since the modal only shows for FREE users who have no existing subscription, but worth documenting.

### INFO — Unused theme variable

**File**: `UpgradePopupModal.tsx:57`
**Severity**: INFO
**Description**: `const C = useThemeStore((s) => s.theme)` is declared but never used in the render output — the component uses hardcoded dark theme colors (e.g., `#1a1a2e`, `#3b82f6`). This means the modal won't adapt to the user's selected theme. This may be intentional for the "dark modal" design requirement.

---

## Requirement Verification Matrix

| Requirement | Status | Notes |
|---|---|---|
| Show on first /dashboard visit | VERIFIED | 800ms delay then renders |
| Show ONLY 1 time (localStorage flag) | VERIFIED | `tf_upgrade_popup_shown` key set to '1' on close/pay |
| Show ONLY for new/free users | VERIFIED | `userPlan !== 'FREE'` early return |
| Monthly/Yearly toggle | VERIFIED | Switches between $12/mo and $115/yr |
| Struck-through original prices | VERIFIED | `text-decoration: line-through` on $19/$228 |
| Feature comparison (5 rows) | VERIFIED | Personalized Feed, Video Scoring, Keyword Research, Outliers, Browser Extension |
| "Limited time promo" badge + timer | VERIFIED | 72h countdown, persisted in localStorage |
| Total due display | VERIFIED | Shows dynamic price matching selected plan |
| "Pay Now" -> Stripe checkout | VERIFIED | Calls `billing.createCheckout.mutate({ plan: 'PRO', annual })` |
| Close button (X) | VERIFIED | Top-right, sets show-once flag |
| Dark modal design | VERIFIED | `#1a1a2e` bg, `#3b82f6` blue accents |
| Rounded corners | VERIFIED | `borderRadius: 20` on modal |
| Mobile responsive | VERIFIED | `width: calc(100vw - 32px)`, `maxHeight: calc(100dvh - 80px)`, `overflowY: auto` |
| No existing page changes | VERIFIED | Only adds component + single render line in Dashboard.tsx |

---

## DevSecOps Notes (for Vault team)

- Stripe secret key is loaded from `env.STRIPE_SECRET_KEY` via `@/lib/env` (server-side only in `billing.ts`). No hardcoded keys found.
- The `annual` parameter passed to `createCheckout` is validated server-side via `z.boolean().optional()` in the Zod schema.
- `createCheckout` is behind `protectedProcedure` (requires authentication) and rate-limited (5/min/user).
- No PII is stored in localStorage — only a boolean flag and a numeric timestamp.
