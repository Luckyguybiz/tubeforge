# Spec: Preview Page — Two Remaining Blockers

**Date:** 2026-03-26
**PM:** Сергей
**Branch:** climpire/1891f00f
**Status:** Ready for implementation

---

## Blocker 1 — Analytics Charts (Preview Tab)

### Problem
The analytics tRPC router (`analytics.getOverview`, `analytics.getProjectActivity`) is fully implemented but **no chart UI exists** on the preview page. Dev Lead blocked merge until charts render.

### What to build

Add an `AnalyticsDashboard` component to the bottom of `src/views/Preview/PreviewSave.tsx` (after the publish history section, before closing `</div>`).

### Data sources (already available)
```ts
trpc.analytics.getOverview.useQuery()
// returns: { totalProjects, totalScenes, weekProjects, monthProjects,
//   totalDurationSeconds, plan, aiUsage, aiLimit,
//   statusBreakdown: { DRAFT, RENDERING, READY, PUBLISHED } }

trpc.analytics.getProjectActivity.useQuery()
// returns: Array<{ date: string, created: number, updated: number }> — 30 days
```

### Charts required (Recharts ^3.7.0)

#### 1. Activity Line Chart
- Source: `getProjectActivity`
- Chart: `LineChart` with two lines — `created` (blue `#6366f1`) and `updated` (cyan `#06b6d4`)
- X-axis: last 30 dates, show every 5th label, format as `MMM DD`
- Y-axis: integer ticks only, hide if max value = 0
- Tooltip: custom, dark background, show date + created + updated
- Height: 200px, responsive (`ResponsiveContainer width="100%"`)

#### 2. Status Breakdown Bar Chart / Pie
- Source: `getOverview.statusBreakdown`
- Chart: `PieChart` with `Pie` (donut, innerRadius 50, outerRadius 80)
- Colors: DRAFT `#6b7280`, RENDERING `#f59e0b`, READY `#3b82f6`, PUBLISHED `#10b981`
- Legend: show status name + count inline below chart
- Size: 200x200, centered

#### 3. Stat Cards row (above charts)
- Re-use existing `StatCard` from `src/components/analytics/StatCard.tsx`
- Cards: "Projects" (totalProjects), "Scenes" (totalScenes), "This Week" (weekProjects), "AI Used" (aiUsage / aiLimit === -1 ? "∞" : aiLimit)
- Layout: 4-column grid on desktop, 2-column on mobile (`@media (max-width: 640px)`)

### Placement in PreviewSave.tsx
```
[existing video preview + upload section]
[existing platform presets]
[existing publish button + history]
----- NEW SECTION BELOW -----
<AnalyticsDashboard />   ← add here, lazy-loaded, wrapped in Suspense
```

### Implementation notes
- Wrap chart imports with `dynamic(() => import('recharts').then(...), { ssr: false })` — same pattern as AdminPage.tsx lines ~50-70
- Show skeleton (`<Skeleton height={200} />`) while loading
- If `getOverview` is loading or error, show skeleton. Don't block page render.
- Keep the existing dark theme: use `C.surface`, `C.border`, `C.text`, `C.dim` from `useThemeStore`
- Section header: "📊 Your Analytics" in the same heading style as other sections in PreviewSave

### Component file
Create: `src/components/analytics/AnalyticsDashboard.tsx`
Import in: `src/views/Preview/PreviewSave.tsx`

---

## Blocker 2 — Upload Integration in Planner

### Problem
Content items in the Planner have no way to attach a video/photo thumbnail. CEO requirement: team members should be able to visually see which content is planned and upload media directly. Dev Lead blocked merge — upload flow was not integrated.

### What to build

#### A. Extend `ContentItem` type in `src/stores/useContentPlannerStore.ts`
Add one field:
```ts
export interface ContentItem {
  // ... existing fields ...
  mediaUrl: string | null;      // uploaded image or video thumbnail URL
  mediaType: 'image' | 'video' | null;
}
```
Default value in `addItem`: `mediaUrl: null, mediaType: null`
Add `updateItemMedia(id: string, mediaUrl: string, mediaType: 'image' | 'video')` action to the store.

#### B. Upload API call
Use the existing `/api/upload` endpoint:
```ts
// POST /api/upload
// FormData: { file: File }
// Response: { url: string }
// Accepts: image/jpeg, image/png, image/webp, image/gif, image/avif
// Max size: 10 MB
```

For video files: upload a **thumbnail frame** (extracted client-side via `<canvas>` + `<video>`) as a JPEG, not the full video file. This keeps uploads fast and avoids large video uploads.

#### C. UI changes in `src/views/Tools/ContentPlanner.tsx`

**In the Content List view (item card):**
- If `item.mediaUrl` exists: show it as a 80x60px thumbnail in the top-left of the card (object-fit: cover, border-radius: 6px)
- If no media: show a dashed upload zone (80x60px, `border: 1.5px dashed ${C.border}`, `background: ${C.surface}`) with a `📎` icon

**In the item detail modal/edit form** (when user opens a content item):
- Add "Media Preview" section with a `<input type="file" accept="image/*,video/*">` button
- On file select:
  1. If image: POST to `/api/upload` directly, store returned URL
  2. If video: extract first frame via canvas, POST extracted JPEG, store returned URL with `mediaType: 'video'`
- Show upload progress with a simple spinner/progress bar inline
- After upload: show the image with an "×" remove button

**In the Calendar view** (grid cells with scheduled items):
- If `item.mediaUrl` exists: show tiny 24x24 thumbnail next to item title in the calendar cell

#### D. Upload helper function
Create: `src/lib/uploadMedia.ts`
```ts
// uploadMedia(file: File): Promise<{ url: string; mediaType: 'image' | 'video' }>
// - Detects file type
// - For video: extracts first frame as JPEG blob
// - POSTs to /api/upload
// - Returns { url, mediaType }
```

### Error handling
- Max file size: 10 MB (enforce client-side before upload, show toast if exceeded)
- Unsupported format: show toast "Поддерживаются: JPG, PNG, WebP, GIF"
- Upload failure: show toast with error, don't update store

### Notes
- Keep zustand persist — `mediaUrl` will be stored in localStorage (URLs are short strings)
- No Prisma/DB changes needed — this round is localStorage + CDN URL only
- Use existing `toast` from `useNotificationStore`
- Keep existing card height — thumbnail replaces the `thumbnailColor` colored dot/bar, don't add extra height

---

## Acceptance Criteria

### Blocker 1 — Charts
- [ ] `AnalyticsDashboard` renders on Preview tab below publish section
- [ ] Line chart shows 30-day activity with two colored lines
- [ ] Pie/donut chart shows project status breakdown
- [ ] 4 stat cards render with correct values
- [ ] No SSR errors (ssr: false on recharts)
- [ ] Skeleton shows during loading
- [ ] Mobile: 2-column stat cards, charts at full width

### Blocker 2 — Planner Upload
- [ ] Content item card shows media thumbnail if uploaded
- [ ] Upload zone visible on cards without media
- [ ] File input accepts image/* and video/*
- [ ] Video uploads use extracted first-frame JPEG
- [ ] Upload error shows toast, doesn't break card
- [ ] Uploaded thumbnail persists via Zustand localStorage
- [ ] Calendar cells show tiny thumbnail for items with media

---

## Files to create/modify

| Action | File |
|--------|------|
| CREATE | `src/components/analytics/AnalyticsDashboard.tsx` |
| MODIFY | `src/views/Preview/PreviewSave.tsx` — import + render AnalyticsDashboard |
| CREATE | `src/lib/uploadMedia.ts` |
| MODIFY | `src/stores/useContentPlannerStore.ts` — add mediaUrl, mediaType, updateItemMedia |
| MODIFY | `src/views/Tools/ContentPlanner.tsx` — upload UI in cards and detail modal |
