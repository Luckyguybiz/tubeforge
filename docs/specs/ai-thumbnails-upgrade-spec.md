# AI Thumbnails Page Upgrade Specification

**Route:** `/ai-thumbnails`
**Ref:** YGen.app/generate
**Date:** 2026-03-24
**Status:** Ready for development

---

## 1. Executive Summary

Upgrade the existing `/ai-thumbnails` page to match YGen reference design. The page already has full backend API, left/right panel layout, prompt input, voice input, YT URL linking, photo upload, generation, CTR analysis, and history. This spec covers **UI/UX delta** only - what needs to change vs current state.

---

## 2. Gap Analysis: CEO Requirements vs Current State

### FULLY IMPLEMENTED (no changes needed)
| Requirement | Status | Location |
|---|---|---|
| Two modes: scratch / swap | Done | `AiThumbnailsPage.tsx:101, 552-593` |
| Prompt textarea with char counter | Done | `AiThumbnailsPage.tsx:729-745` |
| YT URL link button | Done | `AiThumbnailsPage.tsx:674-688` |
| Image upload as reference | Done | `AiThumbnailsPage.tsx:690-703` |
| Voice input (microphone) | Done | `AiThumbnailsPage.tsx:712-726` |
| "Need an idea?" AI button | Done | `AiThumbnailsPage.tsx:596-624` |
| Count variants: 1/2/3 with PRO badges | Done | `AiThumbnailsPage.tsx:793-821` |
| Format: 16:9 / 9:16 with PRO badge | Done | `AiThumbnailsPage.tsx:824-852` |
| Credit cost display | Done | `AiThumbnailsPage.tsx:856-863` |
| Generate CTA button | Done | `AiThumbnailsPage.tsx:868-911` |
| Top bar: title + icon | Done | `AiThumbnailsPage.tsx:461-489` |
| "My Works" button (links to /thumbnails) | Done | `AiThumbnailsPage.tsx:492-508` |
| Credits badge with lightning icon | Done | `AiThumbnailsPage.tsx:510-526` |
| Post-generation: image display | Done | `AiThumbnailsPage.tsx:1065-1093` |
| Download button | Done | `AiThumbnailsPage.tsx:977-982` |
| Regenerate button | Done | `AiThumbnailsPage.tsx:971-976` |
| History grid/strip | Done | `AiThumbnailsPage.tsx:1287-1319, 1413-1466` |
| PREVIEW badge with format | Done | `AiThumbnailsPage.tsx:948-958` |
| PRO upgrade banner for FREE users | Done | `AiThumbnailsPage.tsx:1471-1505` |
| CTR analysis with scores | Done | `AiThumbnailsPage.tsx:1095-1283` |
| Backend: fal.ai Flux Pro + DALL-E 3 fallback | Done | `aiThumbnails.ts:276-382` |
| Rate limiting + plan enforcement | Done | `aiThumbnails.ts:33-44, 195-250` |

### GAPS TO FIX (changes required)

| # | Gap | Priority | Effort |
|---|---|---|---|
| G1 | Scanner animation during generation | CRITICAL | Medium |
| G2 | Russian progress stage text (localized) | HIGH | Low |
| G3 | Placeholder text before generation | MEDIUM | Low |
| G4 | "Edit" button in post-gen actions | MEDIUM | Low |
| G5 | Plan limits: CEO says Free=3/month, current=3/day | MEDIUM | Low |
| G6 | Accent color #BFFF00 for this page | LOW | Low |

---

## 3. Gap Details and Implementation Specs

### G1: Scanner Animation (CRITICAL)

**Current:** Pulsing star icon + simple progress bar + text label.
**Required:** Full-screen scanner effect inside preview area matching YGen.

#### Visual Spec

```
┌──────────────────────────────────────────────┐
│                                              │
│     ┃  (vertical lime stripe moves L→R)      │
│  ───┃─────────── (horizontal lens flare) ────│
│     ┃                                        │
│     ┃         67%                            │
│     ┃   "Создаём изображение..."             │
│     ┃                                        │
│  ───┃─────────── (horizontal lens flare) ────│
│     ┃                                        │
└──────────────────────────────────────────────┘
```

#### CSS Keyframes (component: `ScannerAnimation`)

```css
/* Vertical scanning stripe - moves left to right over 20s */
@keyframes scanner-sweep {
  0%   { left: -4px; }
  100% { left: calc(100% + 4px); }
}

/* Horizontal lens flare pulse */
@keyframes flare-pulse {
  0%, 100% { opacity: 0.1; }
  50%      { opacity: 0.6; }
}

/* Glow pulse on the vertical stripe */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px #BFFF00, 0 0 40px #BFFF0066; }
  50%      { box-shadow: 0 0 40px #BFFF00, 0 0 80px #BFFF0066; }
}
```

#### Implementation Notes

- Container: `position: relative; overflow: hidden; background: #0D0D0D; border-radius: 12px; aspect-ratio: 16/9`
- Vertical stripe: `position: absolute; width: 3px; height: 100%; background: #BFFF00; animation: scanner-sweep 20s linear forwards; box-shadow: 0 0 30px #BFFF00;`
- Top/bottom horizontal flares: `position: absolute; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #BFFF0066, transparent); animation: flare-pulse 3s ease-in-out infinite;`
- Center percentage: `font-size: 64px; font-weight: 900; color: #BFFF00; text-shadow: 0 0 20px #BFFF0033;`
- Stage text: `font-size: 16px; color: rgba(255,255,255,0.6); margin-top: 8px;`
- Animation duration: 20s (stripe completes in ~20s, progress % follows API response)

#### File to create

`src/components/ai-thumbnails/ScannerAnimation.tsx`

Props:
```typescript
interface ScannerAnimationProps {
  progress: number;  // 0-100
  format: '16:9' | '9:16';
}
```

#### Progress stage text (Russian/i18n)

| Range | i18n Key | Russian | English |
|---|---|---|---|
| 0-20% | `aithumbs.progress.analyzing` | "Анализируем идею..." | "Analyzing idea..." |
| 20-50% | `aithumbs.progress.composing` | "Генерируем композицию..." | "Generating composition..." |
| 50-80% | `aithumbs.progress.creating` | "Создаём изображение..." | "Creating image..." |
| 80-95% | `aithumbs.progress.finishing` | "Финальные штрихи..." | "Final touches..." |
| 95-100% | `aithumbs.progress.done` | "Готово!" | "Done!" |

**NOTE:** Current code already has progress stages but with different breakpoints (30/60/90) and different keys. Update to CEO's 20/50/80/95 breakpoints.

---

### G2: Russian Progress Stage Text (HIGH)

**Current i18n keys to update/add:**

File: `src/lib/i18n.ts` (or locale JSON)

```
aithumbs.progress.analyzing = "Анализируем идею..."
aithumbs.progress.composing = "Генерируем композицию..."  (key exists, update breakpoint)
aithumbs.progress.creating = "Создаём изображение..."
aithumbs.progress.finishing = "Финальные штрихи..."
aithumbs.progress.done = "Готово!"
```

Replace the current 4-stage system (composing/lighting/optimizing/finalizing at 30/60/90) with the 5-stage system at 20/50/80/95.

---

### G3: Placeholder Text Before Generation (MEDIUM)

**Current:** "How it works" 3-step tutorial card grid.
**Required:** Simple centered placeholder text.

#### Spec

Replace the `howto` tab content (or add as the default state before any generation) with:

```
Center-aligned in preview area:
- Icon: sparkle/wand (64x64, muted)
- Heading: "Тут появится твой шедевр"
- Subtext: "Расскажи что хочешь увидеть — AI нарисует!"
- Both use i18n keys
```

i18n keys:
```
aithumbs.placeholder.title = "Тут появится твой шедевр"
aithumbs.placeholder.desc = "Расскажи что хочешь увидеть — AI нарисует!"
```

**ДОПУЩЕНИЕ:** Keep "How it works" as a secondary tab but make the placeholder the default view in the right panel. The `howto` tab content can remain accessible.

---

### G4: "Edit" Button in Post-Generation Actions (MEDIUM)

**Current:** Actions are "Enhance" (AI re-gen), "Regenerate", "Download".
**CEO wants:** "Download", "Edit" (open in Design Studio), "Generate more".

#### Changes

1. Rename "Regenerate" label to "Сгенерировать ещё" / "Generate More"
   - i18n key: `aithumbs.action.generateMore`
2. Add "Редактировать" / "Edit" button that navigates to Design Studio with the generated image
   - i18n key: `aithumbs.action.edit`
   - onClick: `router.push('/design-studio?import=' + encodeURIComponent(selectedImage.url))`
   - **ДОПУЩЕНИЕ:** Design Studio supports `?import=` URL param for loading external images. If not, just navigate to `/design-studio` and show toast about manual import.
3. Keep "Enhance" as is (value-add feature beyond CEO spec)
4. Reorder: Download | Edit | Generate More | Enhance

---

### G5: Plan Limits Mismatch (MEDIUM)

**CEO spec:**
| Plan | Generations | Variants | Formats |
|---|---|---|---|
| Free | 3/month | 1 | 16:9 only |
| Pro | 50/month | 1-3 | 16:9 + 9:16 |
| Studio | Unlimited | 1-3 | 16:9 + 9:16 |

**Current code** (`constants.ts`):
| Plan | `aiThumbnails` (daily) | `aiGenerations` (monthly) | `multiGen` |
|---|---|---|---|
| Free | 3 | 5 | 1 |
| Pro | 100 | 100 | 2 |
| Studio | Infinity | Infinity | 3 |

**Decision needed from CEO/PM:**
- Current `aiThumbnails` limit is **daily** (3/day for Free), CEO says **3/month**
- Current Pro multiGen is 2, CEO says up to 3
- These are config changes in `src/lib/constants.ts`

**ДОПУЩЕНИЕ:** Keep current daily limits as-is since they are more generous than CEO spec. If CEO insists on monthly limits, the `countTodayGenerations` function in `aiThumbnails.ts:51-60` needs refactoring to count monthly instead of daily. Flag for PM decision.

---

### G6: Accent Color #BFFF00 (LOW)

**Current:** Page uses theme system `C.accent` which is `#6366f1` (indigo).
**CEO wants:** `#BFFF00` (lime/neon green) accents.

#### Options

1. **Page-scoped override:** Only on `AiThumbnailsPage`, override `C.accent` to `#BFFF00` and `C.accentDim` to `rgba(191,255,0,0.1)`. Does NOT affect other pages.
2. **Scanner-only:** Use `#BFFF00` only in the ScannerAnimation component, keep rest of page using brand indigo.
3. **Theme-wide:** Change brand accent globally (NOT recommended, affects all pages).

**Recommendation:** Option 1 - page-scoped override. Create a `useMemo` at top of component:

```typescript
const pageC = useMemo(() => ({
  ...C,
  accent: '#BFFF00',
  accentDim: 'rgba(191,255,0,0.1)',
}), [C]);
```

Then use `pageC` instead of `C` throughout the component. This keeps the AI Thumbnails page lime-themed per CEO request without affecting other pages.

**ДОПУЩЕНИЕ:** CEO means lime accent only for this page, not globally.

---

## 4. File Change Matrix

| File | Action | Gap |
|---|---|---|
| `src/components/ai-thumbnails/ScannerAnimation.tsx` | CREATE | G1 |
| `src/views/AiThumbnails/AiThumbnailsPage.tsx` | EDIT | G1, G2, G3, G4, G6 |
| `src/lib/i18n.ts` (or locale files) | EDIT | G2, G3, G4 |
| `src/lib/constants.ts` | EDIT (pending PM decision) | G5 |

---

## 5. ScannerAnimation Component Spec

```typescript
// src/components/ai-thumbnails/ScannerAnimation.tsx
'use client';

interface ScannerAnimationProps {
  progress: number;       // 0-100
  format: '16:9' | '9:16';
  accentColor?: string;   // default '#BFFF00'
}

// Renders:
// 1. Dark container with aspect-ratio matching format
// 2. Vertical glowing stripe animating left-to-right (20s duration)
// 3. Two horizontal lens-flare lines (top 20%, bottom 80%)
// 4. Center: large progress percentage text
// 5. Below percentage: stage description text
// 6. All colors use accentColor prop

// Stage logic:
// progress < 20  → t('aithumbs.progress.analyzing')
// progress < 50  → t('aithumbs.progress.composing')
// progress < 80  → t('aithumbs.progress.creating')
// progress < 95  → t('aithumbs.progress.finishing')
// progress >= 95 → t('aithumbs.progress.done')
```

---

## 6. Integration Points

### In AiThumbnailsPage.tsx

Replace the current loading state block (lines 1030-1064):

**Current:**
```jsx
{isGenerating ? (
  <div>...pulsing star + progress bar...</div>
) : ...}
```

**New:**
```jsx
{isGenerating ? (
  <ScannerAnimation
    progress={progress}
    format={format}
    accentColor="#BFFF00"
  />
) : ...}
```

### Post-generation actions (lines 963-985)

Add "Edit" ActionPill and rename "Regenerate" to "Generate More":

```jsx
<ActionPill label={t('aithumbs.action.download')} ... accent />
<ActionPill label={t('aithumbs.action.edit')} ... onClick={() => router.push('/design-studio?import=...')} />
<ActionPill label={t('aithumbs.action.generateMore')} ... onClick={handleRegenerate} />
<ActionPill label={t('aithumbs.enhance')} ... onClick={handleEnhance} />
```

---

## 7. Backend Status

**No backend changes required.** The existing API routes fully support all CEO requirements:

- `aiThumbnails.generate` - image generation via Flux Pro/DALL-E 3
- `aiThumbnails.suggestIdeas` - AI prompt suggestions
- `aiThumbnails.analyzeThumbnail` - CTR analysis
- `aiThumbnails.edit` - iterative enhancement
- `aiThumbnails.getFaces` - face gallery for swap mode
- `aiThumbnails.deleteGeneration` - cleanup

**RE: Replicate API** - CEO mentioned Replicate but the codebase uses fal.ai (Flux Pro v1.1) which is functionally equivalent and already production-ready. No migration needed unless CEO explicitly requires Replicate branding. `FAL_KEY` env var is already configured in `src/lib/env.ts`.

**RE: Face swap** - CEO mentioned "Replicate face-swap model". Current implementation accepts `photoUrl` in the generate mutation and passes it as context. A dedicated face-swap model (e.g. `lucataco/facefusion` on Replicate) is NOT currently integrated. This would require a separate API endpoint and is flagged as a **future enhancement**.

---

## 8. QA Test Scenarios

| # | Scenario | Expected |
|---|---|---|
| T1 | Load `/ai-thumbnails` as FREE user | Left panel shows, right panel shows placeholder text, credits badge shows remaining |
| T2 | Click "Generate" with prompt | Scanner animation plays with moving stripe, percentage climbs, stage text changes at 20/50/80/95% |
| T3 | Generation completes | Scanner fades, image reveals with blur-to-clear, action buttons appear |
| T4 | Click "Download" | Image downloads as PNG |
| T5 | Click "Edit" | Navigates to Design Studio with image |
| T6 | Click "Generate More" | Re-runs generation with same prompt |
| T7 | Switch format to 9:16 as FREE user | Shows PRO badge, generation uses 16:9 fallback |
| T8 | Exhaust daily limit | Generate button disabled, upgrade prompt appears |
| T9 | Scanner animation responsive | Scanner scales properly on mobile (<900px) |
| T10 | Accent color | All interactive elements use lime #BFFF00, not indigo |

---

## 9. Acceptance Criteria

1. Scanner animation with vertical stripe, lens flares, and percentage is visible during generation
2. Progress stages show correct Russian text at correct percentage thresholds
3. Placeholder state shows "Тут появится твой шедевр" before first generation
4. Post-generation actions include Download, Edit, Generate More
5. Page accent color is #BFFF00 (lime) throughout
6. No other pages are affected by changes
7. Mobile responsive layout preserved
8. All existing functionality (voice, YT URL, photo upload, CTR analysis) continues to work

---

## 10. Out of Scope

- Replicate API migration (fal.ai works, no change needed)
- Face swap model integration (future enhancement)
- Plan limits change to monthly (pending PM decision)
- Global accent color change
- Modifications to other pages
