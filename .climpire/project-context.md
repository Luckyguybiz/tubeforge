# Project: tubeforge-next

## Tech Stack
Node.js, React 19.2.3, Next.js ^16.2.0, TypeScript, Tailwind CSS, Prisma

## File Structure
```
├── chrome-extension/
│   ├── _locales/
│   │   ├── en/
│   │   │   └── messages.json
│   │   └── ru/
│   │       └── messages.json
│   ├── icons/
│   │   ├── icon128.png
│   │   ├── icon16.png
│   │   ├── icon32.png
│   │   └── icon48.png
│   ├── src/
│   │   ├── background.js
│   │   ├── content.css
│   │   ├── content.js
│   │   ├── popup.css
│   │   ├── popup.html
│   │   └── popup.js
│   ├── build.sh
│   ├── manifest.json
│   ├── PRIVACY.md
│   ├── STORE_LISTING.md
│   └── tubeforge-chrome-v1.0.0.zip
├── docs/
│   ├── design/
│   │   ├── mobile-ux-qa-r1.md
│   │   └── multi-publisher-design-spec.md
│   ├── devsecops/
│   │   └── upgrade-modal-security-audit.md
│   ├── qa/
│   │   ├── ai-thumbnails-design-remediation.md
│   │   ├── ai-thumbnails-round1-review.md
│   │   ├── analytics-final-signoff.md
│   │   └── upgrade-popup-modal-qa-report.md
│   ├── review/
│   │   └── fix-auth-429-review-submission.md
│   ├── specs/
│   │   ├── ai-thumbnails-brand-colors-final-decision.md
│   │   ├── ai-thumbnails-upgrade-spec.md
│   │   ├── dashboard-analytics-spec.md
│   │   ├── dashboard-upgrade-modal-spec.md
│   │   ├── fix-auth-429-rate-limit-spec.md
│   │   ├── fix-youtube-connect-button-spec.md
│   │   ├── fix-youtube-connect-spec.md
│   │   ├── mobile-ux-sprint-r1.md
│   │   └── upgrade-popup-spec.md
│   ├── analysis-timeout-increase.md
│   ├── devsecops-timeout-audit.md
│   ├── devsecops-upgrade-modal-audit.md
│   ├── preview-backend-final-assessment.md
│   └── spec-preview-blockers.md
├── e2e/
│   ├── dashboard-upgrade-modal.spec.ts
│   └── smoke.spec.ts
├── ios/
│   ├── App/
│   │   ├── App/
│   │   │   ├── Assets.xcassets/
│   │   │   │   ...
│   │   │   ├── Base.lproj/
│   │   │   │   ...
│   │   │   ├── AppDelegate.swift
│   │   │   └── Info.plist
│   │   ├── App.xcodeproj/
│   │   │   ├── project.xcworkspace/
│   │   │   │   ...
│   │   │   └── project.pbxproj
│   │   └── CapApp-SPM/
│   │       ├── Sources/
│   │       │   ...
│   │       ├── Package.swift
│   │       └── README.md
│   └── debug.xcconfig
├── ios-app/
│   └── README.md
├── prisma/
│   ├── README.md
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── demo/
│   │   ├── 2d-cats-2.mp4
│   │   ├── 2d-cats-3.mp4
│   │   └── 2d-cats.mp4
│   ├── downloads/
│   │   └── channellens-v1.0.0.zip
│   ├── ffmpeg/
│   │   ├── ffmpeg-core.js
│   │   └── ffmpeg-core.wasm
│   ├── gen/
│   ├── gen-thumbs/
│   │   └── thumb_cmn79nh2s0001uau65ortr1od.png
│   ├── images/
│   │   └── tools/
│   │       ├── ai-creator.svg
│   │       ├── ai-thumbnails.svg
│   │       ├── ai-video-generator.svg
│   │       ├── analytics.svg
│   │       ├── audio-balancer.svg
│   │       ├── autoclip.svg
│   │       ├── background-remover.svg
│   │       ├── brainstormer.svg
│   │       ├── channel-name-generator.svg
│   │       ├── character-counter.svg
│   │       ├── content-planner.svg
│   │       ├── cut-crop.svg
│   │       ├── description-generator.svg
│   │       ├── face-swap.svg
│   │       ├── fake-texts.svg
│   │       ├── image-generator.svg
│   │       ├── metadata.svg
│   │       ├── mp3-converter.svg
│   │       ├── mp4-to-gif.svg
│   │       ├── multi-publisher.svg
│   │       ├── preview.svg
│   │       ├── reddit-video.svg
│   │       ├── scenario.svg
│   │       ├── scheduler.svg
│   │       ├── script-generator.svg
│   │       ├── shorts-dimensions.svg
│   │       ├── speech-enhancer.svg
│   │       ├── subtitle-editor.svg
│   │       ├── subtitle-remover.svg
│   │       ├── tag-generator.svg
│   │       ├── thumbnail-checker.svg
│   │       ├── thumbnails.svg
│   │       ├── tiktok-downloader.svg
│   │       ├── title-generator.svg
│   │       ├── veo3-generator.svg
│   │       ├── video-compressor.svg
│   │       ├── video-ideas.svg
│   │       ├── video-translator.svg
│   │       ├── video.svg
│   │       ├── vocal-remover.svg
│   │       ├── voice-changer.svg
│   │       ├── voiceover-generator.svg
│   │       ├── youtube-downloader.svg
│   │       ├── yt-desc-generator.svg
│   │       ├── yt-money-calc.svg
│   │       ├── yt-tag-generator.svg
│   │       ├── yt-thumb-size.svg
│   │       └── yt-title-generator.svg
│   ├── privacy/
│   │   └── tiktok0BdxKOkUkys4BDToDUIbQXHzNhetLeJS.txt
│   ├── terms/
│   │   ├── tiktokMDxmOHJLWERuS2nBLwS7c6m6h6KLaDBA95sgApEDkXUt.txt
│   │   └── tiktoktUXkDEApgWs59aBDaLKh6m6c7SwBLnS2.txt
│   ├── uploads/
│   │   ├── translations/
│   │   │   └── cmmrlcjj80000uazyw1u4kwnz/
│   │   │       ...
│   │   └── id_hlwunz.jpg
│   ├── videos/
│   │   └── presets/
│   ├── apple-app-site-association
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-src.svg
│   ├── favicon.ico
│   ├── favicon.png
│   ├── favicon.svg
│   ├── google67bc3827ac871979.html
│   ├── icon-192.png
│   ├── icon-192.webp
│   ├── icon-512.png
│   ├── icon-512.webp
│   ├── icon.png
│   ├── indexnow-key.txt
│   ├── manifest.json
│   ├── offline.html
│   ├── sw.js
│   ├── tiktok0BdxKOkUkys4BDToDUIbQXHzNhetLeJS.txt
│   ├── tiktok7odEdxFUTCp4AJuOiVWQL9mCtG43oK6z.txt
│   └── tiktokMDxmOHJLWERuS2nBLwS7c6m6h6KLaDBA95sgApEDkXUt.txt
├── scripts/
│   ├── backup.sh
│   ├── build-ios.sh
│   ├── deploy.sh
│   └── healthcheck.sh
├── src/
│   ├── __tests__/
│   │   ├── api/
│   │   │   └── contact.test.ts
│   │   ├── auth/
│   │   │   └── auth.test.ts
│   │   ├── components/
│   │   │   ├── DashboardUpgradeModal.test.tsx
│   │   │   ├── ErrorBoundary.test.tsx
│   │   │   ├── OnboardingTour.test.tsx
│   │   │   ├── Sidebar.test.tsx
│   │   │   ├── Skeleton.test.tsx
│   │   │   ├── Toast.test.tsx
│   │   │   ├── ToolPageShell.test.tsx
│   │   │   ├── TopBar.test.tsx
│   │   │   ├── UpgradePopupModal.test.tsx
│   │   │   └── UpgradePrompt.test.tsx
│   │   ├── e2e/
│   │   │   └── smoke.test.ts
│   │   ├── hooks/
│   │   │   ├── usePlanLimits.test.ts
│   │   │   └── useProjectSync.test.ts
│   │   ├── integration/
│   │   │   ├── api-v1.test.ts
│   │   │   ├── auth-flow.test.ts
│   │   │   ├── billing-flow.test.ts
│   │   │   └── project-lifecycle.test.ts
│   │   ├── lib/
│   │   │   ├── constants.test.ts
│   │   │   ├── element-presets.test.ts
│   │   │   ├── env.test.ts
│   │   │   ├── feature-flags.test.ts
│   │   │   ├── ffmpeg.test.ts
│   │   │   ├── i18n.test.ts
│   │   │   ├── rate-limit.test.ts
│   │   │   ├── sanitize.test.ts
│   │   │   ├── security-headers.test.ts
│   │   │   ├── storage.test.ts
│   │   │   ├── thumbnail-templates.test.ts
│   │   │   └── utils.test.ts
│   │   ├── server/
│   │   │   ├── routers/
│   │   │   │   ...
│   │   │   ├── aiLimits.test.ts
│   │   │   ├── aiThumbnails.test.ts
│   │   │   ├── deleteAccount.test.ts
│   │   │   ├── keywords.test.ts
│   │   │   ├── plan-limits.test.ts
│   │   │   ├── routerSchemas.test.ts
│   │   │   ├── security.test.ts
│   │   │   ├── trpcContext.test.ts
│   │   │   ├── webhook-delivery.test.ts
│   │   │   └── webhook.test.ts
│   │   ├── stores/
│   │   │   ├── useEditorStore.test.ts
│   │   │   ├── useLocaleStore.test.ts
│   │   │   ├── useMetadataStore.test.ts
│   │   │   ├── useNotificationStore.test.ts
│   │   │   ├── useThemeStore.test.ts
│   │   │   └── useThumbnailStore.test.ts
│   │   ├── utils/
│   │   │   ├── mockPrisma.ts
│   │   │   ├── mockSession.ts
│   │   │   └── renderWithProviders.tsx
│   │   ├── constants.test.ts
│   │   ├── middleware.test.ts
│   │   ├── rate-limit.test.ts
│   │   ├── setup.ts
│   │   └── subtitle-parser.test.ts
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── admin/
│   │   │   │   ...
│   │   │   ├── ai-thumbnails/
│   │   │   │   ...
│   │   │   ├── analytics/
│   │   │   │   ...
│   │   │   ├── billing/
│   │   │   │   ...
│   │   │   ├── brand/
│   │   │   │   ...
│   │   │   ├── dashboard/
│   │   │   │   ...
│   │   │   ├── editor/
│   │   │   │   ...
│   │   │   ├── keywords/
│   │   │   │   ...
│   │   │   ├── media/
│   │   │   │   ...
│   │   │   ├── metadata/
│   │   │   │   ...
│   │   │   ├── onboarding/
│   │   │   │   ...
│   │   │   ├── preview/
│   │   │   │   ...
│   │   │   ├── referral/
│   │   │   │   ...
│   │   │   ├── settings/
│   │   │   │   ...
│   │   │   ├── shorts-analytics/
│   │   │   │   ...
│   │   │   ├── team/
│   │   │   │   ...
│   │   │   ├── thumbnails/
│   │   │   │   ...
│   │   │   ├── tiktok-analytics/
│   │   │   │   ...
│   │   │   ├── tools/
│   │   │   │   ...
│   │   │   ├── welcome/
│   │   │   │   ...
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx
│   │   │   └── loading.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   ...
│   │   │   ├── register/
│   │   │   │   ...
│   │   │   └── error.tsx
│   │   ├── (legal)/
│   │   │   ├── dpa/
│   │   │   │   ...
│   │   │   ├── oferta/
│   │   │   │   ...
│   │   │   ├── privacy/
│   │   │   │   ...
│   │   │   ├── security/
│   │   │   │   ...
│   │   │   ├── sla/
│   │   │   │   ...
│   │   │   ├── terms/
│   │   │   │   ...
│   │   │   └── layout.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ...
│   │   │   ├── auth/
│   │   │   │   ...
│   │   │   ├── auth-debug/
│   │   │   │   ...
│   │   │   ├── collaboration/
│   │   │   │   ...
│   │   │   ├── contact/
│   │   │   │   ...
│   │   │   ├── cron/
│   │   │   │   ...
│   │   │   ├── free-tools/
│   │   │   │   ...
│   │   │   ├── gen-thumbs/
│   │   │   │   ...
│   │   │   ├── health/
│   │   │   │   ...
│   │   │   ├── indexnow/
│   │   │   │   ...
│   │   │   ├── metrics/
│   │   │   │   ...
│   │   │   ├── newsletter/
│   │   │   │   ...
│   │   │   ├── og/
│   │   │   │   ...
│   │   │   ├── push/
│   │   │   │   ...
│   │   │   ├── stripe/
│   │   │   │   ...
│   │   │   ├── tools/
│   │   │   │   ...
│   │   │   ├── trpc/
│   │   │   │   ...
│   │   │   ├── upload/
│   │   │   │   ...
│   │   │   ├── user/
│   │   │   │   ...
│   │   │   ├── v1/
│   │   │   │   ...
│   │   │   ├── webhooks/
│   │   │   │   ...
│   │   │   └── youtube/
│   │   │       ...
│   │   ├── api-docs/
│   │   │   ├── ApiPlayground.tsx
│   │   │   ├── CodeExamples.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   ├── [slug]/
│   │   │   │   ...
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── changelog/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── compare/
│   │   │   └── [slug]/
│   │   │       ...
│   │   ├── contact/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── features/
│   │   │   ├── ai-image-generator/
│   │   │   │   ...
│   │   │   ├── ai-voiceover/
│   │   │   │   ...
│   │   │   ├── content-planner/
│   │   │   │   ...
│   │   │   ├── cover-editor/
│   │   │   │   ...
│   │   │   ├── seo-metadata/
│   │   │   │   ...
│   │   │   ├── subtitle-editor/
│   │   │   │   ...
│   │   │   ├── video-compressor/
│   │   │   │   ...
│   │   │   ├── video-generation/
│   │   │   │   ...
│   │   │   ├── video-translator/
│   │   │   │   ...
│   │   │   └── youtube-analyzer/
│   │   │       ...
│   │   ├── free-tools/
│   │   │   ├── channel-name-generator/
│   │   │   │   ...
│   │   │   ├── character-counter/
│   │   │   │   ...
│   │   │   ├── description-generator/
│   │   │   │   ...
│   │   │   ├── script-generator/
│   │   │   │   ...
│   │   │   ├── shorts-dimensions/
│   │   │   │   ...
│   │   │   ├── tag-generator/
│   │   │   │   ...
│   │   │   ├── thumbnail-checker/
│   │   │   │   ...
│   │   │   ├── title-generator/
│   │   │   │   ...
│   │   │   ├── video-ideas/
│   │   │   │   ...
│   │   │   └── page.tsx
│   │   ├── gallery/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── help/
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── indexnow-key.txt/
│   │   │   └── route.ts
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── [userId]/
│   │   │       ...
│   │   ├── share/
│   │   │   └── [id]/
│   │   │       ...
│   │   ├── status/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── tools/
│   │   │   ├── youtube-description-generator/
│   │   │   │   ...
│   │   │   ├── youtube-money-calculator/
│   │   │   │   ...
│   │   │   ├── youtube-tag-generator/
│   │   │   │   ...
│   │   │   ├── youtube-thumbnail-size/
│   │   │   │   ...
│   │   │   └── youtube-title-generator/
│   │   │       ...
│   │   ├── vpn/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   ├── providers.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── analytics/
│   │   │   └── StatCard.tsx
│   │   ├── charts/
│   │   ├── collaboration/
│   │   │   └── ProjectCollaborators.tsx
│   │   ├── landing/
│   │   │   ├── AnalyzerMockup.tsx
│   │   │   ├── ClientCookieConsent.tsx
│   │   │   ├── DashboardMockup.tsx
│   │   │   ├── FaqAccordion.tsx
│   │   │   ├── index.ts
│   │   │   ├── LandingHero.tsx
│   │   │   ├── LandingNav.tsx
│   │   │   ├── NewsletterForm.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   ├── ProductDemo.tsx
│   │   │   ├── ReferralCapture.tsx
│   │   │   ├── ScrollRevealProvider.tsx
│   │   │   └── StickyMobileCTA.tsx
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── onboarding/
│   │   │   └── OnboardingTour.tsx
│   │   ├── project/
│   │   │   └── ImportModal.tsx
│   │   ├── ui/
│   │   │   ├── CollaborationCursors.tsx
│   │   │   ├── CookieConsent.tsx
│   │   │   ├── DashboardUpgradeModal.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorFallback.tsx
│   │   │   ├── FeedbackWidget.tsx
│   │   │   ├── FrameSlot.tsx
│   │   │   ├── index.ts
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── OnlineUsers.tsx
│   │   │   ├── SceneLockIndicator.tsx
│   │   │   ├── ShortcutsModal.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── ToastProvider.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── UpgradePopupModal.tsx
│   │   │   ├── UpgradePrompt.tsx
│   │   │   ├── WaitingGame.tsx
│   │   │   └── WhatsNew.tsx
│   │   ├── Analytics.tsx
│   │   ├── PushNotificationManager.tsx
│   │   ├── ServiceWorkerRegistration.tsx
│   │   └── WebVitals.tsx
│   ├── hooks/
│   │   ├── useCanvasKeyboard.ts
│   │   ├── useCollaboration.ts
│   │   ├── useDesignHints.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useMediaQuery.ts
│   │   ├── usePlanLimits.ts
│   │   ├── useProjectSync.ts
│   │   ├── useUndoHint.ts
│   │   └── useVideoGeneration.ts
│   ├── lib/
│   │   ├── activity-log.ts
│   │   ├── analytics-events.ts
│   │   ├── api-keys.ts
│   │   ├── blog-posts-new.ts
│   │   ├── blog-posts-seo.ts
│   │   ├── blog-posts.ts
│   │   ├── cache.ts
│   │   ├── changelog.ts
│   │   ├── constants.ts
│   │   ├── crypto.ts
│   │   ├── element-presets.ts
│   │   ├── email-templates.ts
│   │   ├── email.ts
│   │   ├── env.ts
│   │   ├── export-pdf.ts
│   │   ├── export-svg.ts
│   │   ├── feature-flags.ts
│   │   ├── ffmpeg.ts
│   │   ├── fonts.ts
│   │   ├── help-articles.ts
│   │   ├── history.ts
│   │   ├── i18n.ts
│   │   ├── image-storage.ts
│   │   ├── indexnow.ts
│   │   ├── logger.ts
│   │   ├── push.ts
│   │   ├── rate-limit.ts
│   │   ├── sanitize.ts
│   │   ├── security-headers.ts
│   │   ├── storage.ts
│   │   ├── subtitle-parser.ts
│   │   ├── thumbnail-templates.ts
│   │   ├── trpc.ts
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   ├── webhook-delivery.ts
│   │   └── wireguard.ts
│   ├── locales/
│   │   ├── en.json
│   │   ├── es.json
│   │   ├── kk.json
│   │   └── ru.json
│   ├── server/
│   │   ├── db/
│   │   │   └── index.ts
│   │   ├── routers/
│   │   │   ├── _app.ts
│   │   │   ├── admin.ts
│   │   │   ├── ai.ts
│   │   │   ├── aiThumbnails.ts
│   │   │   ├── analytics.ts
│   │   │   ├── apikey.ts
│   │   │   ├── asset.ts
│   │   │   ├── billing.ts
│   │   │   ├── brand.ts
│   │   │   ├── comment.ts
│   │   │   ├── folder.ts
│   │   │   ├── keywords.ts
│   │   │   ├── media.ts
│   │   │   ├── project.ts
│   │   │   ├── referral.ts
│   │   │   ├── scene.ts
│   │   │   ├── stock.ts
│   │   │   ├── team.ts
│   │   │   ├── toolHistory.ts
│   │   │   ├── user.ts
│   │   │   ├── videoTask.ts
│   │   │   ├── vpn.ts
│   │   │   ├── webhook.ts
│   │   │   └── youtube.ts
│   │   ├── auth.ts
│   │   └── trpc.ts
│   ├── stores/
│   │   ├── useActivityStore.ts
│   │   ├── useContentPlannerStore.ts
│   │   ├── useEditorStore.ts
│   │   ├── useLocaleStore.ts
│   │   ├── useMetadataStore.ts
│   │   ├── useMobileMenuStore.ts
│   │   ├── useMultiPublisherStore.ts
│   │   ├── useNotificationStore.ts
│   │   ├── usePresenceStore.ts
│   │   ├── useThemeStore.ts
│   │   ├── useThumbnailStore.ts
│   │   └── useVersionStore.ts
│   ├── types/
│   │   └── next-auth.d.ts
│   ├── views/
│   │   ├── Admin/
│   │   │   └── AdminPage.tsx
│   │   ├── AiThumbnails/
│   │   │   └── AiThumbnailsPage.tsx
│   │   ├── Billing/
│   │   │   └── BillingPage.tsx
│   │   ├── Brand/
│   │   │   └── BrandKit.tsx
│   │   ├── Dashboard/
│   │   │   ├── ChannelAnalytics.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── Editor/
│   │   │   ├── EditorPage.tsx
│   │   │   └── ToolsHub.tsx
│   │   ├── Keywords/
│   │   │   └── KeywordsPage.tsx
│   │   ├── Media/
│   │   │   └── MediaLibrary.tsx
│   │   ├── Metadata/
│   │   │   └── Metadata.tsx
│   │   ├── Preview/
│   │   │   └── PreviewSave.tsx
│   │   ├── Settings/
│   │   │   └── SettingsPage.tsx
│   │   ├── ShortsAnalytics/
│   │   │   └── ShortsAnalytics.tsx
│   │   ├── Team/
│   │   │   └── TeamPage.tsx
│   │   ├── Thumbnails/
│   │   │   ├── panels/
│   │   │   │   ...
│   │   │   ├── AIGenerator.tsx
│   │   │   ├── LeftSidebar.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   ├── ThumbnailEditor.tsx
│   │   │   └── ToolBar.tsx
│   │   ├── TiktokAnalytics/
│   │   │   └── TiktokAnalytics.tsx
│   │   └── Tools/
│   │       ├── AiCreator.tsx
│   │       ├── AiThumbnailEditor.tsx
│   │       ├── AiVideoGenerator.tsx
│   │       ├── AudioBalancer.tsx
│   │       ├── AutoClip.tsx
│   │       ├── BackgroundRemover.tsx
│   │       ├── Brainstormer.tsx
│   │       ├── ContentPlanner.tsx
│   │       ├── CutCrop.tsx
│   │       ├── FaceSwap.tsx
│   │       ├── FakeTextsGenerator.tsx
│   │       ├── ImageGenerator.tsx
│   │       ├── index.tsx
│   │       ├── Mp3Converter.tsx
│   │       ├── Mp4ToGif.tsx
│   │       ├── MultiPublisher.tsx
│   │       ├── RedditVideoGenerator.tsx
│   │       ├── SpeechEnhancer.tsx
│   │       ├── SubtitleEditor.tsx
│   │       ├── SubtitleRemover.tsx
│   │       ├── TiktokDownloader.tsx
│   │       ├── ToolPageShell.tsx
│   │       ├── Veo3Generator.tsx
│   │       ├── VideoCompressor.tsx
│   │       ├── VideoTranslator.tsx
│   │       ├── VocalRemover.tsx
│   │       ├── VoiceChanger.tsx
│   │       ├── VoiceoverGenerator.tsx
│   │       └── YoutubeDownloader.tsx
│   ├── App.jsx
│   ├── main.jsx
│   └── middleware.ts
├── tasks/
│   └── lessons.md
├── tmp/
│   └── video-translate-jobs/
│       └── 88ce92fa-7193-4dbe-b01a-0966b5b98743/
│           ├── input.mp4
│           └── output.mp4
├── .env.example
├── AGENTS.md
├── capacitor.config.ts
├── CLAUDE.md
├── DEPLOYMENT.md
├── ecosystem.config.cjs
├── ecosystem.config.js
├── eslint.config.mjs
├── index.html
├── LAUNCH_PLAN.md
├── LICENSE
├── MASTER_PLAN_2.md
├── MASTER_PLAN_4.md
├── MASTER_PLAN.md
├── MOBILE_PLAN.md
├── next-env.d.ts
├── next.config.ts
├── package.json
├── PLATFORM_STATE.md
├── playwright.config.ts
├── sentry.client.config.ts
├── sentry.edge.config.ts
├── sentry.server.config.ts
├── SESSION_B_PLAN.md
├── start.js
├── test-1-landing.js
├── test-2-audio-converter.js
├── test-3-video-compressor.js
├── test-4-security-headers.js
├── test-5-api-routes.js
├── test-6-static-assets.js
├── test-7-tools-ui.js
├── test-all.js
├── test-e2e-api.js
├── test-e2e-ffmpeg.js
├── test-e2e-navigation.js
├── test-e2e-performance.js
├── test-e2e-security.js
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── vercel.json
├── vite.config.js
└── vitest.config.ts
```

## Key Files
- package.json (2261 bytes)
- tsconfig.json (718 bytes)
- vite.config.js (135 bytes)
- next.config.ts (2762 bytes)
- .env.example (5271 bytes)
- src/ (469 files)
