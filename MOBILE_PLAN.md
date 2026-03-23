# MOBILE ADAPTATION PLAN — TubeForge

## 59 pages total, 32 need mobile work

---

## BATCH 1: Core App Pages (12 pages) — PRIORITY

### 1.1 AI Thumbnails `/ai-thumbnails`
- [ ] Two-column → single column on mobile
- [ ] Left panel full-width, right panel below
- [ ] Generate button sticky at bottom
- [ ] Style cards 2-column grid on mobile
- [ ] CTR Score section stacks vertically

### 1.2 Video Editor `/editor`
- [ ] Show mobile fallback message (editor too complex for mobile)
- [ ] OR: single-column with prompt + generate + preview stacked
- [ ] Hide style gallery on mobile, show as bottom sheet

### 1.3 Dashboard `/dashboard`
- [ ] TOP CHOICE cards horizontal scroll (already works?)
- [ ] Our Tools grid: 2 columns on tablet, 1 on phone
- [ ] Welcome section responsive text

### 1.4 Design Studio `/thumbnails`
- [ ] Canvas needs mobile fallback (too complex for touch)
- [ ] Show "Use desktop for full editor" message
- [ ] OR: simplified mobile canvas

### 1.5 Publish `/preview`
- [ ] Tabs stack correctly on mobile
- [ ] Tab content full-width
- [ ] Video preview responsive aspect ratio

### 1.6 Analytics `/analytics`
- [ ] Tabs full-width on mobile
- [ ] Charts responsive (recharts already handles this)
- [ ] Tables horizontal scroll

### 1.7 Billing `/billing`
- [ ] Plan cards stack vertically on mobile
- [ ] Comparison table horizontal scroll
- [ ] FAQ accordion full-width

### 1.8 Settings `/settings`
- [ ] Section cards full-width
- [ ] Inputs full-width
- [ ] Profile avatar centered

### 1.9 Keywords `/keywords`
- [ ] Search bar full-width
- [ ] Two-column → stacked
- [ ] Tables horizontal scroll
- [ ] Tabs scroll horizontally

### 1.10 All Tools `/tools`
- [ ] Tool cards 2-column on tablet, 1 on phone
- [ ] Search centered
- [ ] Category pills horizontal scroll

### 1.11 Team `/team`
- [ ] Member cards stack
- [ ] Activity log responsive

### 1.12 Admin `/admin`
- [ ] Tabs scrollable
- [ ] Tables responsive
- [ ] Stats cards 2-column

---

## BATCH 2: Public Pages (11 pages)

### 2.1 Gallery `/gallery` ❌
- [ ] Project cards 2-col tablet, 1-col phone
- [ ] Filters horizontal scroll
- [ ] Search full-width

### 2.2 Help `/help` ❌
- [ ] Search full-width, centered
- [ ] Category pills horizontal scroll
- [ ] Article cards full-width
- [ ] FAQ accordion responsive

### 2.3 Status `/status` ❌
- [ ] Service cards stack vertically
- [ ] Stats responsive

### 2.4 Changelog `/changelog` ❌
- [ ] Timeline entries full-width
- [ ] Type badges responsive

### 2.5 Profile `/profile/[userId]` ❌
- [ ] Stats horizontal scroll
- [ ] Project grid 1-column

### 2.6 Share `/share/[id]` ❌
- [ ] Preview full-width
- [ ] Share buttons horizontal
- [ ] Scene list responsive

### 2.7-2.12 Legal pages (6) ⚠️
- [ ] Max-width responsive
- [ ] Padding adjustments
- [ ] Table of contents collapsible on mobile

---

## BATCH 3: Remaining App Views (9 pages)

### 3.1 Referral `/referral`
- [ ] Stats cards 2-column
- [ ] Share buttons responsive
- [ ] QR code centered

### 3.2 Media Library `/media`
- [ ] File grid 2-column
- [ ] Upload area full-width
- [ ] Storage bar responsive

### 3.3 Brand Kit `/brand`
- [ ] Color pickers responsive
- [ ] Logo upload centered

### 3.4 Welcome `/welcome`
- [ ] Centered card full-width with padding

### 3.5 Onboarding `/onboarding`
- [ ] Quiz cards stack on mobile
- [ ] Progress bar full-width

### 3.6 Metadata `/metadata` (redirect)
- [ ] Already redirects to /preview

### 3.7-3.9 Individual tools
- [ ] ToolPageShell responsive
- [ ] Input areas full-width
- [ ] Results full-width

---

## GLOBAL MOBILE FIXES

### Layout
- [ ] Bottom tabs: verify all icons + labels fit
- [ ] Sidebar drawer: verify all nav items accessible
- [ ] Safe area insets (iPhone notch)
- [ ] Touch targets: minimum 44x44px everywhere
- [ ] No horizontal overflow on any page

### Typography
- [ ] Headers: clamp(20px, 5vw, 36px) on all pages
- [ ] Body: 15-16px on mobile (not 13-14)
- [ ] Line height: 1.5+ on mobile

### Inputs
- [ ] All inputs: 48px height on mobile
- [ ] Font-size 16px (prevents iOS zoom)
- [ ] Full-width on mobile

### Modals
- [ ] All modals: full-screen on mobile
- [ ] Close button accessible
- [ ] No scrolling issues

### Images
- [ ] All images: max-width 100%
- [ ] Aspect ratio preserved
- [ ] Lazy loading on all images

---

## VERIFICATION (after all batches)
- [ ] Test on iPhone SE (320px)
- [ ] Test on iPhone 14 (390px)
- [ ] Test on iPad (768px)
- [ ] Test on Android (360px)
- [ ] No horizontal scroll on any page
- [ ] All touch targets 44px+
- [ ] All forms usable
- [ ] All modals closeable
- [ ] Bottom tabs work
- [ ] Sidebar drawer works
