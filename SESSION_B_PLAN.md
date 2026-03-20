# SESSION_B_PLAN.md — Параллельная сессия: Инфраструктура, Responsive, Инструменты

> **Инструкция:** Эта сессия работает ПАРАЛЛЕЛЬНО с MASTER_PLAN.md.
> Файлы и задачи НЕ пересекаются с блоками A-T из MASTER_PLAN.
> После каждого блока — `npx tsc --noEmit` + `npx vitest run` + rebuild.

---

## Что уже сделано в этой сессии

- [x] **Починен crash loop сервера** — backtick escaping в TopBar.tsx ломал build
- [x] **Исправлены 13 падающих тестов** — 830/830 проходят
- [x] **PM2 переконфигурирован** — убран start.js с execSync, прямой запуск next start
- [x] **npm audit fix** — 0 уязвимостей (Next.js 16.1.6→16.2.0, undici fixed)
- [x] **.env permissions** — chmod 600
- [x] **Debug logging удалён** — убран console.log с внутренними URLs из stream/route.ts
- [x] **TikTok double body read** — исправлен баг с повторным чтением response body
- [x] **Landing page** — новые компоненты LandingHero, LandingNav
- [x] **Полный аудит** — API, Security, Billing, Team, AI, YouTube, TikTok, Tools

---

## Блок S-B1: Серверная инфраструктура — 5 задач

> **НЕ пересекается с:** MASTER_PLAN (MASTER_PLAN не трогает VPS конфиг, Cobalt, yt-api, PM2)

- [ ] **S-B1.1. Bind Cobalt к 127.0.0.1** — сейчас на 0.0.0.0, доступен через WireGuard
- [ ] **S-B1.2. Bind yt-api к 127.0.0.1** — аналогично
- [ ] **S-B1.3. PM2 ecosystem file** — создать ecosystem.config.js для всех сервисов
- [ ] **S-B1.4. Автобэкап PostgreSQL** — cron pg_dump каждые 6ч, ротация 7 дней
  - MASTER_PLAN T6 описывает это, но только как задачу. Я реализую скрипт.
  - **КООРДИНАЦИЯ:** если MASTER_PLAN начнёт T6, пропустить эту задачу.
- [ ] **S-B1.5. UFW audit** — проверить что только 22, 80, 443, 51820 открыты извне

---

## Блок S-B2: Responsive Design — 8 задач

> **НЕ пересекается с:** MASTER_PLAN (MASTER_PLAN не имеет responsive блока)
> **Файлы:** только CSS/style изменения, без логики

- [ ] **S-B2.1. Login/Register** — мобильная адаптация (375px, 768px)
- [ ] **S-B2.2. Dashboard** — карточки проектов, hero section на мобильном
- [ ] **S-B2.3. Tools Browser** — grid инструментов на мобильном
- [ ] **S-B2.4. Tool Pages** — все 15 tool views на мобильном
- [ ] **S-B2.5. Billing Page** — планы, корзина на мобильном
- [ ] **S-B2.6. Settings Page** — формы, секции на мобильном
- [ ] **S-B2.7. VPN Page** — конфиг, статус на мобильном
- [ ] **S-B2.8. Referral Page** — статистика, ссылки на мобильном

---

## Блок S-B3: Tool UI Improvements — 6 задач

> **НЕ пересекается с:** MASTER_PLAN (MASTER_PLAN не трогает tool views)
> **Файлы:** `views/Tools/*.tsx`

- [ ] **S-B3.1. ImageGenerator → подключить к API**
  - Убрать setTimeout fake, подключить к `ai.generateThumbnail` tRPC
  - Убрать несуществующие модели (Stable Diffusion, Midjourney)
  - Исправить `n` параметр (DALL-E 3 поддерживает только n=1)

- [ ] **S-B3.2. Mp3Converter — добавить file size limit**
  - Сейчас нет лимита (VideoCompressor имеет 200MB)
  - Добавить 200MB check перед FFmpeg load

- [ ] **S-B3.3. Referral pages — unified component**
  - 7 referral pages дублируют код
  - Создать `ReferralToolPage` компонент, параметризовать данными
  - Каждая страница = ~10 строк вместо ~200

- [ ] **S-B3.4. Консолидировать AiVideoGenerator + Veo3Generator**
  - Почти одинаковые страницы с overlapping провайдерами
  - Объединить в одну "AI Video Generators" с полным списком

- [ ] **S-B3.5. FaceSwap — честное описание**
  - Сейчас "AI Face Swap" но это manual cut-paste
  - Переименовать в "Face Overlay Tool" или честно описать

- [ ] **S-B3.6. AutoClip — честное описание**
  - "AI Auto Clip" но это RMS energy detection
  - Описать как "Smart Clip Detection" (без AI)

---

## Блок S-B4: Dead Code & Cleanup — 4 задачи

> **НЕ пересекается с:** MASTER_PLAN

- [ ] **S-B4.1. ScrollRevealProvider** — dead code, та же логика inline в page.tsx
- [ ] **S-B4.2. start.js** — больше не используется (PM2 напрямую запускает next)
- [ ] **S-B4.3. tsconfig.tsbuildinfo** — из git, не должен трекаться
- [ ] **S-B4.4. .claude/worktrees/** — cleanup abandoned worktrees

---

## Блок S-B5: E2E Testing — 4 задачи

> **НЕ пересекается с:** MASTER_PLAN N (MASTER_PLAN фокусируется на unit tests, я — на curl/API E2E)

- [ ] **S-B5.1. Написать comprehensive curl test suite**
  - test-all-routes.sh: все публичные и protected routes
  - Проверка status codes, content types, redirects
  
- [ ] **S-B5.2. Stripe webhook simulation**
  - Тест с правильной подписью (если whsec настроен)
  - Или flag что whsec placeholder

- [ ] **S-B5.3. Load test базовый**
  - 100 concurrent requests на landing
  - Проверка что rate limiter не падает

- [ ] **S-B5.4. SSL/TLS проверка**
  - curl -vI https://tubeforge.co — проверить сертификат, HSTS, headers

---

## Блок S-B6: Финальная верификация — 3 задачи

- [ ] **S-B6.1. Full test suite** — `npx vitest run` + `npx tsc --noEmit`
- [ ] **S-B6.2. Production build** — `npx next build` без ошибок
- [ ] **S-B6.3. Server stability** — PM2 uptime > 30 min, 0 рестартов

---

## Сводка

| Блок | Задач | Фокус |
|------|-------|-------|
| S-B1. Инфраструктура | 5 | VPS security, PM2, backup |
| S-B2. Responsive | 8 | Mobile/tablet CSS |
| S-B3. Tool UI | 6 | Fix fakes, dedup, limits |
| S-B4. Cleanup | 4 | Dead code removal |
| S-B5. E2E Testing | 4 | Integration tests |
| S-B6. Верификация | 3 | Final check |
| **Всего** | **30** | |

---

## Правила координации с MASTER_PLAN

1. **Если MASTER_PLAN начал блок, трогающий файл** — я пропускаю свою задачу на этот файл
2. **Коммиты** — prefix `[session-b]` для различия
3. **Конфликты** — я работаю только с CSS/styles в responsive, не трогаю логику
4. **Shared files** — если оба плана трогают один файл, MASTER_PLAN имеет приоритет
