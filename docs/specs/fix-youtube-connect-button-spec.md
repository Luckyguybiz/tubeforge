# Fix: YouTube Channel Connect Button on /dashboard

**Priority:** CRITICAL
**Affected files:** 3 files (2 frontend, 1 backend config)
**Estimated scope:** Small - focused fix, no new pages

---

## Problem

На /dashboard блок "Connect your YouTube channel - Link your Google account to see channel analytics" отображается как **статичный текст без кнопки**. Пользователь не может подключить канал.

## Root Cause Analysis

### Причина 1: Нет кнопки - только `<p>` теги (CRITICAL)

**Файл:** `src/views/Dashboard/ChannelAnalytics.tsx`, строки 417-431

Когда `trpc.youtube.getChannels` возвращает ошибку (нет Google аккаунта), рендерится:
```tsx
<p style={{ color: C.sub, fontSize: 14 }}>Connect your YouTube channel</p>
<p style={{ color: C.dim, fontSize: 12 }}>Link your Google account to see channel analytics</p>
```

Это просто текст. Нет `<button>`, нет `<a>`, нет `onClick`. Пользователь видит сообщение, но не может ничего сделать.

### Причина 2: Нет YouTube scopes в Google OAuth (HIGH)

**Файл:** `src/server/auth.ts`, строки 31-34

```ts
Google({
  clientId: env.AUTH_GOOGLE_ID,
  clientSecret: env.AUTH_GOOGLE_SECRET,
})
```

Google провайдер НЕ запрашивает YouTube scopes. По дефолту NextAuth запрашивает только `openid profile email`. Это значит что даже если пользователь залогинен через Google, его access_token **не имеет прав** на YouTube Data API v3.

Необходимые scopes:
- `https://www.googleapis.com/auth/youtube.readonly` - чтение данных канала и видео
- `https://www.googleapis.com/auth/yt-analytics.readonly` - чтение аналитики канала

### Причина 3: Кнопки на Settings тоже disabled (MEDIUM)

**Файл:** `src/views/Settings/SettingsPage.tsx`, строки 767-786, 816-834

Обе кнопки "Connect Channel" имеют `disabled={true}` и `cursor: 'not-allowed'`.

---

## Fix Specification

### Fix 1: Добавить кликабельную кнопку на дашборд (CRITICAL)

**Файл:** `src/views/Dashboard/ChannelAnalytics.tsx`

Заменить блок строк 417-431. Вместо пассивного текста - кнопка, которая инициирует Google OAuth:

```tsx
if (channelsQuery.isError) {
  return (
    <div style={{
      padding: '40px 24px', borderRadius: 16, background: C.card,
      border: `1px solid ${C.border}`, textAlign: 'center',
    }}>
      <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={C.dim}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ marginBottom: 12 }}>
        <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29.94 29.94 0 001 12a29.94 29.94 0 00.46 5.58A2.78 2.78 0 003.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29.94 29.94 0 0023 12a29.94 29.94 0 00-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
      <p style={{ color: C.sub, fontSize: 14, margin: '0 0 4px' }}>
        Connect your YouTube channel
      </p>
      <p style={{ color: C.dim, fontSize: 12, margin: '0 0 16px' }}>
        Link your Google account to see channel analytics
      </p>
      <button
        onClick={() => signIn('google')}
        style={{
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          background: '#FF0000',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Connect YouTube Channel
      </button>
    </div>
  );
}
```

**Требуется импорт:** `import { signIn } from 'next-auth/react';` (если не импортирован)

**Важно:** `signIn('google')` вызовет NextAuth OAuth flow с Google, что автоматически перенаправит пользователя на Google consent screen и обратно на приложение.

### Fix 2: Добавить YouTube scopes в Google провайдер (CRITICAL)

**Файл:** `src/server/auth.ts`

Изменить конфигурацию Google провайдера:

```ts
Google({
  clientId: env.AUTH_GOOGLE_ID,
  clientSecret: env.AUTH_GOOGLE_SECRET,
  authorization: {
    params: {
      scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
      access_type: 'offline',
      prompt: 'consent',
    },
  },
}),
```

Параметры:
- `scope` - добавляет YouTube и Analytics scopes к стандартным OpenID scopes
- `access_type: 'offline'` - получаем refresh_token для обновления access_token
- `prompt: 'consent'` - гарантирует что Google покажет consent screen и выдаст refresh_token

**Важно:** В Google Cloud Console для проекта должны быть включены:
- YouTube Data API v3
- YouTube Analytics API

И redirect URI должен быть: `https://<domain>/api/auth/callback/google`

### Fix 3: Активировать кнопки на Settings (MEDIUM)

**Файл:** `src/views/Settings/SettingsPage.tsx`

Убрать `disabled={true}`, поменять стили, добавить `onClick={() => signIn('google')}` к обеим кнопкам "Connect Channel".

---

## Verification Checklist

- [ ] Кнопка "Connect YouTube Channel" видна на /dashboard когда канал не подключен
- [ ] Клик по кнопке перенаправляет на Google OAuth consent screen
- [ ] Google consent screen показывает запрос на YouTube Data API
- [ ] После авторизации - redirect обратно на /dashboard
- [ ] Данные канала (subscribers, views) отображаются на дашборде
- [ ] Refresh token сохраняется в БД (таблица Account)
- [ ] При повторном заходе данные подтягиваются автоматически (без повторной авторизации)
- [ ] Кнопки "Connect Channel" на Settings тоже работают

## Google Cloud Console Prerequisites

1. YouTube Data API v3 - ENABLED
2. YouTube Analytics API - ENABLED
3. OAuth consent screen - scopes добавлены
4. Authorized redirect URI: `https://<domain>/api/auth/callback/google`

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Существующие пользователи потеряют сессию | LOW | JWT strategy - сессии не зависят от scopes |
| Старые токены без YouTube scopes | MEDIUM | `prompt: 'consent'` при следующем signIn запросит новые scopes |
| Google API quota limits | LOW | Rate limiting уже реализован в youtube.ts |

## Build & Deploy

```bash
cd /home/ubuntu/tubeforge-next && npm run build && pm2 restart tubeforge
```
