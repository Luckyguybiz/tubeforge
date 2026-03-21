# MASTER_PLAN.md — TubeForge Full Audit + Conversion + World-Class UX

> **Инструкция:** Выполняй блоки A→T последовательно. После каждого блока — `npx tsc --noEmit`.
> Отмечай `[x]` по мере выполнения. Перечитывай этот файл после каждого сжатия контекста.
> В конце — 3 раунда верификации (блок U). Коммить после каждого блока.

---

## Блок A: Безопасность (CRITICAL) — 6 задач

**Файлы:** `server/routers/admin.ts`, `team.ts`, `asset.ts`, `folder.ts`, `ai.ts`, `scene.ts`

- [ ] **A1. Admin privilege escalation** (`server/routers/admin.ts`)
  - Баг: `updateUser` позволяет ADMIN менять `role` других юзеров
  - Фикс: убрать `role` из input schema `updateUser` — через админку можно менять только `plan`

- [ ] **A2. Team shareProject TOCTOU** (`server/routers/team.ts`)
  - Баг: `project.update` без `userId` в where — любой может шарить чужой проект
  - Фикс: добавить `userId: ctx.session.user.id` в where clause `project.update`

- [ ] **A3. Asset move ownership** (`server/routers/asset.ts`)
  - Баг: нет проверки ownership на destination `folderId`
  - Фикс: перед `asset.update`, проверить `designFolder.findFirst({ where: { id: folderId, userId } })`

- [ ] **A4. Folder create parent ownership** (`server/routers/folder.ts`)
  - Баг: нет проверки ownership на `parentId`
  - Фикс: перед `designFolder.create`, проверить parent ownership если `parentId` задан

- [ ] **A5. AI limit bypass** (`server/routers/ai.ts`)
  - Баг: `checkAILimit` делает early return после reset `aiUsage=0` без проверки лимита
  - Фикс: после reset — НЕ делать return, fall through к проверке лимита

- [ ] **A6. AI usage race condition** (`server/routers/ai.ts`)
  - Баг: increment после API call (double-click = double spend)
  - Фикс: уже использует Serializable transaction — проверить что increment ДО вызова DALL-E. Если нет — переставить

**Тест после блока:** `npx tsc --noEmit` + ручная проверка каждого роутера

---

## Блок B: Инфраструктура безопасности — 3 задачи

**Файлы:** `lib/rate-limit.ts`, `server/trpc.ts`, `server/routers/scene.ts`

- [ ] **B1. Rate limit memory leak** (`lib/rate-limit.ts`)
  - Баг: `Map` растёт без ограничений
  - Фикс: добавить `MAX_ENTRIES = 10_000`; при превышении — emergency cleanup (удалить entries старше windowMs)

- [ ] **B2. tRPC internal error leak** (`server/trpc.ts`)
  - Баг: stack traces и internal errors утекают клиенту в production
  - Фикс: добавить `errorFormatter` — в production strip stack trace, заменить internal errors на generic message

- [ ] **B3. Scene delete TOCTOU** (`server/routers/scene.ts`)
  - Баг: find + delete без userId в where
  - Фикс: обернуть в `$transaction`, добавить `userId` проверку через project ownership

**Тест:** `npx tsc --noEmit`

---

## Блок C: Billing & Auth — 5 задач

**Файлы:** `server/routers/youtube.ts`, `app/api/webhooks/stripe/route.ts`, `server/routers/billing.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`

- [ ] **C1. Google token refresh** (`server/routers/youtube.ts`)
  - Баг: при ошибке парсинга refresh token — возвращает старый expired token
  - Фикс: если response.ok но нет `access_token` в body — throw UNAUTHORIZED, не fallback к старому

- [ ] **C2. Stripe webhook error handling** (`app/api/webhooks/stripe/route.ts`)
  - Баг: catch block возвращает 200 даже при DB ошибке (Stripe не делает retry)
  - Фикс: catch → return `NextResponse.json({ error }, { status: 500 })` — Stripe будет retry до 72ч

- [ ] **C3. Billing history** (`server/routers/billing.ts`)
  - Баг: нет процедуры для получения инвойсов (уже есть `getInvoices` — проверить что работает)
  - Фикс: если `getInvoices` есть — убедиться что UI его вызывает. Если нет UI — добавить секцию в BillingPage

- [ ] **C4. OAuth error banner** (`app/(auth)/login/page.tsx`)
  - Баг: при неудачной OAuth авторизации — нет error banner
  - Фикс: читать `searchParams.get('error')` и показывать красный banner с понятным сообщением

- [ ] **C5. Брендинг консистентность** (`login/page.tsx`, `register/page.tsx`)
  - Баг: логотип "Y" вместо "TF" на auth страницах
  - Фикс: заменить "Y" на "TF" или на общий LogoMark компонент

**Тест:** `npx tsc --noEmit`

---

## Блок D: Видео-пайплайн — 4 задачи

**Файлы:** `hooks/useVideoGeneration.ts`, `server/routers/videoTask.ts`, `views/Preview/PreviewSave.tsx`

- [ ] **D1. TaskID persist** (`hooks/useVideoGeneration.ts`)
  - Баг: taskId хранится только в React ref, теряется при refresh
  - Фикс: в `onSuccess` — сохранять taskId в scene metadata через `scene.update`; при mount — восстанавливать

- [ ] **D2. checkStatus ownership** (`server/routers/videoTask.ts`)
  - Баг: любой юзер может проверить статус любого taskId
  - Фикс: join через scene → project → проверить `project.userId === ctx.session.user.id`

- [ ] **D3. Sequential preview playback** (`views/Preview/PreviewSave.tsx`)
  - Баг: нет последовательного воспроизведения сцен
  - Фикс: добавить `currentSceneIndex` state + auto-advance через `onEnded` callback

- [ ] **D4. Video generation error recovery**
  - Баг: при ошибке генерации — нет retry UI
  - Фикс: добавить кнопку "Retry" при failed status + показать причину ошибки

**Тест:** `npx tsc --noEmit`

---

## Блок E: Dashboard & Editor UX — 6 задач

**Файлы:** `views/Dashboard/Dashboard.tsx`, `views/Editor/EditorPage.tsx`, `stores/useEditorStore.ts`, `components/layout/Sidebar.tsx`

- [ ] **E1. Dashboard filters persist** (`views/Dashboard/Dashboard.tsx`)
  - Баг: фильтры/поиск теряются при навигации
  - Фикс: persist через URL searchParams + `router.replace` (без добавления в history)

- [ ] **E2. Duplicate project** (`views/Dashboard/Dashboard.tsx`)
  - Баг: нет кнопки дублирования
  - Фикс: в context menu добавить "Дублировать" → `project.create` с копией всех сцен

- [ ] **E3. Undo/Redo** (`stores/useEditorStore.ts`)
  - Баг: нет undo/redo для операций со сценами
  - Фикс: добавить `history[]` / `future[]` arrays + `undo()` / `redo()` actions + Ctrl+Z / Ctrl+Y listeners

- [ ] **E4. Prompt character counter** (`views/Editor/EditorPage.tsx`)
  - Баг: нет счётчика символов у prompt textarea
  - Фикс: добавить `{prompt.length}/2000` под textarea с цветовой индикацией (красный >1800)

- [ ] **E5. Sidebar collapse persist** (`components/layout/Sidebar.tsx`)
  - Баг: collapsed state теряется при refresh
  - Фикс: persist в localStorage key `tf-sidebar-collapsed`

- [ ] **E6. Performance — memo components** (`views/Dashboard/Dashboard.tsx`, `views/Editor/EditorPage.tsx`)
  - Баг: карточки проектов/сцен re-render при любом state change
  - Фикс: извлечь `ProjectCard` и `SceneCard` как `React.memo()` компоненты

**Тест:** `npx tsc --noEmit`

---

## Блок F: Metadata & Thumbnails — 5 задач

**Файлы:** `views/Metadata/Metadata.tsx`, `stores/useMetadataStore.ts`, `views/Thumbnails/ThumbnailEditor.tsx`, `views/Thumbnails/PropertiesPanel.tsx`, `stores/useThumbnailStore.ts`

- [ ] **F1. Timestamp parsing** (`views/Metadata/Metadata.tsx`)
  - Баг: хрупкий regex может упасть
  - Фикс: robust regex `/(\d{1,2}):(\d{2})(?::(\d{2}))?/` + валидация h<24, m/s<60

- [ ] **F2. AI suggestions dedup** (`views/Metadata/Metadata.tsx`)
  - Баг: AI tags дублируют существующий контент
  - Фикс: `aiTags.filter(t => !existingTags.map(e => e.toLowerCase()).includes(t.toLowerCase()))`

- [ ] **F3. Canvas coords scale** (`views/Thumbnails/ThumbnailEditor.tsx`)
  - Баг: `getCanvasCoords` использует один scale factor для X и Y
  - Фикс: отдельные `sx = canvasW / rect.width`, `sy = canvasH / rect.height`

- [ ] **F4. Snap threshold zoom-aware** (`views/Thumbnails/ThumbnailEditor.tsx`)
  - Баг: snap threshold не учитывает zoom level
  - Фикс: `const SNAP_THRESHOLD = 5 / zoom`

- [ ] **F5. Shadow parsing fallback** (`views/Thumbnails/PropertiesPanel.tsx`)
  - Баг: `shadow.match()` может вернуть null — тихий crash
  - Фикс: try-catch + fallback к дефолтным значениям `{ x: 2, y: 2, blur: 4, color: '#000' }`

**Тест:** `npx tsc --noEmit`

---

## Блок G: Landing & SEO — 6 задач

**Файлы:** `app/page.tsx` (landing), `app/layout.tsx` (root), `app/robots.ts`, `app/sitemap.ts`, `app/globals.css`

- [ ] **G1. Убрать фейковые цифры** (`app/page.tsx`)
  - Баг: "12K+ users", "480K+ видео" — фейк, убьёт доверие
  - Фикс: заменить на честные trust signals: "Запущено в 2026", "ИИ нового поколения", "99.9% uptime", "Данные в EU"

- [ ] **G2. JSON-LD structured data** (`app/page.tsx` или `app/layout.tsx`)
  - Баг: нет structured data для Google
  - Фикс: добавить `<script type="application/ld+json">` с `SoftwareApplication` + `FAQPage` schema

- [ ] **G3. Canonical URL** (`app/layout.tsx`)
  - Баг: нет canonical URL в metadata
  - Фикс: добавить `alternates: { canonical: 'https://tubeforge.co' }` в root metadata

- [ ] **G4. FAQ секция** (`app/page.tsx`)
  - Баг: нет FAQ — теряем SEO и не отвечаем на возражения
  - Фикс: добавить аккордеон с 6-8 вопросами между pricing и CTA:
    - "Что такое TubeForge?"
    - "Нужно ли платить?"
    - "Какие форматы видео поддерживаются?"
    - "Как работает ИИ-генерация?"
    - "Могу ли я отменить подписку?"
    - "Безопасны ли мои данные?"
    - "Есть ли API?"
    - "Чем TubeForge лучше конкурентов?"

- [ ] **G5. Sitemap fix** (`app/sitemap.ts`)
  - Баг: `lastModified: new Date()` обновляется на каждый запуск
  - Фикс: использовать фиксированную дату или build timestamp

- [ ] **G6. Open Graph images** (`app/layout.tsx`)
  - Баг: нет OG image для social sharing
  - Фикс: добавить `openGraph.images` в metadata с дефолтной OG-картинкой

**Тест:** `npx tsc --noEmit` + `curl -s https://tubeforge.co | grep -c 'ld+json'`

---

## Блок H: Error Handling & Notifications — 4 задачи

**Файлы:** `stores/useNotificationStore.ts`, `components/layout/TopBar.tsx`, `components/ui/ErrorFallback.tsx`, `hooks/useCanvasKeyboard.ts`, `lib/constants.ts`

- [ ] **H1. Notification bell** (`stores/useNotificationStore.ts`, `TopBar.tsx`)
  - Баг: нет in-app уведомлений
  - Фикс: если уже реализовано (проверить TopBar) — убедиться что работает. Если нет:
    - Расширить store: `notifications[]` с `{ id, title, message, read, createdAt }`
    - В TopBar: bell icon с badge (unread count) + dropdown list

- [ ] **H2. Keyboard shortcuts help** (`lib/constants.ts`, `useCanvasKeyboard.ts`)
  - Баг: есть `KEYBOARD_SHORTCUTS` массив, но нет UI для показа
  - Фикс: при нажатии `?` — показать modal со списком горячих клавиш из `KEYBOARD_SHORTCUTS`

- [ ] **H3. ErrorFallback recovery** (`components/ui/ErrorFallback.tsx`)
  - Баг: generic сообщения без контекстных советов
  - Фикс: `getSuggestions(error)` — по типу ошибки давать конкретные советы (reload, re-login, check connection)

- [ ] **H4. Global mutation error handler** (`app/providers.tsx`)
  - Баг: нет global error handler для tRPC mutations
  - Фикс: добавить `onError` в QueryClient defaults — показывать toast с ошибкой

**Тест:** `npx tsc --noEmit`

---

## Блок I: User Journey — Путь к покупке (NEW) — 8 задач

> Цель: каждый шаг юзера ведёт к осознанию ценности → желанию Pro → покупке

**I1. Usage Progress Bar в Sidebar** (`components/layout/Sidebar.tsx`)
- Добавить внизу sidebar виджет:
  ```
  ┌─────────────────────┐
  │ 📊 Ваш план: FREE   │
  │ Проекты: ██░░ 2/3   │
  │ ИИ: █░░░░ 1/5       │
  │ [Улучшить план →]   │
  └─────────────────────┘
  ```
- Прогресс-бар меняет цвет: зелёный → жёлтый (>60%) → красный (>90%)
- Кнопка "Улучшить план" ведёт на `/billing`

**I2. Smart Upgrade Nudges** (`components/ui/UpgradePrompt.tsx`)
- Текущий UpgradePrompt слишком generic (🔒 "Limit Reached")
- Заменить на контекстные сообщения:
  - При лимите проектов: "У вас уже 3 проекта — вы явно серьёзно настроены! С Pro вы сможете вести до 25 каналов"
  - При лимите AI: "5 генераций — это только начало. Pro даёт 100/мес для масштабного контента"
  - При лимите сцен: "Ваше видео растёт! Pro поддерживает до 50 сцен для длинных форматов"
- Добавить сравнительную таблицу FREE vs PRO прямо в prompt
- Добавить "Попробовать бесплатно 7 дней" если есть trial

**I3. First Video Celebration** (`views/Preview/PreviewSave.tsx`)
- После первого успешного рендера видео:
  - Confetti animation (lightweight CSS confetti)
  - "Поздравляем! Ваше первое видео готово! 🎬"
  - Кнопки: "Скачать" | "Создать ещё" | "Поделиться"
  - Subtle nudge: "С Pro — экспорт в 1080p без водяного знака"
- Проверять через `user.projectCount === 1 && scene.status === 'completed'`

**I4. Dashboard Usage Widget** (`views/Dashboard/Dashboard.tsx`)
- В Welcome секции добавить карточку "Ваш план":
  ```
  ┌──────────────────────────────────┐
  │  FREE план                       │
  │  Проекты: 2 из 3  ██████░░ 67%  │
  │  ИИ генерации: 3 из 5  ████░ 60% │
  │  Экспорт: 720p (1080p в Pro)     │
  │  [Перейти на Pro — 990₽/мес →]   │
  └──────────────────────────────────┘
  ```
- Для PRO/STUDIO — показать использование без upgrade CTA

**I5. Onboarding → First Value быстрее** (`components/onboarding/OnboardingTour.tsx`)
- Текущий тур: 6 шагов, generic "вот sidebar, вот tools"
- Новый тур: 4 шага, action-oriented:
  1. "Добро пожаловать! Давайте создадим ваше первое видео за 2 минуты"
  2. "Нажмите '+ Новый проект'" (spotlight на кнопку)
  3. "Опишите ваше видео — ИИ сгенерирует сцены" (spotlight на prompt)
  4. "Готово! Посмотрите ваши инструменты" (spotlight на tools)
- Убрать шаги про billing из онбординга (не продавай на первом свидании)

**I6. Pricing Psychology** (`views/Billing/BillingPage.tsx`)
- Добавить годовую подписку: PRO 790₽/мес (при оплате за год) — экономия 2400₽
- Показать "Самый популярный" badge на PRO
- Добавить guarantee: "7 дней возврат без вопросов"
- Показать что включено ВСЁ из FREE в PRO (не только дельту)
- Добавить testimonial/quote рядом с каждым планом

**I7. Contextual Feature Previews** (across app)
- Когда FREE юзер видит 720p export — показать превью 1080p с blur overlay + "Доступно в Pro"
- Когда FREE юзер видит watermark — tooltip "Уберите водяной знак с Pro"
- В Metadata AI suggestions — после 5 использований показать "Осталось 0. С Pro — 100/мес"
- НЕ блокировать UX — только информировать

**I8. Email Drip Sequence** (`lib/email-templates.ts`)
- День 1: Welcome (уже есть) — добавить "Создайте первое видео за 2 минуты"
- День 3: "Вы создали {n} проектов! Вот что ещё можно:" + showcase Pro features
- День 7: "Ваш бесплатный план: {usage}. Готовы масштабироваться?" + limited time offer
- День 14: "Мы добавили новые фичи" + changelog highlights
- Отправка через cron job или при login если `daysSinceRegistration` matches

**Тест:** `npx tsc --noEmit` + визуальная проверка всех touchpoints

---

## Блок J: Новый функционал — 5 задач

- [ ] **J1. Export/Import проектов** (`server/routers/project.ts`, `Dashboard.tsx`)
  - JSON export всех сцен + metadata
  - Import с валидацией schema + plan limits check

- [ ] **J2. Bulk operations** (`views/Dashboard/Dashboard.tsx`)
  - Мультиселект чекбоксами → toolbar: "Удалить (3)" | "Архивировать (3)"
  - Select all / deselect all

- [ ] **J3. Project templates** (`views/Dashboard/Dashboard.tsx` или отдельный modal)
  - При "Новый проект" — показать: "Пустой проект" | "YouTube Shorts" | "Tutorial" | "Product Review"
  - Каждый template = preset scenes с placeholder текстами

- [ ] **J4. Usage Analytics в Settings** (`views/Settings/SettingsPage.tsx`)
  - Секция "Использование": AI генерации за 30 дней (мини-график), проекты, storage
  - Данные из `user.aiUsage` + `project.count` + `asset.sum(size)`

- [ ] **J5. Account deletion + Data export** (`views/Settings/SettingsPage.tsx`, `server/routers/profile.ts`)
  - "Удалить аккаунт" с подтверждением (ввести email) → cascade delete
  - "Скачать мои данные" → ZIP с projects JSON + assets
  - GDPR compliance

**Тест:** `npx tsc --noEmit`

---

## Блок K: DevOps & Performance — 6 задач

- [ ] **K1. Health check endpoint** (`app/api/health/route.ts` — новый файл)
  - GET `/api/health` → проверяет DB ping, возвращает `{ status: 'ok', db: true, uptime: X }`
  - Для мониторинга и load balancer health checks

- [ ] **K2. Structured logger** (`lib/logger.ts` — новый файл)
  - Заменить key `console.log/error` вызовы на `logger.info/error/warn`
  - JSON output с timestamp, level, context
  - В production — без stack traces в user-facing errors

- [ ] **K3. DB indexes** (`prisma/schema.prisma`)
  - `@@index([userId])` на Project, DesignFolder, DesignAsset
  - `@@index([projectId])` на Scene
  - `@@index([sceneId])` на VideoTask
  - Создать migration

- [ ] **K4. Bundle optimization**
  - Проверить `next.config.ts` — включить `experimental.optimizePackageImports` для крупных deps
  - Lazy load тяжёлых views (Editor, ThumbnailEditor) если ещё не lazy

- [ ] **K5. Redis/memory caching** на hot paths
  - `project.list` — кэш на 30с (invalidate при create/delete)
  - `billing.getSubscription` — кэш на 5 мин
  - Использовать simple in-memory Map с TTL если нет Redis

- [ ] **K6. Web Vitals tracking** (`app/layout.tsx`)
  - Добавить `reportWebVitals` для CLS, LCP, FID
  - Отправлять в console (production — можно в analytics позже)

**Тест:** `npx tsc --noEmit` + `npm run build`

---

## Блок L: i18n & Accessibility — 4 задачи

- [ ] **L1. English locale** (`locales/en.json` — новый файл)
  - Полный перевод `ru.json` → `en.json`
  - Добавить language switcher в Settings

- [ ] **L2. Keyboard navigation** (across app)
  - Focus rings на все interactive elements (убрать `outline: none` где есть)
  - Tab order проверить на Dashboard, Editor, Billing
  - `aria-label` на icon-only buttons

- [ ] **L3. Screen reader support**
  - `aria-live="polite"` на toast notifications
  - `role="alert"` на error messages
  - `alt` text на все images/icons

- [ ] **L4. Skip to content** (`app/(app)/layout.tsx`)
  - Проверить что `skip-to-content` link работает и видим при focus
  - Стилизовать: видим только при Tab focus

**Тест:** `npx tsc --noEmit`

---

## Блок N: Тестирование — 8 задач (~2.5ч)

- [ ] **N1. tRPC router unit tests** (`__tests__/server/routers/`)
  - Тесты на все security-critical роутеры: admin, team, asset, folder, ai, scene
  - Каждый тест: happy path + unauthorized access + edge cases
  - Mock Prisma с `vitest-mock-extended`

- [ ] **N2. Billing flow integration tests** (`__tests__/server/billing.test.ts`)
  - createCheckout → success/failure
  - Webhook processing: checkout.completed, subscription.updated, subscription.deleted, invoice.paid, invoice.payment_failed
  - Mock Stripe API responses
  - Verify DB state after each event

- [ ] **N3. Auth flow tests** (`__tests__/auth/`)
  - Login redirect, session creation, token refresh
  - OAuth error handling (error param in URL)
  - Protected route access without session → redirect to /login

- [ ] **N4. Rate limiter tests** (`__tests__/lib/rate-limit.test.ts`)
  - Normal usage within limits
  - Exceeding rate limit → 429
  - Memory cleanup after MAX_ENTRIES
  - Window reset after windowMs

- [ ] **N5. Plan limits tests** (`__tests__/server/plan-limits.test.ts`)
  - FREE user: create 4th project → FORBIDDEN
  - FREE user: 6th AI generation → FORBIDDEN
  - PRO user: 26th project → FORBIDDEN
  - STUDIO user: unlimited → OK
  - Monthly reset logic

- [ ] **N6. E2E smoke tests** (`__tests__/e2e/smoke.test.ts`)
  - Landing page loads (200, contains key elements)
  - Login page loads, shows Google button
  - Dashboard loads for authenticated user
  - Editor loads, can create scene
  - API health check returns OK

- [ ] **N7. Component snapshot tests** (`__tests__/components/`)
  - UpgradePrompt renders correctly for each limit type
  - ErrorFallback renders with recovery suggestions
  - BillingPage renders all 3 plans
  - Dashboard renders welcome section

- [ ] **N8. Test seed script** (`prisma/seed.ts`)
  - Создать seed data: 3 юзера (FREE, PRO, STUDIO)
  - Каждый с проектами, сценами, AI usage
  - Один юзер с Stripe subscription mock
  - `npx prisma db seed` для быстрого dev setup

**Тест:** `npx vitest run`

---

## Блок O: Admin Dashboard Pro — 6 задач (~2ч)

**Файлы:** `views/Admin/AdminPage.tsx`, `server/routers/admin.ts`

- [ ] **O1. Revenue dashboard** (`views/Admin/AdminPage.tsx`)
  - Карточки: MRR, total revenue, active subscriptions, churn rate
  - Данные из Stripe API: `subscriptions.list`, `balance_transactions.list`
  - Мини-график revenue за 30 дней (SVG sparkline, без библиотек)

- [ ] **O2. User analytics** (`views/Admin/AdminPage.tsx`)
  - New users today/week/month
  - DAU/WAU/MAU (по lastLoginAt)
  - Conversion rate: FREE → PRO (count по plan)
  - Таблица top users by AI usage

- [ ] **O3. User management actions** (`server/routers/admin.ts`)
  - Suspend/unsuspend user (добавить `suspended: Boolean` в User model)
  - Force password reset (invalidate sessions)
  - Grant free trial (set plan=PRO + trialEndsAt)
  - View user's projects (read-only)

- [ ] **O4. System health в admin** (`views/Admin/AdminPage.tsx`)
  - DB connection status
  - Memory usage (process.memoryUsage)
  - Rate limiter stats (current entries count)
  - Last webhook received timestamp
  - Uptime

- [ ] **O5. Audit log** (`prisma/schema.prisma`, `server/routers/admin.ts`)
  - Новая модель `AuditLog { id, userId, action, target, metadata, createdAt }`
  - Логировать: plan changes, user suspensions, project deletions, admin actions
  - UI: таблица с фильтрами по action type и дате

- [ ] **O6. Bulk email to users** (`server/routers/admin.ts`)
  - Отправить email всем юзерам определённого плана
  - Template selector: announcement, maintenance, feature update
  - Preview before send
  - Rate limit: max 100 emails per batch (queue остальные)

**Тест:** `npx tsc --noEmit`

---

## Блок P: Advanced Editor — 7 задач (~2.5ч)

**Файлы:** `views/Editor/EditorPage.tsx`, `stores/useEditorStore.ts`, `components/editor/`

- [ ] **P1. Scene reordering drag & drop** (`views/Editor/EditorPage.tsx`)
  - Drag handle на каждой сцене
  - Чистый HTML5 DnD (dragstart, dragover, drop) — без библиотек
  - Update scene.order в DB после drop
  - Визуальная индикация drop target

- [ ] **P2. Scene transitions** (`stores/useEditorStore.ts`)
  - Добавить `transition` поле на Scene: 'none' | 'fade' | 'slide' | 'zoom'
  - UI: dropdown между сценами для выбора перехода
  - Preview: CSS transitions при переключении сцен

- [ ] **P3. Voiceover / TTS** (`server/routers/ai.ts`, `views/Editor/EditorPage.tsx`)
  - Кнопка "Озвучить" на каждой сцене
  - OpenAI TTS API (voice: alloy, model: tts-1)
  - Audio player в сцене + возможность скачать
  - Считается как AI usage (1 voiceover = 1 credit)

- [ ] **P4. Background music library** (`lib/constants.ts`, `views/Editor/EditorPage.tsx`)
  - 10 royalty-free tracks (URLs на public domain музыку)
  - Категории: Energetic, Calm, Corporate, Cinematic, Fun
  - Audio preview + select для проекта
  - Volume slider

- [ ] **P5. Auto-save** (`stores/useEditorStore.ts`)
  - Debounced auto-save каждые 30 секунд при изменениях
  - Индикатор: "Сохранено" / "Сохранение..." / "Не сохранено"
  - Recover unsaved changes при reconnect

- [ ] **P6. Scene duration control** (`views/Editor/EditorPage.tsx`)
  - Слайдер для длительности каждой сцены (3-30 секунд)
  - Default: 5 секунд
  - Total duration показать в header: "Общая длительность: 2:35"

- [ ] **P7. Rich text for scene captions** (`views/Editor/EditorPage.tsx`)
  - Bold, italic, color picker для текста сцен
  - Простой toolbar (3 кнопки) над textarea
  - Сохранение как markdown или HTML в scene.text

**Тест:** `npx tsc --noEmit`

---

## Блок Q: Public API & Webhooks — 5 задач (~1.5ч)

- [ ] **Q1. Public API endpoint** (`app/api/v1/` — новая папка)
  - REST API: `GET /api/v1/projects`, `POST /api/v1/projects`, `GET /api/v1/projects/:id`
  - Auth через API key (Bearer token)
  - Rate limit: 60 req/min для PRO, 300 req/min для STUDIO

- [ ] **Q2. API key management** (`server/routers/profile.ts`, `views/Settings/SettingsPage.tsx`)
  - Generate/revoke API keys в Settings
  - Модель `ApiKey { id, userId, key, name, lastUsedAt, createdAt }`
  - Показывать key только при создании (после — только last 4 chars)
  - Макс 3 ключа на юзера

- [ ] **Q3. Webhook system** (`server/routers/webhook.ts` — новый)
  - Юзер регистрирует URL для получения events
  - Events: `video.completed`, `project.created`, `project.deleted`
  - Retry logic: 3 attempts с exponential backoff
  - HMAC signing для верификации

- [ ] **Q4. API documentation page** (`app/api-docs/page.tsx` — новый)
  - Статическая страница с документацией API
  - Endpoints, auth, rate limits, examples (curl + JS)
  - Интерактивный "Try it" с API key input
  - Доступна только для STUDIO план

- [ ] **Q5. API usage tracking** (`server/routers/admin.ts`)
  - Трекинг: кто, когда, какой endpoint, response time
  - В admin: top API users, most used endpoints
  - В Settings: "API calls this month: 234/300"

**Тест:** `npx tsc --noEmit`

---

## Блок R: Social & Sharing — 5 задач (~1.5ч)

- [ ] **R1. Public project sharing** (`server/routers/project.ts`, `app/share/[id]/page.tsx`)
  - Кнопка "Поделиться" → генерирует public link `/share/{projectId}`
  - Public page: read-only preview видео + metadata
  - Флаг `project.isPublic` в DB
  - OG meta tags с preview image

- [ ] **R2. Social share buttons** (`app/share/[id]/page.tsx`)
  - Кнопки: "Копировать ссылку", "Twitter", "Telegram", "WhatsApp"
  - Pre-filled текст: "Посмотрите моё видео, созданное с TubeForge!"
  - Share count tracking (simple counter в DB)

- [ ] **R3. Public profile** (`app/profile/[username]/page.tsx`)
  - Публичная страница юзера с его public проектами
  - Avatar, display name, bio (добавить поля в User model)
  - Grid с public проектами
  - "Создано с TubeForge" badge

- [ ] **R4. Like / Bookmark system** (`server/routers/social.ts` — новый)
  - Юзеры могут лайкать и сохранять чужие public проекты
  - Модель `Like { userId, projectId }`, `Bookmark { userId, projectId }`
  - Показывать like count на public page
  - "Мои сохранённые" в Dashboard

- [ ] **R5. Community gallery** (`app/gallery/page.tsx` — новый)
  - Public page: все public проекты, отсортированные по likes/date
  - Фильтры: категория, сортировка, поиск
  - Карточки с preview, author, likes
  - Вдохновляет новых юзеров → конверсия

**Тест:** `npx tsc --noEmit`

---

## Блок S: PWA & Mobile — 5 задач (~1.5ч)

- [ ] **S1. Service Worker + manifest** (`public/manifest.json`, `app/sw.ts`)
  - PWA manifest: name, icons, theme_color, display: standalone
  - Service worker: cache static assets, offline fallback page
  - Install prompt на мобильных
  - "Добавить на главный экран" banner

- [ ] **S2. Push notifications** (`server/routers/push.ts` — новый)
  - Web Push API: подписка на push notifications
  - Триггеры: видео готово, новый реферал, подписка истекает
  - Модель `PushSubscription { userId, endpoint, keys }`
  - Settings toggle: вкл/выкл push

- [ ] **S3. Offline support** (`app/sw.ts`)
  - Кэшировать Dashboard data для offline просмотра
  - Показать banner "Вы офлайн — некоторые функции недоступны"
  - Queue mutations для retry когда online
  - `navigator.onLine` listener

- [ ] **S4. Mobile-optimized Editor** (`views/Editor/EditorPage.tsx`)
  - Responsive editor layout для <768px
  - Touch-friendly scene cards (larger tap targets, swipe to reorder)
  - Bottom sheet вместо side panels на mobile
  - Скрыть complex controls, показать essential

- [ ] **S5. App-like navigation** (`app/(app)/layout.tsx`)
  - Bottom tab bar на mobile (Dashboard, Editor, Tools, Settings)
  - Swipe между tabs
  - Pull-to-refresh на Dashboard
  - Haptic feedback на actions (если поддерживается)

**Тест:** `npx tsc --noEmit` + `npm run build` + Lighthouse PWA audit

---

## Блок T: Analytics, Monitoring & CI/CD — 6 задач (~1.5ч)

- [ ] **T1. Event tracking system** (`lib/analytics.ts` — новый)
  - Lightweight analytics: track key events (sign_up, project_create, video_generate, upgrade, share)
  - Store в DB: модель `AnalyticsEvent { userId, event, properties, createdAt }`
  - Client helper: `track('event_name', { props })`
  - Не зависит от внешних сервисов (свой tracking)

- [ ] **T2. Funnel analytics в admin** (`views/Admin/AdminPage.tsx`)
  - Воронка: Landing visit → Register → First project → First video → Upgrade
  - Визуализация: horizontal funnel bars
  - Conversion rate между каждым шагом
  - Filter по date range

- [ ] **T3. Error monitoring improvements** (`lib/logger.ts`)
  - Structured error logging: error type, user context, request path
  - Error aggregation: count по типу ошибки за последний час
  - В admin: "Top errors" widget
  - Alert если error rate > threshold (log warning)

- [ ] **T4. Uptime monitoring** (`app/api/cron/health/route.ts`)
  - Cron endpoint каждые 5 минут: проверить DB, Stripe, основные routes
  - Модель `HealthCheck { timestamp, dbOk, stripeOk, responseMs }`
  - В admin: uptime % за 30 дней + график response time
  - Alert если downtime > 5 мин (email to admin)

- [ ] **T5. CI/CD pipeline** (`.github/workflows/ci.yml` — новый)
  - On push: lint → typecheck → test → build
  - On PR: всё выше + preview comment с build status
  - On merge to main: build + deploy to VPS via SSH
  - Cache node_modules и .next между runs

- [ ] **T6. Database backup automation** (`scripts/backup.sh`, cron)
  - pg_dump каждые 6 часов
  - Хранить последние 7 дней (28 бэкапов)
  - Compress с gzip
  - Rotate: удалять старые автоматически
  - Health check: alert если бэкап не создался

**Тест:** `npx tsc --noEmit`

---

## Блок V: Legal & Compliance — 5 задач (~1.5ч)

> Без этого нельзя легально работать в EU. Canva, Notion, Figma — все имеют.

- [ ] **V1. Privacy Policy** (`app/privacy/page.tsx` — новый)
  - Полная страница Privacy Policy на русском и английском
  - Что собираем: email, Google OAuth data, usage data, payment info
  - Как используем: для предоставления сервиса, аналитики
  - Третьи стороны: Stripe, Google, OpenAI, Resend
  - Права пользователя: доступ, удаление, экспорт данных
  - Контакт для GDPR запросов

- [ ] **V2. Terms of Service** (`app/terms/page.tsx` — новый)
  - Условия использования сервиса
  - Допустимое использование (запрет на спам, hate content, copyright violation)
  - Ограничение ответственности
  - Условия подписки и возврата
  - Прекращение аккаунта
  - Изменение условий с уведомлением за 30 дней

- [ ] **V3. Cookie Consent upgrade** (`components/ui/CookieConsent.tsx`)
  - Текущий CookieConsent — проверить что он GDPR-compliant
  - Должен блокировать analytics/marketing cookies до согласия
  - Категории: Necessary (always on), Analytics (opt-in), Marketing (opt-in)
  - "Настроить" кнопка для granular control
  - Persist выбор и передавать в analytics

- [ ] **V4. Security page** (`app/security/page.tsx` — новый)
  - Описание мер безопасности: HTTPS everywhere, encrypted at rest, OAuth 2.0
  - Данные хранятся в EU (если VPS в EU)
  - Regular security audits
  - Incident response process
  - Contact: security@tubeforge.co
  - SOC 2 readiness statement

- [ ] **V5. DPA (Data Processing Agreement)** (`app/dpa/page.tsx` — новый)
  - Downloadable PDF или страница с DPA
  - Обязательно для EU business customers
  - Описывает как мы обрабатываем персональные данные
  - Sub-processors list (Stripe, Google, OpenAI, Resend, hosting provider)

**Тест:** `npx tsc --noEmit` + все страницы загружаются

---

## Блок W: Customer Support — 5 задач (~1.5ч)

> Платящие юзеры без поддержки = моментальный churn

- [ ] **W1. Help Center / Knowledge Base** (`app/help/page.tsx` — новый)
  - Страница с категориями: Getting Started, Billing, Editor, AI, Troubleshooting
  - 15-20 FAQ статей с поиском
  - Каждая статья: заголовок, контент, related articles
  - Данные в `lib/help-articles.ts` (статический массив, без CMS)

- [ ] **W2. In-App Feedback Reporter** (`components/ui/FeedbackWidget.tsx` — новый)
  - Кнопка "?" в правом нижнем углу (на всех страницах)
  - Клик → modal: тип (bug / feature request / question), описание, скриншот (optional)
  - Автоматически прикладывает: browser info, current URL, user plan, error logs
  - Отправляет email на support@tubeforge.co через Resend
  - Toast: "Спасибо! Мы ответим в течение 24 часов"

- [ ] **W3. Contact page** (`app/contact/page.tsx` — новый)
  - Форма обратной связи: имя, email, тема, сообщение
  - Отправка через Resend API
  - Ссылки на: help center, email, Telegram (если есть)
  - Estimated response time по плану: FREE 48ч, PRO 24ч, STUDIO 4ч

- [ ] **W4. In-App Changelog** (`app/changelog/page.tsx`, `components/ui/ChangelogBadge.tsx`)
  - Страница с датированными записями: "Что нового"
  - Badge "NEW" на bell icon когда есть непрочитанные обновления
  - Каждая запись: дата, заголовок, описание, тип (feature/fix/improvement)
  - Данные в `lib/changelog.ts` (статический массив)
  - Последнее прочитанное хранить в localStorage

- [ ] **W5. Status page** (`app/status/page.tsx` — новый)
  - Real-time статус: App, API, Database, Stripe, AI Generation
  - Данные из `/api/health` endpoint
  - Uptime % за 30 дней
  - Incident history (статический список + live health check)
  - "Подписаться на обновления" (email)

**Тест:** `npx tsc --noEmit`

---

## Блок X: Media Library & Brand Kit — 5 задач (~2ч)

> Canva's #1 retention feature. Юзеры хранят ассеты → привязаны к платформе.

- [ ] **X1. Personal Media Library** (`views/MediaLibrary/MediaLibrary.tsx` — новый, `server/routers/media.ts`)
  - Отдельная страница /media — все загруженные файлы юзера
  - Upload: drag & drop, поддержка images (jpg/png/webp), audio (mp3/wav), video (mp4)
  - Folder organization, tags, search
  - Storage limits: FREE 500MB, PRO 5GB, STUDIO 50GB
  - Reuse assets across projects

- [ ] **X2. Stock Asset Integration** (`server/routers/stock.ts` — новый)
  - Встроенный поиск stock images (Pexels API — бесплатный)
  - Встроенный поиск stock music (Pixabay Audio API — бесплатный)
  - Preview в app, one-click добавление в проект/медиатеку
  - Attribution автоматически добавляется
  - Кэширование результатов поиска

- [ ] **X3. Brand Kit** (`views/BrandKit/BrandKit.tsx` — новый, `server/routers/brand.ts`)
  - Модель `BrandKit { userId, colors[], fonts[], logos[], introTemplateId, outroTemplateId }`
  - UI: настройка brand colors (primary, secondary, accent), upload logo, выбор fonts
  - "Apply Brand Kit" кнопка в Editor — автоматически применяет цвета/лого ко всем сценам
  - Storage: logos в media library
  - STUDIO plan only (или частично PRO)

- [ ] **X4. Video Export Options** (`views/Preview/PreviewSave.tsx`, `server/routers/videoTask.ts`)
  - Выбор разрешения: 720p (FREE) / 1080p (PRO) / 4K (STUDIO)
  - Выбор aspect ratio: 16:9 (YouTube), 9:16 (Shorts/Reels), 1:1 (Instagram), 4:5 (Facebook)
  - Формат: MP4 (default), WebM, GIF (short clips only)
  - Subtitle export: .SRT и .VTT файлы
  - Audio-only export: MP3

- [ ] **X5. Watermark system** (`server/routers/videoTask.ts`, `views/Preview/PreviewSave.tsx`)
  - FREE: "Made with TubeForge" watermark (organic growth like Canva)
  - PRO: no watermark OR custom watermark (upload logo)
  - STUDIO: custom watermark с контролем position, opacity, size
  - Preview watermark в real-time

**Тест:** `npx tsc --noEmit`

---

## Блок Y: YouTube Publishing & Integrations — 5 задач (~2ч)

> Killer feature: юзер не выходит из TubeForge для публикации

- [ ] **Y1. YouTube Direct Upload** (`server/routers/youtube.ts`, `views/Preview/PreviewSave.tsx`)
  - OAuth с YouTube Data API v3 (уже есть частично)
  - После рендера: кнопка "Опубликовать на YouTube"
  - Форма: title, description, tags (prefilled из Metadata), thumbnail, playlist, visibility
  - Upload progress bar
  - Redirect на YouTube video page после успеха

- [ ] **Y2. Scheduled Publishing** (`server/routers/youtube.ts`, `views/Preview/PreviewSave.tsx`)
  - Date/time picker для отложенной публикации
  - YouTube API: `privacyStatus: 'private'` + `publishAt: ISO timestamp`
  - Показать scheduled videos в Dashboard с countdown
  - Email notification при публикации

- [ ] **Y3. Multi-Platform Prep** (`views/Preview/PreviewSave.tsx`)
  - Экспорт в нужном формате для каждой платформы:
    - YouTube: 16:9 MP4
    - TikTok/Shorts: 9:16 MP4 ≤60s
    - Instagram Reels: 9:16 MP4 ≤90s
    - Instagram Post: 1:1 MP4 ≤60s
  - UI: выбрать платформу → auto-подстраивает settings

- [ ] **Y4. Publishing History** (`server/routers/youtube.ts`, `views/Dashboard/Dashboard.tsx`)
  - Лог: что опубликовано, куда, когда, ссылка
  - Модель `Publication { projectId, platform, url, publishedAt, status }`
  - Виджет на Dashboard: "Недавно опубликовано"
  - Статус: published / scheduled / failed

- [ ] **Y5. Zapier/Make Integration Hooks** (`app/api/v1/webhooks/route.ts`)
  - Outgoing webhooks при key events (используя Q3 webhook system):
    - `video.exported` → триггер для Zapier
    - `project.created` → триггер
  - Документация для Zapier app submission
  - Это unlock-ит тысячи автоматизаций без кода

**Тест:** `npx tsc --noEmit`

---

## Блок Z: Advanced AI Features — 6 задач (~2.5ч)

> CapCut, InVideo, Descript — все гонятся за AI. Наши фичи должны быть лучше.

- [ ] **Z1. AI Script Generator** (`server/routers/ai.ts`, `views/Editor/EditorPage.tsx`)
  - Input: тема, тон (professional/casual/fun), длительность (30s/1min/3min)
  - Output: полный скрипт с разбивкой по сценам
  - OpenAI GPT-4 API с structured output
  - "Сгенерировать скрипт" кнопка в Editor → автоматически создаёт сцены
  - 1 generation = 2 AI credits

- [ ] **Z2. AI Auto-Captions** (`server/routers/ai.ts`, `views/Editor/EditorPage.tsx`)
  - OpenAI Whisper API: загрузить аудио → получить timestamped транскрипцию
  - Стили субтитров: Classic, Bold, Karaoke (word-by-word highlight), Minimal
  - Preview субтитров в редакторе
  - Burn-in при экспорте или export как .SRT
  - Это #1 requested feature в video tools (CapCut's killer feature)

- [ ] **Z3. AI Voice Cloning** (`server/routers/ai.ts`)
  - ElevenLabs API: запись 30 секунд голоса → клон
  - Генерация любого текста голосом юзера
  - STUDIO plan only (дорогой API)
  - Модель `VoiceClone { userId, elevenLabsVoiceId, name, sampleUrl }`
  - Consent checkbox: "Это мой голос и я даю согласие"

- [ ] **Z4. AI Background Removal** (`server/routers/ai.ts`)
  - Remove.bg API или Replicate: загрузить изображение → прозрачный фон
  - Полезно для thumbnail editor и scene backgrounds
  - Quick action в ThumbnailEditor: "Убрать фон"
  - 1 removal = 1 AI credit

- [ ] **Z5. AI Content Repurposing** (`server/routers/ai.ts`, `views/Editor/EditorPage.tsx`)
  - Из длинного видео (3+ мин) автоматически нарезать Shorts
  - AI анализирует скрипт → выбирает "hook" моменты → создаёт 3-5 коротких клипов
  - Каждый клип: 15-60 секунд, 9:16 формат, с субтитрами
  - "Создать Shorts из этого видео" кнопка

- [ ] **Z6. AI Thumbnail A/B Testing** (`server/routers/ai.ts`, `views/Thumbnails/`)
  - Генерация 3 вариантов thumbnail
  - Подключение к YouTube API для rotation
  - Tracking CTR через YouTube Analytics API
  - Через 48ч — автоматический выбор winner
  - PRO+ feature. TubeBuddy берёт $50/мес только за это

**Тест:** `npx tsc --noEmit`

---

## Блок AA: Collaboration & Versioning — 6 задач (~2ч)

> Figma = multiplayer. Notion = multiplayer. В 2026 single-player app не конкурирует.

- [ ] **AA1. Project Sharing with Roles** (`server/routers/team.ts`, `views/Editor/EditorPage.tsx`)
  - Invite by email: Owner / Editor / Viewer roles
  - Модель `ProjectShare { projectId, userId, role, invitedAt }`
  - Owner: full control. Editor: edit scenes/metadata. Viewer: read-only
  - Share modal: email input + role select + "Копировать ссылку"

- [ ] **AA2. Commenting System** (`server/routers/comment.ts` — новый, `views/Editor/`)
  - Комментарии на timeline сцены (timestamp-linked)
  - Thread: reply, resolve, unresolve
  - Модель `Comment { projectId, sceneId, userId, text, timestamp, parentId, resolvedAt }`
  - Real-time: polling каждые 30с (или WebSocket позже)
  - Notification при новом комментарии

- [ ] **AA3. Team Workspaces** (`server/routers/team.ts`, `views/Team/`)
  - Team = shared space с общими проектами, brand kit, templates
  - Модель уже есть (проверить) — расширить если нужно
  - Team Dashboard: все проекты команды
  - Invite/remove members, change roles
  - STUDIO plan: до 5 members. Enterprise: unlimited

- [ ] **AA4. Version History** (`server/routers/version.ts` — новый)
  - Auto-snapshot при каждом save (debounced, не чаще 1/5мин)
  - Модель `ProjectVersion { projectId, data (JSON), name, createdAt }`
  - Named versions: "Client Review v2", "Final Cut"
  - UI: timeline slider → preview any version
  - One-click restore (current → becomes new version)

- [ ] **AA5. Real-Time Presence** (`components/editor/Presence.tsx` — новый)
  - Показать аватары тех кто сейчас смотрит проект
  - Simple polling: `lastSeenAt` field + 30s heartbeat
  - Colored avatars с именами в header Editor
  - "Сейчас смотрят: You, Anna, Max"

- [ ] **AA6. Activity Feed** (`server/routers/activity.ts` — новый)
  - Лента действий на проекте: кто что менял
  - "Anna добавила сцену 3" / "Max изменил описание" / "You опубликовали на YouTube"
  - Sidebar panel в Editor
  - Модель `Activity { projectId, userId, action, metadata, createdAt }`

**Тест:** `npx tsc --noEmit`

---

## Блок AB: Retention & Growth — 7 задач (~2ч)

> Привлечь юзера — дорого. Удержать — дешевле и прибыльнее.

- [ ] **AB1. Onboarding Checklist** (`components/onboarding/OnboardingChecklist.tsx` — новый)
  - Persistent checklist в sidebar/dashboard:
    - ☑ Создать аккаунт
    - ☐ Создать первый проект
    - ☐ Добавить сцену с AI
    - ☐ Экспортировать видео
    - ☐ Настроить Brand Kit
    - ☐ Пригласить коллегу
  - Progress bar: "3 из 6 выполнено"
  - Награда за completion: +5 бонусных AI credits
  - Dismiss-able после completion

- [ ] **AB2. Empty States** (across all views)
  - Dashboard пустой: illustration + "Создайте первый проект за 2 минуты" + template cards
  - Media Library пустая: "Загрузите логотип и фото для ваших видео"
  - Editor без сцен: "Опишите ваше видео и AI создаст сцены"
  - Каждый empty state = call to action, не blank space

- [ ] **AB3. Activity Streaks** (`server/routers/profile.ts`, `views/Dashboard/Dashboard.tsx`)
  - Трекинг daily active usage (login + any action)
  - "🔥 5 дней подряд!" badge на Dashboard
  - Milestones: 7, 14, 30 дней → badge + bonus credits
  - Weekly email: "Ваш streak: 12 дней! Не останавливайтесь"

- [ ] **AB4. Usage Milestones** (`server/routers/profile.ts`)
  - Achievements:
    - "Первое видео" → 🎬 badge
    - "10 проектов" → ⭐ badge
    - "100 AI генераций" → 🤖 badge
    - "Первый реферал" → 🤝 badge
  - Показать в Profile и на Dashboard
  - Notification при достижении milestone

- [ ] **AB5. Re-engagement Emails** (`lib/email-templates.ts`, cron)
  - 3 дня без логина: "Ваш проект '{name}' ждёт вас"
  - 7 дней: "Мы добавили новые фичи — посмотрите"
  - 14 дней: "Мы скучаем! Вот скидка 20% на Pro"
  - 30 дней: последний шанс — "Ваши данные в безопасности, вернитесь когда будете готовы"
  - Unsubscribe link в каждом email

- [ ] **AB6. Competitor Comparison Pages** (`app/compare/[slug]/page.tsx`)
  - SEO-страницы: `/compare/tubeforge-vs-invideo`, `/compare/tubeforge-vs-capcut`, etc.
  - Шаблонный layout: feature comparison table, pricing comparison, unique advantages
  - 5 страниц: vs InVideo, vs CapCut, vs Descript, vs Pictory, vs Synthesia
  - JSON-LD structured data для каждой
  - Высокоинтент SEO: "X vs Y" queries

- [ ] **AB7. Annual Wrapped** (`app/api/cron/wrapped/route.ts`, email)
  - Раз в год: "Ваш год в TubeForge"
  - Статистика: видео создано, AI генераций, часов в редакторе, top project
  - Shareable card (OG image generated)
  - Viral mechanic как Spotify Wrapped

**Тест:** `npx tsc --noEmit`

---

## Блок AC: Enterprise & Scale — 5 задач (~1.5ч)

> Upmarket revenue: 1 enterprise customer = 100 free users

- [ ] **AC1. SSO (SAML/OIDC)** (`server/auth.ts`, `app/(auth)/sso/page.tsx`)
  - Auth.js поддерживает OIDC — настроить generic OIDC provider
  - Enterprise config: company domain → auto-route to SSO
  - Settings: "Настроить SSO" для team admin
  - Enterprise plan only

- [ ] **AC2. Enterprise Admin Console** (`views/Admin/EnterpriseAdmin.tsx`)
  - Team management: invite/remove, seat count, usage per member
  - Billing: invoices, PO numbers, NET 30 terms
  - Security: enforce 2FA, IP whitelist, session timeout
  - Usage reporting: team-wide analytics exportable as CSV

- [ ] **AC3. Render Priority Queue** (`server/routers/videoTask.ts`)
  - FREE: normal queue
  - PRO: priority queue (process first)
  - STUDIO/Enterprise: dedicated queue (no waiting)
  - UI: estimated wait time на render page
  - Фактически: sortBy priority в task processor

- [ ] **AC4. White-Label & Custom Domain** (`server/routers/brand.ts`)
  - STUDIO: remove TubeForge branding from exports and share pages
  - Enterprise: custom domain для share links (`videos.company.com`)
  - Custom logo в video player
  - Powered by TubeForge → скрыть

- [ ] **AC5. SLA & Uptime Guarantee** (`app/sla/page.tsx`)
  - Страница с SLA terms: 99.9% uptime для PRO, 99.99% для Enterprise
  - Credit system: если downtime превышает — автоматический credit
  - Incident communication process
  - Link из pricing page и enterprise page

**Тест:** `npx tsc --noEmit`

---

## Блок U: ВЕРИФИКАЦИЯ — 3 раунда

### Раунд 1: Компиляция и билд
```bash
npx tsc --noEmit          # 0 type errors
npm run build             # successful build
npx vitest run            # all tests pass
```
- [ ] TypeScript — 0 ошибок
- [ ] Build — успешный
- [ ] Tests — все проходят

### Раунд 2: Runtime — каждый роут
```bash
npm run dev -- --port 3456
```
- [ ] `/` — landing: FAQ, trust signals (не фейковые), JSON-LD, OG image
- [ ] `/login` — error banner, брендинг "TF"
- [ ] `/register` — брендинг "TF", referral capture, plan pre-select
- [ ] `/dashboard` — usage widget, filters persist, duplicate, bulk ops, templates
- [ ] `/editor` — undo/redo (Ctrl+Z/Y), char counter, auto-save, drag reorder, transitions, duration
- [ ] `/metadata` — timestamp parsing, AI dedup
- [ ] `/thumbnails` — canvas coords, snap threshold
- [ ] `/preview` — sequential playback, celebration on first video
- [ ] `/billing` — invoices, annual pricing, guarantee, upgrade flow
- [ ] `/settings` — usage analytics, data export, account deletion, API keys, language switch
- [ ] `/admin` — revenue dashboard, user analytics, audit log, health status
- [ ] `/tools` — загружается
- [ ] `/share/[id]` — public project page, social share buttons
- [ ] `/gallery` — community gallery loads
- [ ] `/api/health` — returns OK
- [ ] `/api/v1/projects` — returns 401 without API key, 200 with key
- [ ] `/privacy` — Privacy Policy loads
- [ ] `/terms` — Terms of Service loads
- [ ] `/security` — Security page loads
- [ ] `/help` — Help Center loads, search works
- [ ] `/contact` — Contact form sends email
- [ ] `/changelog` — Changelog loads, NEW badge works
- [ ] `/status` — Status page shows live health
- [ ] `/media` — Media Library loads, upload works
- [ ] `/compare/tubeforge-vs-capcut` — Comparison page loads
- [ ] Feedback widget — "?" button visible, modal opens, submission works
- [ ] Onboarding checklist — shows for new users, tracks progress
- [ ] Empty states — Dashboard/Editor/Media show helpful CTAs when empty
- [ ] Brand Kit — save colors/logo, apply to project
- [ ] YouTube upload — connects OAuth, uploads video
- [ ] AI Script Generator — generates scenes from topic
- [ ] AI Auto-Captions — generates timestamped subtitles
- [ ] Commenting — add comment on scene, reply, resolve
- [ ] Version History — snapshots created, restore works
- [ ] PWA: manifest loads, service worker registers, install prompt works

### Раунд 3: Security & Integration Regression
- [ ] Admin escalation → блокируется
- [ ] Team shareProject чужого проекта → блокируется
- [ ] Asset move в чужую папку → блокируется
- [ ] AI лимит: после reset проверяется лимит (не bypass)
- [ ] tRPC: internal error → generic message клиенту
- [ ] Rate limit: Map cleanup работает
- [ ] Stripe webhook: DB ошибка → 500
- [ ] videoTask.checkStatus: чужой taskId → FORBIDDEN
- [ ] Scene delete: чужая сцена → FORBIDDEN
- [ ] API key auth: invalid key → 401
- [ ] Public API rate limit: >60 req/min → 429
- [ ] Webhook HMAC: invalid signature → rejected
- [ ] Push notification: subscribe/unsubscribe works
- [ ] DB backup: script runs, creates file, rotation works
- [ ] CI pipeline: lint + typecheck + test + build all pass

---

## Сводка

| Блок | Часы | Задач | Приоритет | Статус |
|------|------|-------|-----------|--------|
| **ФАЗА 1: MUST-HAVE (prod-ready)** | | | | |
| A. Security (CRITICAL) | 1.5 | 6 | P0 | ⬜ |
| B. Infra Security | 0.5 | 3 | P0 | ⬜ |
| C. Billing & Auth | 1.5 | 5 | P0 | ⬜ |
| V. Legal & Compliance | 1.5 | 5 | P0 | ⬜ |
| W. Customer Support | 1.5 | 5 | P0 | ⬜ |
| **ФАЗА 2: CORE PRODUCT** | | | | |
| D. Video Pipeline | 1.0 | 4 | P1 | ⬜ |
| E. Dashboard & Editor UX | 1.5 | 6 | P1 | ⬜ |
| F. Metadata & Thumbnails | 1.0 | 5 | P1 | ⬜ |
| X. Media Library & Brand Kit | 2.0 | 5 | P1 | ⬜ |
| Y. YouTube Publishing | 2.0 | 5 | P1 | ⬜ |
| **ФАЗА 3: CONVERSION & GROWTH** | | | | |
| G. Landing & SEO | 1.5 | 6 | P1 | ⬜ |
| H. Errors & Notifications | 1.0 | 4 | P1 | ⬜ |
| I. User Journey / Conversion | 2.0 | 8 | P1 | ⬜ |
| AB. Retention & Growth | 2.0 | 7 | P1 | ⬜ |
| **ФАЗА 4: DIFFERENTIATORS** | | | | |
| J. New Features | 1.5 | 5 | P2 | ⬜ |
| P. Advanced Editor | 2.5 | 7 | P2 | ⬜ |
| Z. Advanced AI | 2.5 | 6 | P2 | ⬜ |
| AA. Collaboration & Versioning | 2.0 | 6 | P2 | ⬜ |
| **ФАЗА 5: INFRASTRUCTURE** | | | | |
| K. DevOps & Performance | 1.5 | 6 | P2 | ⬜ |
| L. i18n & Accessibility | 1.0 | 4 | P2 | ⬜ |
| N. Testing | 2.5 | 8 | P2 | ⬜ |
| T. Analytics & CI/CD | 1.5 | 6 | P2 | ⬜ |
| **ФАЗА 6: SCALE** | | | | |
| O. Admin Dashboard Pro | 2.0 | 6 | P3 | ⬜ |
| Q. Public API & Webhooks | 1.5 | 5 | P3 | ⬜ |
| R. Social & Sharing | 1.5 | 5 | P3 | ⬜ |
| S. PWA & Mobile | 1.5 | 5 | P3 | ⬜ |
| AC. Enterprise & Scale | 1.5 | 5 | P3 | ⬜ |
| **ФИНАЛ** | | | | |
| U. Verification (3 rounds) | 2.0 | — | — | ⬜ |
| **ИТОГО** | **~45ч** | **148 задач** | | |

---

## Команда для запуска

> Выполни MASTER_PLAN.md от начала до конца по фазам 1→6.
> Параллель 8 агентов по блокам где файлы не пересекаются.
> После каждого блока — `npx tsc --noEmit` и коммит.
> В конце — блок U, все 3 раунда верификации.
> Перечитывай MASTER_PLAN.md после каждого сжатия контекста.
>
> Для 30ч: выполни Фазы 1-4 + Verification = ~30ч, 106 задач
> Для 45ч: выполни всё = ~45ч, 148 задач
