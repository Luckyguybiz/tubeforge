# Fix: YouTube Channel Connect — Токены не сохраняются при повторной авторизации

**Priority:** CRITICAL
**Branch:** climpire/f93e8e10
**Affected files:** 2 файла

---

## Проблема

Пользователь нажимает "Connect YouTube Channel", проходит Google OAuth (включая предупреждение "app is unverified"), но канал не подключается. После редиректа на /dashboard данные канала не появляются.

---

## Root Cause Analysis

### Причина 1 (CRITICAL): jwt callback не обновляет токены в БД при повторном OAuth

**Файл:** `src/server/auth.ts`, строки 93-128

При повторном входе через Google OAuth (пользователь уже зарегистрирован), PrismaAdapter выполняет `getUserByAccount` и находит существующий аккаунт — функция `linkAccount` **не вызывается повторно**. Новые токены с YouTube scopes (`access_token`, `refresh_token`) возвращаются в параметре `account` в jwt callback, но текущая реализация его игнорирует:

```ts
// ТЕКУЩИЙ КОД — account не используется:
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    // ... план/роль из БД
  }
  return token;
}
```

Результат: в таблице `Account` остаётся старый `access_token` без YouTube scopes. Когда `getYouTubeToken()` в `youtube.ts` пытается вызвать YouTube API, токен не имеет нужных прав — либо 401, либо пустой список каналов.

### Причина 2 (MEDIUM): Кнопки "Connect Channel" в Settings задизейблены

**Файл:** `src/views/Settings/SettingsPage.tsx`, строки 767-783 и 816-834

Обе кнопки "Connect Channel" имеют `disabled={true}` и `cursor: 'not-allowed'` без onClick обработчика.

---

## Fix Specification

### Fix 1: Обновить jwt callback для сохранения OAuth токенов (CRITICAL)

**Файл:** `src/server/auth.ts`

Добавить обработку параметра `account` в jwt callback. Когда `account` присутствует (т.е. произошёл OAuth sign-in), обновить запись в таблице Account новыми токенами:

```ts
async jwt({ token, user, account }) {
  const PLAN_CACHE_TTL_MS = 5 * 60 * 1000;

  // Если account присутствует — это OAuth sign-in, обновить токены в БД
  if (account && account.provider === 'google' && account.access_token) {
    try {
      await db.account.update({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        data: {
          access_token: account.access_token,
          ...(account.refresh_token && { refresh_token: account.refresh_token }),
          ...(account.expires_at && { expires_at: account.expires_at }),
          ...(account.scope && { scope: account.scope }),
        },
        select: { id: true },
      });
    } catch (err) {
      // Логируем, но не блокируем вход — PrismaAdapter мог уже сохранить токены
      authLog.warn('Failed to update account tokens in jwt callback', );
    }
  }

  if (user) {
    token.id = user.id;
    const dbUser = user.id
      ? await db.user.findUnique({
          where: { id: user.id },
          select: { plan: true, role: true },
        })
      : null;
    token.plan = dbUser?.plan ?? 'FREE';
    token.role = dbUser?.role ?? 'USER';
    token.planUpdatedAt = Date.now();
  } else {
    // ... остальная логика refresh plan TTL без изменений
  }

  return token;
}
```

**Важно:** Composite unique index в Prisma schema для Account должен быть `@@unique([provider, providerAccountId])` — стандарт @auth/prisma-adapter.

### Fix 2: Активировать кнопки Connect Channel в Settings (MEDIUM)

**Файл:** `src/views/Settings/SettingsPage.tsx`

Для обеих кнопок "Connect Channel" (строки ~767 и ~816):
- Убрать `disabled={true}`
- Убрать `opacity: 0.5` и `cursor: 'not-allowed'`
- Добавить `onClick={() => signIn('google', { callbackUrl: '/settings' })}`
- Добавить импорт `import { signIn } from 'next-auth/react'` если ещё нет

---

## Verification Checklist

- [ ] Пользователь с существующим Google аккаунтом нажимает "Connect YouTube" → Google OAuth с YouTube scopes
- [ ] После callback: `Account.access_token` в БД обновлён на токен с YouTube scopes
- [ ] `Account.refresh_token` сохранён (для фонового обновления)
- [ ] `trpc.youtube.getChannels` возвращает список каналов (не UNAUTHORIZED ошибку)
- [ ] Дашборд показывает данные канала после успешного подключения
- [ ] Кнопки в Settings кликабельны и инициируют OAuth
- [ ] Сборка проходит: `npm run build` без ошибок

---

## Google Cloud Console (ops — не код)

Для устранения "app is unverified":
1. Google Cloud Console → OAuth consent screen → добавить email пользователя в "Test users" (до верификации)
2. Либо пройти верификацию Google для YouTube scopes (нужен privacy policy URL и подтверждение доменов)
