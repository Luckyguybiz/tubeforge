# MASTER_PLAN_2.md — TubeForge Commercial Polish & Feature Completion

**Total: ~30 hours | 10 Phases | 42 Blocks | ~200 tasks**
**Created: 2026-03-20 | Status: EXECUTING**

---

## Phase 1: Critical Bug Fixes (3h)

### Block A: i18n Server-Side Hardcoded Russian (1.5h)
**Files:** `server/routers/ai.ts`, `server/routers/scene.ts`, `server/routers/videoTask.ts`, `server/routers/team.ts`, `server/routers/billing.ts`, `server/routers/brand.ts`, `server/routers/stock.ts`, `hooks/useVideoGeneration.ts`

| # | Task |
|---|------|
| A1 | Replace all Russian error messages in tRPC routers with i18n-neutral error codes (e.g., `AI_LIMIT_EXCEEDED`, `PROJECT_NOT_FOUND`) — client translates via error code mapping |
| A2 | Fix `useVideoGeneration.ts` — replace hardcoded Russian toasts with `t()` calls |
| A3 | Fix `useEditorStore.ts` — scene labels use `t('editor.scene')` + index, not Russian |
| A4 | Audit ALL `.ts`/`.tsx` files for remaining hardcoded Russian strings outside `locales/` |

### Block B: i18n Client Completion (1.5h)
**Files:** `locales/es.json`, `locales/kk.json`, `locales/en.json`, `locales/ru.json`

| # | Task |
|---|------|
| B1 | Generate complete `es.json` — translate all ~1350 keys to Spanish |
| B2 | Generate complete `kk.json` — translate all ~1350 keys to Kazakh |
| B3 | Add missing i18n keys for: billing deals, brand kit, media library, collaboration, tools |
| B4 | Add error code → human message mapping in all 4 locales |

---

## Phase 2: Data Integrity & Consistency (2h)

### Block C: Plan Limits Consistency (1h)
**Files:** `server/routers/ai.ts`, `views/Billing/BillingPage.tsx`, `lib/constants.ts`, `server/routers/team.ts`

| # | Task |
|---|------|
| C1 | Centralize ALL plan limits in `lib/constants.ts` — single source of truth for projects, AI, scenes, team, storage |
| C2 | Fix BillingPage to read limits from constants — "5 AI gen/month" not "5 AI gen/day" |
| C3 | Fix team.ts max members to match billing display (5 for STUDIO) |
| C4 | Add limit display helper: `formatLimit(value)` → "5/мес", "∞", "25" |

### Block D: Promo Codes DB Migration (1h)
**Files:** `prisma/schema.prisma`, `server/routers/billing.ts`, `app/api/tools/promo/route.ts`

| # | Task |
|---|------|
| D1 | Add `PromoCode` model to Prisma: code, discount%, maxUses, currentUses, expiresAt, isActive |
| D2 | Add `PromoActivation` model: userId, promoCodeId, activatedAt |
| D3 | Migrate hardcoded promo codes to seed data |
| D4 | Replace promo API route with tRPC procedure `billing.validatePromo` |
| D5 | Add promo management in admin panel |

---

## Phase 3: Auth & Settings Polish (2.5h)

### Block E: Auth Provider Detection Fix (0.5h)
**Files:** `server/routers/user.ts`, `views/Settings/SettingsPage.tsx`

| # | Task |
|---|------|
| E1 | Add `getAuthProvider` tRPC procedure — query `Account` table for provider name |
| E2 | Settings: use provider name from API, not image URL string matching |
| E3 | Show correct icons: Google, GitHub, Discord, Email |

### Block F: Settings Enhancements (1h)
**Files:** `views/Settings/SettingsPage.tsx`, `server/routers/user.ts`

| # | Task |
|---|------|
| F1 | Add avatar upload — reuse `/api/upload`, save URL to user profile |
| F2 | Add timezone selector — save to user metadata, use in scheduled content |
| F3 | Add language preference persistence to DB (not just localStorage) |
| F4 | Add "Danger zone" section: delete account with email confirmation flow |

### Block G: Referral System Improvement (1h)
**Files:** `server/routers/referral.ts`, `views/Settings/SettingsPage.tsx`

| # | Task |
|---|------|
| G1 | Replace UUID-slice referral code with human-friendly random words (e.g., `TUBE-HAWK-4291`) |
| G2 | Add referral stats dashboard: clicks, signups, conversions, earnings |
| G3 | Add referral link copy with share buttons (WhatsApp, Telegram, Twitter) |

---

## Phase 4: Editor Major Upgrades (5h)

### Block H: Undo/Redo System (1.5h)
**Files:** `stores/useEditorStore.ts`, `views/Editor/EditorPage.tsx`

| # | Task |
|---|------|
| H1 | Implement history stack in useEditorStore: `past[]`, `future[]`, max 50 entries |
| H2 | Wrap scene mutations (add, delete, reorder, edit prompt) with `pushHistory()` |
| H3 | Add `undo()` and `redo()` actions with Ctrl+Z / Ctrl+Shift+Z support |
| H4 | Add undo/redo buttons in editor toolbar with disabled state |

### Block I: Template Library (1.5h)
**Files:** `lib/templates.ts` (NEW), `views/Editor/TemplatePickerModal.tsx`, `views/Dashboard/Dashboard.tsx`

| # | Task |
|---|------|
| I1 | Create `lib/templates.ts` — 15 templates: YouTube Intro, Outro, Tutorial, Product Review, Vlog, Shorts, TikTok, Ad, Explainer, Gaming Highlight, News, Recipe, Travel, Fitness, Unboxing |
| I2 | Each template: name, description, thumbnail, scene count, scene prompts, style, music suggestion |
| I3 | Template picker modal with categories, search, preview |
| I4 | "Use template" button creates project pre-filled with template scenes |
| I5 | Dashboard "Start from template" button |

### Block J: Font Library (1h)
**Files:** `lib/fonts.ts` (NEW), `views/Thumbnails/PropertiesPanel.tsx`, `views/Thumbnails/ThumbnailEditor.tsx`

| # | Task |
|---|------|
| J1 | Create `lib/fonts.ts` — 30 Google Fonts curated for video: Inter, Roboto, Montserrat, Playfair, Oswald, etc. |
| J2 | Add font picker dropdown in PropertiesPanel text section |
| J3 | Lazy-load Google Fonts on selection — inject `<link>` tag dynamically |
| J4 | Save selected font to text element metadata |

### Block K: Editor Mobile Fallback (1h)
**Files:** `views/Editor/EditorPage.tsx`, `components/ui/MobileEditorFallback.tsx` (NEW)

| # | Task |
|---|------|
| K1 | Create MobileEditorFallback component — "Используйте ПК для редактирования" with device icon |
| K2 | Add `useMediaQuery` hook — detect viewport width |
| K3 | Show fallback on screens < 768px, show editor on desktop |
| K4 | Add option "View project info" on mobile (read-only scene list) |

---

## Phase 5: Admin & Analytics Pro (3h)

### Block L: Admin User Management (1h)
**Files:** `views/Admin/AdminPage.tsx`, `server/routers/admin.ts`

| # | Task |
|---|------|
| L1 | Add "Delete user" button with confirmation modal |
| L2 | Add "Change role" dropdown (USER → ADMIN) with double confirmation |
| L3 | Add user search by email/name |
| L4 | Add pagination to user list (currently loads all users) |
| L5 | Add "Send email to user" quick action |

### Block M: Analytics CSV Export (1h)
**Files:** `views/Admin/AdminPage.tsx`, `server/routers/admin.ts`, `server/routers/analytics.ts`

| # | Task |
|---|------|
| M1 | Add "Export Users CSV" button in admin — id, email, name, plan, createdAt, projectCount |
| M2 | Add "Export Revenue CSV" — month, MRR, new subs, churned, net |
| M3 | Add analytics export for users: shorts RPM data, tool usage stats as CSV |
| M4 | CSV generation utility: `arrayToCSV(data, columns)` |

### Block N: Email Notification System (1h)
**Files:** `lib/email.ts`, `server/routers/team.ts`, `server/routers/billing.ts`, `lib/email-templates.ts`

| # | Task |
|---|------|
| N1 | Add team invite email template (HTML) with accept button |
| N2 | Send email on team invite — use existing `sendEmail()` utility |
| N3 | Add plan change confirmation email |
| N4 | Add "You were mentioned in a comment" email for collaboration |
| N5 | Add email preference toggles: marketing, product updates, team notifications |

---

## Phase 6: Production Hardening (3h)

### Block O: Remove Debug Code (0.5h)
**Files:** all files with `console.log`

| # | Task |
|---|------|
| O1 | Remove all `console.log` from API routes (youtube-download, promo, shorts-analytics) |
| O2 | Replace necessary logging with `logger.info/warn/error` from `lib/logger.ts` |
| O3 | Add ESLint rule `no-console: warn` to catch future leaks |

### Block P: Rate Limiting Improvement (1h)
**Files:** `lib/rate-limit.ts`, `server/routers/ai.ts`, `server/routers/scene.ts`

| # | Task |
|---|------|
| P1 | Add LRU eviction to in-memory rate limiter (cap at 10K entries, evict oldest) |
| P2 | Add rate limiting to `ai.generateImage`, `ai.generateScript`, `ai.generateCaptions` |
| P3 | Add rate limiting to `scene.create`, `scene.delete` (prevent spam) |
| P4 | Add `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers to API responses |

### Block Q: Error Recovery & Resilience (1h)
**Files:** `server/routers/youtube.ts`, `app/api/webhooks/stripe/route.ts`, `hooks/useVideoGeneration.ts`

| # | Task |
|---|------|
| Q1 | YouTube token refresh: if refresh fails, invalidate account and prompt re-auth |
| Q2 | Stripe webhook: add idempotency key check to prevent double processing |
| Q3 | Video generation: add exponential backoff retry (3 attempts) on transient failures |
| Q4 | Add dead letter queue concept for failed webhook events (log to AuditLog) |

### Block R: Security Audit Follow-up (0.5h)
**Files:** `server/routers/admin.ts`, `server/routers/analytics.ts`

| # | Task |
|---|------|
| R1 | Add SUPER_ADMIN role check for `deleteUser` and `changeRole` |
| R2 | Add server-side validation for `trackToolUsage` — verify tool exists, timestamp reasonable |
| R3 | Add CSP nonce for inline scripts on landing page |

---

## Phase 7: Tools & Features (5h)

### Block S: Subtitle Editor Tool (2h)
**Files:** `views/Tools/SubtitleEditor.tsx` (NEW), `lib/subtitle-parser.ts` (NEW)

| # | Task |
|---|------|
| S1 | Create SRT/VTT parser: `parseSRT(text)` → `{start, end, text}[]` |
| S2 | Create SRT/VTT serializer: `toSRT(entries)`, `toVTT(entries)` |
| S3 | Build UI: upload SRT/VTT, edit timeline entries inline, add/delete entries |
| S4 | Add auto-timing: distribute text evenly across duration |
| S5 | Preview with video sync (if video URL provided) |
| S6 | Download edited subtitles as SRT or VTT |
| S7 | Mark tool as `available: true` in tools index |

### Block T: Background Remover Tool (1h)
**Files:** `views/Tools/BackgroundRemover.tsx` (NEW), `app/api/tools/bg-remove/route.ts` (NEW)

| # | Task |
|---|------|
| T1 | Create UI: upload image, show before/after preview |
| T2 | Integrate with remove.bg API (check for API key, graceful fallback) |
| T3 | If no API key: use client-side `@imgly/background-removal` WASM library |
| T4 | Download result as PNG with transparent background |
| T5 | Mark tool as `available: true` in tools index |

### Block U: Voice Generator Tool (1h)
**Files:** `views/Tools/VoiceoverGenerator.tsx` (NEW)

| # | Task |
|---|------|
| U1 | Create UI: text input, voice selector, speed/pitch controls |
| U2 | Integrate with ElevenLabs API (check for key, graceful fallback) |
| U3 | If no API key: show "Coming soon" with waitlist signup |
| U4 | Audio preview player with waveform visualization |
| U5 | Download as MP3 |
| U6 | Mark tool as `available: true` in tools index |

### Block V: Image Generator Tool (1h)
**Files:** `views/Tools/ImageGenerator.tsx` (NEW)

| # | Task |
|---|------|
| V1 | Create UI: prompt input, style selector, aspect ratio picker |
| V2 | Integrate with OpenAI DALL-E API (reuse existing AI router) |
| V3 | Show 2x2 grid of results |
| V4 | Add "Use in project" button — save to media library |
| V5 | Mark tool as `available: true` in tools index |

---

## Phase 8: Performance & Testing (4h)

### Block W: React Performance Optimization (1.5h)
**Files:** `views/Dashboard/Dashboard.tsx`, `views/Editor/EditorPage.tsx`, `stores/useEditorStore.ts`, `views/Tools/index.tsx`

| # | Task |
|---|------|
| W1 | Extract `ProjectCard` from Dashboard as `React.memo` component |
| W2 | Extract `SceneCard` from EditorPage as `React.memo` component |
| W3 | Add `useShallow` to Zustand selectors picking multiple fields |
| W4 | Memoize tool cards in tools grid |
| W5 | Add `loading="lazy"` to all offscreen images |
| W6 | Profile and fix any >16ms renders in Chrome DevTools |

### Block X: Unit & Integration Tests (2.5h)
**Files:** `__tests__/` directory (NEW)

| # | Task |
|---|------|
| X1 | Setup Vitest config with jsdom environment |
| X2 | Test `lib/rate-limit.ts` — 5 tests (basic, window reset, over limit, different identifiers, cleanup) |
| X3 | Test `lib/subtitle-parser.ts` — 6 tests (parse SRT, parse VTT, serialize, edge cases) |
| X4 | Test `lib/constants.ts` plan limits — 3 tests (all plans defined, values reasonable) |
| X5 | Test `stores/useEditorStore.ts` undo/redo — 5 tests |
| X6 | Test `server/routers/ai.ts` limit checking — 4 tests (under limit, at limit, over limit, reset) |
| X7 | Test `server/routers/billing.ts` promo validation — 4 tests (valid, expired, used, invalid) |
| X8 | Test `lib/api-keys.ts` — 3 tests (hash, verify, generate) |
| X9 | Test CSV export utility — 3 tests |
| X10 | Integration: auth flow mock test — login, session, protected route |

---

## Phase 9: Content & Marketing (3h)

### Block Y: Landing Page Conversion Optimization (1.5h)
**Files:** `app/page.tsx`

| # | Task |
|---|------|
| Y1 | Add video demo section — embedded YouTube/Loom walkthrough (or animated GIF) |
| Y2 | Add social proof section — "Что говорят пользователи" with 3 testimonial cards |
| Y3 | Add comparison table: TubeForge vs Canva vs CapCut vs Adobe |
| Y4 | Add "Для кого TubeForge?" section: YouTube creators, marketers, agencies, educators |
| Y5 | Improve CTA placement — sticky bottom bar on mobile with "Начать бесплатно" |
| Y6 | Add "Гарантия возврата 14 дней" badge near pricing |

### Block Z: Blog System (1.5h)
**Files:** `app/blog/page.tsx` (NEW), `app/blog/[slug]/page.tsx` (NEW), `lib/blog-posts.ts` (NEW)

| # | Task |
|---|------|
| Z1 | Create `lib/blog-posts.ts` — 5 seed articles: "Как создать YouTube канал в 2026", "10 советов для вирусного Shorts", "ИИ в создании видео — полный гайд", "Монетизация YouTube: пошаговый план", "TubeForge vs конкуренты: честное сравнение" |
| Z2 | Blog index page with cards, categories, search |
| Z3 | Blog post page with MDX-like rendering, table of contents, reading time |
| Z4 | Add JSON-LD Article schema for SEO |
| Z5 | Add blog link to Sidebar and Landing page navigation |

---

## Phase 10: Final Verification & Deploy Prep (2.5h)

### Block AA: Comprehensive QA (1.5h)
| # | Task |
|---|------|
| AA1 | Run `npx tsc --noEmit` — 0 errors |
| AA2 | Run `npm run build` — successful build |
| AA3 | Verify ALL 30+ routes load without errors |
| AA4 | Verify all tools show correct state (active or "Coming soon") |
| AA5 | Test billing flow: view plans → click upgrade → Stripe redirect |
| AA6 | Test editor flow: create project → add scenes → preview → save |
| AA7 | Test admin flow: view users → search → change plan |
| AA8 | Test mobile: all pages render correctly on 375px viewport |
| AA9 | Test i18n: switch to English, Spanish, Kazakh — no missing keys shown |
| AA10 | Lighthouse audit: target >80 performance, >90 accessibility |

### Block AB: Deploy Preparation (1h)
| # | Task |
|---|------|
| AB1 | Generate Prisma migration for new models (PromoCode, PromoActivation) |
| AB2 | Update `prisma/seed.ts` with promo code seed data |
| AB3 | Create deploy checklist: env vars, DB migration, PM2 restart, cache clear |
| AB4 | Update CHANGELOG.md with all new features |
| AB5 | Create PR from `claude/great-curie` → `main` with full description |

---

## Execution Strategy

**Parallel agents per wave:**
- Wave 1 (Phase 1-2): Blocks A, B, C, D — 4 agents, ~5.5h
- Wave 2 (Phase 3-4): Blocks E, F, G, H, I, J, K — 7 agents, ~7.5h
- Wave 3 (Phase 5-6): Blocks L, M, N, O, P, Q, R — 7 agents, ~6h
- Wave 4 (Phase 7): Blocks S, T, U, V — 4 agents, ~5h
- Wave 5 (Phase 8-9): Blocks W, X, Y, Z — 4 agents, ~7h
- Wave 6 (Phase 10): Blocks AA, AB — sequential, ~2.5h

**File ownership prevents conflicts.**
**tsc check + commit after each wave.**
