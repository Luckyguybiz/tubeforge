# Спецификация: Исправление 429 Too Many Requests на /api/auth/*

**Дата:** 2026-03-24
**Автор:** PM Сергей
**Статус:** Approved — готово к реализации
**Исполнитель:** Dev Lead Макс

---

## Проблема

При попытке залогинить канал на dashboard (`/dashboard`) пользователь получает:

```
https://tubeforge.co/api/auth/error?error=...
HTTP 429 Too Many Requests
```

Кнопка "Подключить YouTube" в `ChannelAnalytics.tsx` вызывает `signIn('google', { callbackUrl: '/dashboard' })`, что запускает OAuth-флоу через NextAuth.

---

## Корневая причина

В `src/middleware.ts` установлен лимит для auth-эндпоинтов:

```ts
const AUTH_RATE_LIMIT_MAX = 10; // 10 запросов в минуту на IP
```

Один полный OAuth-флоу Google генерирует минимум **5-8 запросов** к `/api/auth/*` за несколько секунд:

| Запрос | Эндпоинт | Тип |
|--------|----------|-----|
| CSRF-токен | `GET /api/auth/csrf` | read-only |
| Список провайдеров | `GET /api/auth/providers` | read-only |
| Инициация логина | `POST /api/auth/signin/google` | write |
| OAuth-callback | `GET /api/auth/callback/google` | write |
| Сессия (SessionProvider) | `GET /api/auth/session` | read-only |
| Сессия повторно (каждый useSession) | `GET /api/auth/session` | read-only |

На дашборде сразу несколько компонентов вызывают `useSession()`:
- `Sidebar.tsx`
- `OnboardingTour.tsx`
- `ChannelAnalytics.tsx`
- `BillingPage.tsx` (при наличии)

NextAuth `SessionProvider` дедуплицирует запросы через React Context, но во время OAuth-callback и redirect возникает всплеск. При 10 req/min лимит пробивается на первой же попытке логина.

---

## Требования к исправлению

### КРИТИЧНО (реализовать обязательно)

**REQ-1: Разделить эндпоинты на read-only и write-only**

Применять строгий лимит только к мутирующим auth-эндпоинтам:
- `/api/auth/signin` — инициация входа (цель brute-force)
- `/api/auth/callback` — OAuth-callback
- `/api/auth/signout` — выход

Read-only эндпоинты исключить из строгого лимита (или использовать отдельный, более высокий лимит):
- `/api/auth/session` — безопасен, только возвращает текущую сессию
- `/api/auth/csrf` — безопасен, возвращает CSRF-токен
- `/api/auth/providers` — безопасен, статический список

**REQ-2: Поднять лимит для write-эндпоинтов с 10 до 20**

10 запросов слишком мало: даже один OAuth-флоу с retry занимает 3-4 write-запроса. 20 оставляет защиту от brute-force, но не ломает нормальный логин.

### ВЫСОКИЙ ПРИОРИТЕТ

**REQ-3: Добавить заголовки в 429-ответ**

Текущий 429 возвращает только `Retry-After: 60`. Добавить:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: <unix-timestamp>
```

**REQ-4: Middleware не должен блокировать `/api/auth/error`**

Если пользователь уже получил 429 и перенаправляется на `/api/auth/error`, этот редирект не должен сам попадать под rate limit (создает петлю). Эндпоинт `/api/auth/error` нужно добавить в whitelist или исключить из auth rate limit.

### СРЕДНИЙ ПРИОРИТЕТ (предупреждение, без кода)

**WARN-1:** В-памяти Map не синхронизируется между несколькими инстансами (cold start, несколько регионов Vercel). При масштабировании потребуется миграция на `@upstash/ratelimit` + Redis. Задокументировать как known limitation.

**WARN-2:** Очистка `authRateLimitMap` в функции `checkRateLimit` работает по счетчику `callCounter` из глобального `rateLimitMap`, а не из `authRateLimitMap`. При низком трафике на auth-эндпоинты очистка может не срабатывать вовремя.

---

## Acceptance Criteria

1. Пользователь может кликнуть "Подключить YouTube" и пройти OAuth-флоу Google без получения 429
2. Повторный логин через 30 секунд не вызывает 429
3. Brute-force защита сохраняется: более 20 POST-запросов к `/api/auth/signin` за 60 секунд с одного IP возвращают 429
4. `npm run build` проходит без ошибок
5. `npm run lint` без новых ошибок

---

## Затронутые файлы

| Файл | Тип изменения |
|------|---------------|
| `src/middleware.ts` | Изменить константы и логику auth rate limiting |

Никаких других файлов менять не требуется.

---

## Что НЕ входит в скоуп

- Миграция на Redis/Upstash (WARN-1) — отдельный тикет
- Изменение NextAuth конфига (`src/server/auth.ts`) — не нужно
- Изменение UI-компонентов dashboard — не нужно
- Логика `useSession()` — не нужно

---

## Имплементационный ориентир для Dev Lead Макс

В `src/middleware.ts` логика auth rate limit должна стать примерно такой:

```
// Строгий лимит только для write-эндпоинтов (brute-force защита)
const AUTH_WRITE_PATHS = ['/api/auth/signin', '/api/auth/callback', '/api/auth/signout']
const isAuthWrite = AUTH_WRITE_PATHS.some(p => pathname.startsWith(p))

if (isAuthWrite) {
  // применить строгий лимит (20/min)
} else if (pathname.startsWith('/api/auth/')) {
  // применить мягкий лимит или пропустить
}
```

Точная реализация на усмотрение Dev Lead Макс в рамках этих требований.
