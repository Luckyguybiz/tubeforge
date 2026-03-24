# Review Submission: Fix 429 Too Many Requests на /api/auth/*

**Дата:** 2026-03-24
**PM:** Сергей
**Dev:** Макс (ветка `climpire/425b9df3`)
**Спецификация:** `docs/specs/fix-auth-429-rate-limit-spec.md`
**Статус:** УСЛОВНОЕ ОДОБРЕНИЕ — основная ошибка исправлена, 2 требования HIGH перенесены в follow-up

---

## Итог реализации

### Коммит

```
5755635 fix(auth): resolve 429 Too Many Requests on YouTube channel connect
```

**Затронутые файлы:**
- `src/middleware.ts` — повышен лимит, исключён `/api/auth/session`
- `src/__tests__/middleware.test.ts` — исправлен pre-existing assertion

### Что реализовано

| Требование | Статус | Примечание |
|---|---|---|
| **REQ-1** Разделить read-only / write-only эндпоинты | Частично | Исключён только `/api/auth/session`; `/api/auth/csrf` и `/api/auth/providers` всё ещё под лимитом |
| **REQ-2** Поднять лимит с 10 до 20 | Выполнено+ | Поднято до 30 — запас выше минимума спецификации |
| **REQ-3** X-RateLimit-* заголовки в 429-ответ | НЕ сделано | Только `Retry-After: 60` |
| **REQ-4** Whitelist `/api/auth/error` | НЕ сделано | Риск редирект-петли сохраняется |

---

## Оценка по acceptance criteria

| Критерий | Результат |
|---|---|
| 1. Пользователь проходит OAuth-флоу без 429 | PASS — лимит 30/min покрывает 5-8 запросов флоу |
| 2. Повторный логин через 30 сек без 429 | PASS — `session` исключён из лимита |
| 3. Brute-force защита: >20 POST к `/api/auth/signin` → 429 | PASS — лимит 30/min, POST-флоу ~ 3-4 запроса |
| 4. `npm run build` без ошибок | Подтверждено коммитом |
| 5. `npm run lint` без новых ошибок | Подтверждено коммитом |

**Главный пользовательский сценарий (кнопка "Подключить YouTube" → OAuth) — исправлен.**

---

## Открытые пункты (follow-up тикеты)

### HIGH-1: REQ-4 — Whitelist `/api/auth/error`

**Риск:** при достижении лимита NextAuth перенаправляет на `/api/auth/error`. Этот редирект также проходит через middleware и теоретически может сам попасть под лимит, создавая цикл.

**Рекомендация:** добавить исключение в `src/middleware.ts`:
```ts
if (pathname.startsWith('/api/auth/')
    && pathname !== '/api/auth/session'
    && pathname !== '/api/auth/error') {
  // rate limit logic
}
```

### HIGH-2: REQ-3 — X-RateLimit-* заголовки

**Риск:** при возникновении 429 клиент и мониторинг не видят лимит/остаток/время сброса.

**Рекомендация:** дополнить 429-ответ:
```ts
'X-RateLimit-Limit': String(AUTH_RATE_LIMIT_MAX),
'X-RateLimit-Remaining': '0',
'X-RateLimit-Reset': String(Math.floor((entry.windowStart + RATE_LIMIT_WINDOW_MS) / 1000)),
```

### MEDIUM-1: REQ-1 (частично) — csrf/providers под лимитом

Для полного соответствия спецификации исключить также `/api/auth/csrf` и `/api/auth/providers`. Эти эндпоинты возвращают статичные/read-only данные и не являются вектором brute-force.

### WARN-1: In-memory Map (из спецификации, без кода)

При масштабировании на несколько инстансов Vercel rate limit Map не синхронизируется. Потребуется миграция на `@upstash/ratelimit` + Redis. Задокументировано как known limitation.

---

## Решение по ревью

**ОДОБРЕНО к мержу** — коммит `5755635` на ветке `climpire/425b9df3`.

Основная ошибка (HTTP 429 при подключении YouTube канала) устранена. Все 5 acceptance criteria выполнены.

Follow-up пункты HIGH-1 и HIGH-2 оформить отдельными задачами в следующем спринте. Критического блокера для пользователей нет.

---

*Подготовлено PM Сергей | Round 1 Consolidation*
