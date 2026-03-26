# TubeForge - AI Agent Memory & Rules

## CRITICAL: Project Overview

TubeForge (https://tubeforge.co/) - PRODUCTION платформа для YouTube-создателей.
Язык команды: русский. Все комментарии в коде и коммиты - на английском.

### Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Backend:** tRPC v11 + Prisma 6.9 (PostgreSQL)
- **Auth:** Auth.js v5 (Google OAuth)
- **Payments:** Stripe (подписки: FREE / PRO / STUDIO)
- **AI:** OpenAI (DALL-E 3, GPT), Anthropic Claude, fal.ai, Runway ML, ElevenLabs
- **Styling:** TailwindCSS 4
- **i18n:** 4 языка (ru, en, kk, es) через i18next
- **Monitoring:** Sentry
- **Deploy:** PM2 cluster (4 instances), Caddy reverse proxy, OVH VPS

### Project Path
`/home/ubuntu/tubeforge-next`

---

## SAFETY RULES (ОБЯЗАТЕЛЬНО)

1. **Деплой ОБЯЗАТЕЛЕН после мержа:** `cd /home/ubuntu/tubeforge-next && npm run build && pm2 restart tubeforge`. Без этого изменения не появятся на сайте. Git hook post-merge делает это автоматически, но проверь что билд прошёл без ошибок.
2. **НИКОГДА не меняй `prisma/schema.prisma` без явного указания CEO** - это база данных прода
3. **НИКОГДА не меняй `.env`, `.env.local`, `.env.production`** - там ключи и секреты
4. **НИКОГДА не удаляй существующие файлы** - только добавляй или модифицируй
5. **НИКОГДА не меняй `next.config.ts` CSP headers** - они настроены и протестированы

## ОБЯЗАТЕЛЬНАЯ ПРОВЕРКА ПЕРЕД МЕРЖЕМ

**КАЖДЫЙ раз перед мержем выполни:**
```bash
cd /home/ubuntu/tubeforge-next && npm run build
```
Если билд падает — ИСПРАВЬ ошибки. НЕ мержь код с ошибками. Это КРИТИЧЕСКОЕ правило.

### Частые ошибки которые ЗАПРЕЩЕНО допускать:
- **TypeScript типы в tRPC:** НЕ указывай явные типы в `onSuccess`, `onError` — используй автовывод: `onSuccess: (data) => {}` вместо `onSuccess: (data: { url?: string }) => {}`
- **null vs undefined:** в TypeScript strict mode `null` ≠ `undefined`. Проверяй совместимость типов.
- **Import несуществующих модулей:** перед импортом убедись что файл/модуль существует.
- **Забытые зависимости:** если добавил новый пакет — запусти `npm install`.

### Прочитай перед каждой задачей:
- `tasks/lessons.md` — список ошибок и правила чтобы их не повторять
6. **НИКОГДА не меняй auth конфигурацию** - Google OAuth работает, не ломай
7. **НИКОГДА не меняй Stripe webhook handler** - платежи работают
8. **Работай ТОЛЬКО в своей git ветке** - не push в main
9. **Перед коммитом:** `npx tsc --noEmit` должен проходить без ошибок
10. **Не используй длинное тире** - только обычное "-"

---

## Architecture

### Routes (src/app/)
```
(app)/              - Authenticated routes (dashboard, editor, tools, etc.)
(marketing)/        - Public pages (landing, pricing, blog, comparisons)
api/                - API routes (webhooks, tools, auth, cron)
free-tools/         - 24 free SEO tools (no auth required)
```

### Key Directories
```
src/server/routers/  - tRPC routers (24 штуки - главная бизнес-логика)
src/components/      - UI компоненты (landing, analytics, editor, ui)
src/views/           - Page-level views (Tools/, Editor/, Dashboard/)
src/stores/          - Zustand state management
src/hooks/           - Custom React hooks
src/locales/         - i18n переводы (ru, en, kk, es)
prisma/              - Database schema (23 модели)
public/              - Static assets
```

### Database Models (основные)
- `User` - пользователи (plan: FREE/PRO/STUDIO, Stripe integration)
- `Project` - видео-проекты
- `Scene` - сцены в проекте (AI-generated)
- `Channel` - YouTube каналы пользователя
- `Team` / `TeamMember` - командная работа
- `ThumbnailGeneration` - история генерации превью
- `Asset` - медиа-файлы
- `ApiKey` / `WebhookEndpoint` - публичный API

### API Structure
- **tRPC** (внутренний): `/api/trpc/[...trpc]` - 24 роутера
- **REST v1** (публичный): `/api/v1/projects`, `/api/v1/me`, `/api/v1/webhooks`
- **Tools API**: `/api/tools/*` - download, translate, tts, analytics
- **Free Tools**: `/api/free-tools/generate` - title/description/tag generators

---

## Current State (March 2026)

### Working & Deployed
- Landing + pricing + auth flow
- Dashboard с проектами
- Video Editor (AI scenes)
- AI Thumbnail Generator (DALL-E 3)
- Design Studio (Canva-like editor)
- 28+ tools (download, translate, compress, etc.)
- 24 free SEO tools
- YouTube/TikTok/Shorts analytics
- Stripe billing (3 plans)
- Team collaboration
- Referral program
- Admin panel
- REST API v1 + webhooks
- Push notifications
- i18n (4 languages)
- Mobile adaptation (in progress)

### Stats
- 1014 passing tests (vitest)
- 0 TypeScript errors
- 366+ source files
- 23 database models

### In Progress
- Mobile adaptation (32 pages need work)
- Design Studio AI enhancements
- i18n completion (missing keys in some languages)

---

## How To Work

### Before starting any task:
1. `cd /home/ubuntu/tubeforge-next`
2. Прочитай `tasks/lessons.md` - там ошибки прошлых задач, НЕ повторяй их
3. `git checkout -b feature/your-task-name`
4. Read relevant files before changing them
5. Run `npx tsc --noEmit` to verify no type errors
6. Run `npm run build` before merging - если билд падает, ИСПРАВЬ ошибки

### For new free tools:
- Add to `src/app/free-tools/[tool]/page.tsx`
- Add API handler to `src/app/api/free-tools/`
- Add translations to all 4 locales
- Add to tools list in `src/lib/constants/`

### For new pages:
- Authenticated: `src/app/(app)/your-page/page.tsx`
- Public: `src/app/(marketing)/your-page/page.tsx`
- Add translations for all text

### For bug fixes:
- Find the relevant component/router
- Fix with minimal changes
- Verify with `npx tsc --noEmit`

### Testing:
```bash
npx vitest run           # Run all tests
npx tsc --noEmit         # Type check
```

---

## Style Guide

- Use existing UI components from `src/components/ui/`
- Follow existing patterns in similar files
- All user-facing text must use i18n: `t('key')`
- Use Zustand for client state
- Use tRPC for server calls
- TailwindCSS for styling (no inline styles, no CSS modules)
- Error handling: use Sentry + structured logger
