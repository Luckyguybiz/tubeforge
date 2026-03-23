# Multi-Publisher - Design Specification
**Version:** 1.0 | **Date:** 2026-03-23 | **Author:** Design Team (Паша)

---

## 1. Overview

Multi-Publisher - инструмент публикации видео на YouTube, TikTok и Instagram из одного окна. Два таба: **Публикация** и **Планер**.

**Градиент:** `#0ea5e9` → `#6366f1` (sky-blue → indigo)
**Категория:** `publishing` | **Badge:** `NEW`

---

## 2. Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Gradient Start | `#0ea5e9` | Primary accent, active tabs, today marker |
| Gradient End | `#6366f1` | Gradient endpoints, button hover |
| YouTube | `#ff0000` | Platform chip border/text when active |
| TikTok | `#010101` | Platform chip border/text when active |
| Instagram | `#e1306c` | Platform chip border/text when active |
| Status: Draft | `#6b7280` | Badge background @ 20% opacity |
| Status: Scheduled | `#3b82f6` | Badge background @ 20% opacity |
| Status: Publishing | `#f59e0b` | Badge background @ 20% opacity |
| Status: Published | `#10b981` | Badge background @ 20% opacity |
| Status: Failed | `#ef4444` | Badge background @ 20% opacity |

---

## 3. Layout Structure

```
┌─────────────────────────────────────────┐
│ ToolPageShell (max-w: 800px centered)   │
│ ┌─────────────────────────────────────┐ │
│ │ Header: Title + Subtitle + Badge    │ │
│ └─────────────────────────────────────┘ │
│ ┌──────────────┬──────────────────────┐ │
│ │ Tab: Publish │ Tab: Planner         │ │
│ └──────────────┴──────────────────────┘ │
│                                         │
│ [Active Tab Content]                    │
│                                         │
└─────────────────────────────────────────┘
```

### Tab Bar
- Container: `surface` bg, `border` border, `border-radius: 10px`, `padding: 4px`
- Tab button: `flex: 1`, `padding: 10px 16px`, `border-radius: 8px`
- Active: gradient bg @ 12% opacity, gradient[0] text, `font-weight: 700`
- Inactive: transparent bg, `sub` text, `font-weight: 500`
- Transition: `all 0.2s ease`

---

## 4. Tab: Publish

### 4.1 Video Upload
- Uses shared `UploadArea` component (accept: `video/*`)
- After upload: card with video icon (48x48, gradient bg @ 12%), file name (truncated), file size, remove button
- Card: `padding: 16px`, `border-radius: 12px`, `surface` bg, `border` border

### 4.2 Title Input
- Label: `font-size: 13px`, `font-weight: 600`
- Input: full-width, `padding: 10px 14px`, `border-radius: 10px`, `max-length: 200`

### 4.3 Description Textarea
- Same label style
- Textarea: `rows: 4`, `resize: vertical`, same border/radius as input

### 4.4 Tags Input
- Chip-style tag display with `#` prefix
- Chip: `padding: 3px 10px`, `border-radius: 6px`, gradient bg @ 8%, gradient text
- Inline input grows within the container
- Enter/comma adds a tag

### 4.5 Platform Selection
- 3 toggle-style buttons in a flex row (gap: 10px, wrap)
- Button: `padding: 10px 18px`, `border-radius: 10px`
- Active: `2px solid {platform color}`, tinted bg, bold text, checkmark icon
- Inactive: `2px solid {border}`, `surface` bg
- Each button: Platform SVG icon (20x20) + platform name + optional checkmark

### 4.6 Platform Adaptation Preview
- Shown when >= 1 platform + title filled
- Cards in flex row (gap: 12px, wrap, `flex: 1 1 220px`, `min-width: 200px`)
- Each card: platform icon, name, aspect ratio spec, character counts
- Over-limit: red `#ef4444` text with `!` marker
- Specs:
  - YouTube: title 100, desc 5000, aspect 16:9
  - TikTok: title 150, desc 2200, aspect 9:16
  - Instagram: title N/A, desc 2200, aspect 1:1 / 9:16

### 4.7 Schedule Toggle
- Button with calendar icon, toggles datetime-local input
- `padding: 8px 16px`, `border-radius: 8px`
- Active state: gradient[0] text color

### 4.8 Action Button
- Uses shared `ActionButton` with gradient glow
- Text: "Publish Now" or "Schedule Publication" depending on schedule state
- Disabled when: no video OR empty title OR no platforms selected

---

## 5. Tab: Planner

### 5.1 Calendar Navigation
- Flex row: prev arrow, "Month Year" label (16px, bold), next arrow
- Nav buttons: 32x32, `surface` bg, `border` border, `border-radius: 8px`

### 5.2 Calendar Grid
- 7-column CSS Grid, gap: 2px
- Day headers: 11px, bold, `dim` color
- Day cells: `min-height: 64px`, `padding: 4px`, `border-radius: 8px`
- Empty cells: transparent
- Today cell: `2px solid gradient[0]`, bold day number in gradient color
- Scheduled items in cells: 10px text, status-colored bg @ 12%, truncated

### 5.3 Scheduled Publications List
- Section title: 15px, bold
- Empty state: dashed border, centered dim text
- Item card: flex row, `padding: 12px 16px`, `border-radius: 10px`
  - Title (14px bold, truncated)
  - Platform labels (11px, colored)
  - Date (11px, dim)
  - Status badge: `padding: 3px 10px`, `border-radius: 6px`, status-colored bg @ 12%
  - Delete button with trash icon

---

## 6. Platform Icons (SVG)

### YouTube
- Fill style, official path from brand guidelines
- Color active: `#ff0000`, inactive: `{dim}`

### TikTok
- Fill style, official TikTok "d" path
- Color active: `#010101`, inactive: `{dim}`

### Instagram
- Stroke style: rounded rect + circle + dot
- Color active: `#e1306c`, inactive: `{dim}`

---

## 7. Responsive Behavior

- ToolPageShell handles max-width and centering
- Platform buttons: `flex-wrap: wrap` for mobile stacking
- Adaptation preview cards: `flex-wrap: wrap`, min-width 200px
- Calendar grid: fixed 7-column, cells shrink on mobile
- Action buttons row: `flex-wrap: wrap`

---

## 8. Design Review Notes

### Consistency with existing tools
- Gradient `#0ea5e9 → #6366f1` is unique among existing tools (no collision)
- Tab pattern matches Content Planner implementation
- UploadArea/ActionButton reuse ensures visual consistency
- Status color scheme aligns with Content Planner (`Draft/Scheduled/Published`)

### Recommendations for Phase 2
- [ ] Add drag-and-drop video reordering for batch publish
- [ ] Add thumbnail preview extraction from video file
- [ ] Platform-specific preview mockups (YouTube card, TikTok phone frame, IG post)
- [ ] Progress indicator during upload/publish flow
- [ ] Dark/light mode contrast check on all status badge colors
- [ ] Consider adding platform connection status indicators (linked/unlinked accounts)

---

## 9. ToolsHub Card Spec

- Icon: Upload arrow + 3 dots (representing multi-platform distribution)
- SVG: stroke style, 24x24, `strokeWidth: 1.8`
- Gradient: `['#0ea5e9', '#6366f1']`
- Badge: `NEW`
- Category: `publishing` (alongside Preview tool)

---

## 10. i18n Keys Summary

Total keys: 28 (14 EN + 14 RU)
Namespace: `multiPublisher.*`
Includes: tab labels, form labels, placeholders, status names, error messages, success toasts
ToolsHub keys: `toolshub.tool.multi-publisher.{name,subtitle,description}`
