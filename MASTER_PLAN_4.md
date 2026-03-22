# MASTER_PLAN_4 — TubeForge Commercial Launch Fix Plan
# Created: 2026-03-22
# Status: IN PROGRESS

---

## WAVE 1: CRITICAL (7 tasks) — блокеры запуска

### C1. CSP connect-src missing critical domains
- **File:** `src/lib/security-headers.ts`
- **Fix:** Add `https://*.fal.media`, `https://fal.queue.fal.ai`, `https://api.elevenlabs.io`, `https://api.pexels.com`, `https://js.stripe.com` to `connect-src`
- **Status:** [x] Added fal.media, fal.queue, queue.fal.run, elevenlabs, pexels, stripe, noembed

### C2. CSP img-src missing fal.media and pexels
- **File:** `src/lib/security-headers.ts`
- **Fix:** Add `https://*.fal.media`, `https://images.pexels.com` to `img-src`
- **Status:** [x] Added *.fal.media, v3.fal.media, v3b.fal.media, images.pexels.com

### C3. Permissions-Policy blocks microphone
- **File:** `src/lib/security-headers.ts`
- **Fix:** Change `microphone=()` to `microphone=(self)` to allow speech recognition
- **Status:** [x] Changed to microphone=(self)

### C4. Stripe promo WELCOME50 not implemented
- **File:** `src/server/routers/billing.ts`
- **Fix:** Add `allow_promotion_codes: true` to `stripe.checkout.sessions.create()` call. Create Stripe coupon WELCOME50 (50% off first month) and COMEBACK20 (20% off) via Stripe dashboard or API
- **Status:** [x] Added allow_promotion_codes: true to checkout session

### C5. Resend email not configured
- **File:** `.env`
- **Fix:** Document that RESEND_API_KEY needs to be set. Add fallback logging when not set. This is a manual setup task (DNS verification + API key)
- **Status:** [x] Added startup warning log, updated .env.example with setup instructions

### C6. Duplicate security headers (Caddy + Next.js)
- **File:** `src/lib/security-headers.ts` or Caddy config
- **Fix:** Remove duplicate HSTS, X-Frame-Options from Next.js config (keep in Caddy) OR remove from Caddy (keep in Next.js)
- **Status:** [x] Removed duplicate headers from middleware.ts (kept in security-headers.ts via next.config.ts)

### C7. CSP connect-src for fal.ai API
- **File:** `src/lib/security-headers.ts`
- **Fix:** Combined with C1 — ensure all fal.ai endpoints are whitelisted
- **Status:** [x] Combined with C1 — *.fal.media, fal.queue.fal.ai, queue.fal.run all added

---

## WAVE 2: HIGH (10 tasks) — до запуска

### H1. Fix 10 failing tests
- **Files:** `useThemeStore.test.ts`, `Sidebar.test.tsx`, `TopBar.test.tsx`, `i18n.test.ts`, `useLocaleStore.test.ts`
- **Fix:** Update test expectations to match current theme colors (#0a0a0a, #ffffff) and current nav keys
- **Status:** [ ]

### H2. Register toolHistoryRouter
- **File:** `src/server/routers/_app.ts`
- **Fix:** Import and register `toolHistoryRouter` from `./toolHistory`
- **Status:** [ ]

### H3. VPN promo usage — persist to DB
- **File:** `src/server/routers/vpn.ts`
- **Fix:** Track promo usage in Prisma (add PromoUsage model or use existing ProcessedEvent)
- **Status:** [ ]

### H4. Rate limiting — document Redis migration path
- **File:** `src/lib/rate-limit.ts`
- **Fix:** Add TODO comments and document @upstash/ratelimit migration. For now, in-memory is acceptable for single-instance PM2
- **Status:** [ ]

### H5. Webhook delivery — stub implementation
- **File:** `src/server/routers/webhook.ts`
- **Fix:** Add `deliverWebhook()` function that POSTs to registered URLs. Call it from project.create and videoTask completion
- **Status:** [ ]

### H6. Oferta page — translate to English + USD
- **File:** `src/app/(legal)/oferta/page.tsx`
- **Fix:** Translate Russian text, change ruble prices to USD
- **Status:** [ ]

### H7. 6 referral-link tool pages — clean up Russian
- **Files:** `AiCreator.tsx`, `AudioBalancer.tsx`, `RedditVideoGenerator.tsx`, `VocalRemover.tsx`, `Brainstormer.tsx`, `Veo3Generator.tsx`
- **Fix:** Remove `descriptionRu`/`featuresRu`/`pricingRu` fields, use English only
- **Status:** [ ]

### H8. VideoTranslator — proper coming soon page
- **File:** `src/views/Tools/VideoTranslator.tsx`
- **Fix:** Use ToolPageShell with proper "coming soon" UI matching other unavailable tools
- **Status:** [ ]

### H9. Onboarding — use theme variables
- **File:** `src/app/(app)/onboarding/page.tsx`
- **Fix:** Replace hardcoded `#0a0a0a`, `#1a1a1a` with CSS variables or accept dark-only (add comment)
- **Status:** [ ]

### H10. Initialize Prisma migrations
- **Fix:** Run `mkdir -p prisma/migrations` and document migration strategy. Keep using `db push` for now but prepare for `prisma migrate`
- **Status:** [ ]

---

## WAVE 3: MEDIUM (10 tasks) — хорошо бы

### M1. WebVitals — send to analytics endpoint
- **File:** `src/components/WebVitals.tsx`
- **Fix:** Send data to `/api/analytics/vitals` or log to structured logger
- **Status:** [ ]

### M2. Tool usage analytics — persist server-side
- **File:** `src/server/routers/analytics.ts`
- **Fix:** Actually write tool usage data to DB in `syncToolUsage`
- **Status:** [ ]

### M3. referralEarnings — increment on claim
- **File:** `src/server/routers/referral.ts`
- **Fix:** In `claimReward`, also update `user.referralEarnings` field
- **Status:** [ ]

### M4. Sitemap — add missing tool pages
- **File:** `src/app/sitemap.ts`
- **Fix:** Add all available + coming-soon tool pages to sitemap
- **Status:** [ ]

### M5. REST API v1 — atomic plan limit check
- **File:** `src/app/api/v1/projects/route.ts`
- **Fix:** Wrap plan check + create in `db.$transaction()`
- **Status:** [ ]

### M6. Annual billing toggle — implement
- **File:** `src/server/routers/billing.ts`
- **Fix:** Create annual Stripe prices, pass correct price ID based on `isAnnual` toggle
- **Status:** [ ]

### M7. Gallery — connect to real data
- **File:** `src/app/gallery/page.tsx`
- **Fix:** Query public ThumbnailGenerations from DB instead of static data
- **Status:** [ ]

### M8. Promo codes — move to DB
- **File:** `src/server/routers/vpn.ts`
- **Fix:** Move hardcoded promo codes to env vars or DB
- **Status:** [ ]

### M9. Loading.tsx for remaining routes
- **Files:** `src/app/(app)/onboarding/loading.tsx`, `src/app/(app)/tools/[toolId]/loading.tsx`
- **Fix:** Create skeleton loading pages
- **Status:** [ ]

### M10. Email templates — remove remaining Russian
- **File:** `src/lib/email-templates.ts`
- **Fix:** Audit and remove any remaining Russian text
- **Status:** [ ]

---

## WAVE 4: VERIFICATION (30 checks)

After all fixes, run these 30 verification checks:

### Backend checks:
1. [ ] `npx tsc --noEmit` — 0 errors
2. [ ] `npx vitest run` — 0 failures
3. [ ] All 32+ routes return 200/307
4. [ ] Health endpoint returns OK
5. [ ] Stripe checkout creates session
6. [ ] Stripe webhook processes events
7. [ ] AI generation (Flux) works
8. [ ] CTR analysis (GPT-4o Vision) works
9. [ ] Keywords search returns data
10. [ ] Contact form saves to DB

### Frontend/UX checks:
11. [ ] Landing page renders (dark theme)
12. [ ] Login/Register work (Google OAuth)
13. [ ] Onboarding quiz flow works
14. [ ] Dashboard shows tool gallery
15. [ ] AI Thumbnails generates image
16. [ ] Editor left panel always visible
17. [ ] Design Studio canvas renders
18. [ ] Publish page — all 3 tabs work
19. [ ] Analytics — Shorts/TikTok tabs load
20. [ ] Keywords — search works

### Security/SEO checks:
21. [ ] CSP allows fal.ai, ElevenLabs, Pexels
22. [ ] No duplicate security headers
23. [ ] Microphone permission works
24. [ ] All legal pages accessible without login
25. [ ] Sitemap has 50+ URLs
26. [ ] robots.txt blocks /api/, /admin
27. [ ] No Russian text in English locale
28. [ ] No ruble (₽) prices anywhere
29. [ ] dev-login blocked in production
30. [ ] All free-tools pages return 200

---

## NOTES
- Design Studio Canva-level = separate project (20+ hours)
- Video Translator = separate project (8 hours)
- Redis rate limiting = post-launch optimization
- Push notifications = post-launch feature
