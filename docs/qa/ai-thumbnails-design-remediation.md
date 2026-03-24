# AI Thumbnails /ai-thumbnails - Design Lead Remediation Report

**Date:** 2026-03-24
**Author:** Design Lead
**Scope:** Responsive (mobile 375px, tablet 768px, desktop 1440px) + Theme (dark/light)

---

## CRITICAL Issues

| # | Category | Issue | File | Lines | Description |
|---|----------|-------|------|-------|-------------|
| D-1 | Theme | Light theme completely broken | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 12-17, 337 | Page hardcodes dark-only colors (`DARK_BG=#0a0a0a`, `CARD_BG=#141414`, `SURFACE_BG=#1a1a1a`, `color:#fff`, all borders `rgba(255,255,255,...)`) and does NOT import `useThemeStore`. When user switches to light mode, the page renders as a dark island inside the light app shell. Every text, background, and border value is dark-mode only. |
| D-2 | Responsive | "My Works" button hidden on mobile with no alternative | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 380 | `display: isMobile ? 'none' : 'flex'` removes gallery access entirely on mobile. Users on phones have zero way to access their generation history. |

## MAJOR Issues

| # | Category | Issue | File | Lines | Description |
|---|----------|-------|------|-------|-------------|
| D-3 | Responsive | No tablet breakpoint (768px) | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 122-127 | Single boolean `isMobile = window.innerWidth < 900`. At 768px the layout collapses to full-width stacked column, which wastes space. Tablets should get a 2-column layout with narrower left panel (~300px). |
| D-4 | Responsive | Left panel unbounded height on mobile | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 426 | `maxHeight: isMobile ? 'none' : '100%'` means the settings panel (mode tabs + prompt + idea chips + count/format + CTA) can easily exceed viewport height, pushing the result preview completely below the fold. Need `maxHeight: '50vh'` or collapsible sections on mobile. |
| D-5 | Responsive | Top bar overflow on 375px | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 340-405 | Title "TubeForge AI Thumbnails" (15 chars, nowrap) + credits badge compete for space on 375px-wide screens. Title has `whiteSpace: 'nowrap'` (line 368) with no `overflow: hidden` / `textOverflow: ellipsis`, causing horizontal scroll or text clipping. |
| D-6 | UX | `window.prompt()` for YouTube URL input | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 547 | Uses browser native `window.prompt()` dialog instead of a styled inline input/modal. Breaks visual consistency, looks unprofessional, and is not styleable. Should be replaced with inline expandable input field. |
| D-7 | Theme | Gallery modal ignores theme | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 1053-1144 | Gallery modal uses `background: CARD_BG` (#141414), `color: '#fff'`, `rgba(255,255,255,...)` borders - all hardcoded dark. Same as D-1 but in the modal overlay context. |

## MINOR Issues

| # | Category | Issue | File | Lines | Description |
|---|----------|-------|------|-------|-------------|
| D-8 | Responsive | Gallery grid items always 16:9 | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 1129 | `aspectRatio: '16/9'` is hardcoded for all gallery items, even those generated in 9:16 format. Images get cropped/distorted in the gallery view. Should respect original aspect ratio. |
| D-9 | UX | No hover/focus states on interactive elements | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | various | All buttons use inline `style={}` which cannot express `:hover` or `:focus-visible` pseudo-classes. Mode tabs, count/format buttons, action pills, and idea chips lack visual hover feedback. Consider CSS classes or `onMouseEnter`/`onMouseLeave` handlers. |
| D-10 | Responsive | Empty state icon oversized on mobile | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 993-1003 | 80x80px placeholder icon + 40px padding is proportionally large on 375px screens. Reduce to 56x56 on mobile. |
| D-11 | Responsive | Scanner animation percentage text oversized on mobile | `src/views/AiThumbnails/AiThumbnailsPage.tsx` | 900 | `fontSize: 72` for progress percentage is designed for desktop. On mobile (where preview area is narrower), should scale down to ~48px. |
| D-12 | Theme | Loading skeleton uses theme but main page does not | `src/app/(app)/ai-thumbnails/loading.tsx` vs `src/views/AiThumbnails/AiThumbnailsPage.tsx` | - | Loading skeleton correctly uses `useThemeStore` for colors, but the actual page switches to hardcoded dark constants. This causes a visual flash when the page hydrates in light mode - skeleton renders in light theme, then the page snaps to dark. |

---

## Remediation Priority

### Must-fix before merge (CRITICAL + MAJOR):

1. **D-1 + D-7 + D-12**: Integrate `useThemeStore` into `AiThumbnailsPage`. Replace all hardcoded color constants with theme values:
   - `DARK_BG` -> `theme.bg`
   - `CARD_BG` -> `theme.surface`
   - `SURFACE_BG` -> `theme.card`
   - `color: '#fff'` -> `theme.text`
   - `rgba(255,255,255,0.5)` -> `theme.sub`
   - `rgba(255,255,255,0.2)` -> `theme.dim`
   - `rgba(255,255,255,0.06/0.08)` -> `theme.border`
   - `rgba(0,0,0,0.8)` -> `theme.overlayLight`
   - Keep `ACCENT` / `ACCENT_DIM` / `ACCENT_GLOW` as-is (brand color, same in both themes)

2. **D-2**: Add mobile-accessible gallery trigger (e.g., icon-only button in top bar that shows on mobile, or a "My Works" tab/link in the left panel for mobile layout).

3. **D-3**: Add tablet breakpoint. Suggested: `isTablet = width >= 768 && width < 900`. Give tablet a 2-column layout with 300px left panel.

4. **D-4**: Cap left panel height on mobile to `max-height: 50vh; overflow-y: auto` so the preview area remains visible.

5. **D-5**: Add `overflow: hidden; textOverflow: 'ellipsis'; minWidth: 0` to the title span on mobile, or shorten to "AI Thumbnails".

6. **D-6**: Replace `window.prompt()` with an inline expandable text input for YouTube URL.

### Warning only (MINOR - no code changes required now):
- D-8: Gallery grid aspect ratio
- D-9: Hover/focus states
- D-10: Mobile empty state sizing
- D-11: Mobile scanner text sizing
