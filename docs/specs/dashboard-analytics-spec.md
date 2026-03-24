# YouTube Channel Analytics Dashboard - Implementation Specification

**Автор:** Аналитик (Planning)
**Дата:** 2026-03-24
**Статус:** Ready for Development

---

## 1. Обзор

Добавить блок аналитики YouTube-канала на страницу `/dashboard`. Блок включает выбор канала, виджеты подписчиков/просмотров, табы-фильтры, трендовые ключевые слова с графиком, и список конкурентов.

---

## 2. Аудит существующей инфраструктуры

### 2.1 Что уже есть (можно переиспользовать)

| Компонент | Путь | Описание |
|-----------|------|----------|
| YouTube tRPC router | `src/server/routers/youtube.ts` | `getChannels`, `getVideos`, `getAnalytics` - готовы к использованию |
| Channel Prisma model | `prisma/schema.prisma` | `Channel { id, title, thumbnail, subscribers, userId }` |
| StatCard | `src/components/analytics/StatCard.tsx` | Карточка с label, value, trend, icon - расширить для progress bar |
| recharts ^3.7.0 | `package.json` | Уже установлен, lazy-loading паттерн есть в `AdminPage.tsx` |
| useThemeStore | `src/stores/useThemeStore.ts` | Темная/светлая тема, цвета `C.card`, `C.accent`, `C.border` и т.д. |
| useLocaleStore | `src/stores/useLocaleStore.ts` | i18n через `t()` функцию |
| Google OAuth | `src/server/auth.ts` | NextAuth + Google provider, refresh token logic |
| Channel selector UI | `src/views/Preview/PreviewSave.tsx` | Дропдаун канала с аватаркой - паттерн для переиспользования |
| Skeleton loader | `src/components/ui/Skeleton.tsx` | Loading state компонент |
| ErrorFallback | `src/components/ui/ErrorFallback.tsx` | Error state компонент |

### 2.2 Что нужно создать

| Компонент | Описание |
|-----------|----------|
| `ChannelAnalytics` (view) | Основной блок аналитики на дашборде |
| `ChannelSelector` | Дропдаун с аватаркой и именем канала |
| `SubscribersCard` | Виджет подписчиков с progress bar |
| `ViewsCard` | Виджет просмотров с progress bar |
| `AnalyticsTabs` | Табы: All, Optimization, Research, Analytics, Achievements |
| `TrendingKeyword` | Блок трендового ключевого слова с графиком |
| `SuggestedCompetitors` | Список конкурентных каналов |
| tRPC: `keywords` router | Бэкенд для трендовых ключевых слов |
| tRPC: `competitors` router | Бэкенд для списка конкурентов |

---

## 3. Архитектура компонентов

### 3.1 Файловая структура

```
src/
├── views/
│   └── Dashboard/
│       ├── Dashboard.tsx                  # Существующий - добавить <ChannelAnalytics /> блок
│       └── ChannelAnalytics/
│           ├── ChannelAnalytics.tsx        # Контейнер блока аналитики
│           ├── ChannelSelector.tsx         # Дропдаун выбора канала
│           ├── StatsCards.tsx              # SUBSCRIBERS + VIEWS карточки
│           ├── AnalyticsTabs.tsx           # Табы-фильтры
│           ├── TrendingKeyword.tsx         # Ключевое слово + график
│           └── SuggestedCompetitors.tsx    # Список конкурентов
├── server/
│   └── routers/
│       ├── youtube.ts                     # Существующий - добавить getChannelStats
│       ├── keywords.ts                    # Новый - трендовые ключевые слова
│       └── competitors.ts                 # Новый - конкуренты
```

### 3.2 Иерархия компонентов

```
Dashboard.tsx
└── <ChannelAnalytics />
    ├── <ChannelSelector channels={channels} selected={id} onChange={setId} />
    ├── <StatsCards channelId={id} period={period} />
    │   ├── SubscribersCard (progress bar)
    │   └── ViewsCard (progress bar)
    ├── <AnalyticsTabs activeTab={tab} onChange={setTab} />
    ├── <TrendingKeyword channelId={id} tab={tab} userPlan={plan} />
    │   └── <LineChart /> (recharts, lazy-loaded)
    └── <SuggestedCompetitors channelId={id} />
```

---

## 4. Спецификация данных

### 4.1 Существующие API (YouTube Data API v3)

**`trpc.youtube.getChannels`** - уже реализован:
```typescript
// Возвращает:
{ items: [{ id, snippet: { title, thumbnails }, statistics: { subscriberCount, viewCount } }] }
```

**`trpc.youtube.getAnalytics`** - уже реализован:
```typescript
// Input: { channelId, period: '7'|'28'|'90'|'365' }
// Возвращает daily breakdown:
{ rows: [[date, views, subscribersGained, estimatedMinutesWatched, avgViewPercentage], ...] }
```

### 4.2 Новые API endpoints

#### `trpc.youtube.getChannelStats` (расширение существующего роутера)

```typescript
// Input: { channelId: string, period: '7'|'28'|'90'|'365' }
// Логика: вызвать getAnalytics и агрегировать
// Output:
{
  subscribers: {
    current: number,        // из Channel model (актуальное)
    gained: number,         // sum(subscribersGained) за период
    min: number,            // минимум за период (для progress bar)
    max: number,            // максимум за период (для progress bar)
  },
  views: {
    current: number,        // sum(views) за период
    min: number,            // min daily views
    max: number,            // max daily views
    total: number,          // total views за период
  }
}
```

#### `trpc.keywords.getTrending` (новый роутер)

```typescript
// Input: { channelId: string, limit?: number }
// Источник: наш бэкенд (или mock data на первом этапе)
// Output:
{
  keywords: [{
    id: string,
    term: string,
    searchVolume: number,
    growthPercent: number,     // e.g. +153
    vph: number,              // views per hour
    isLocked: boolean,        // true для FREE плана
    trendData: [              // 30 дней для графика
      { date: string, volume: number }
    ]
  }]
}
```

**Примечание:** На первом этапе (MVP) использовать mock data для keywords. YouTube Data API v3 не предоставляет данные по ключевым словам напрямую. Для production потребуется интеграция с сторонним API (vidIQ, TubeBuddy API, или собственный парсер).

#### `trpc.competitors.getSuggested` (новый роутер)

```typescript
// Input: { channelId: string, limit?: number }
// Источник: YouTube Data API v3 search (похожие каналы) + наш бэкенд
// Output:
{
  competitors: [{
    id: string,
    title: string,
    thumbnail: string,
    subscribers: number,
    recentViews: number,
    similarity: number,       // 0-100 score
  }]
}
```

### 4.3 Rate Limits (YouTube Data API v3)

- Quota: 10,000 units/day по умолчанию
- `channels.list`: 1 unit
- `search.list`: 100 units (дорого!)
- `reports.query` (Analytics): 1 unit
- **Рекомендация:** Кэшировать результаты competitors на 24 часа в БД. Не вызывать search.list при каждом рендере.

---

## 5. UI спецификация

### 5.1 Дизайн-система (темная тема)

```
Background:        C.bg (#0f0f17 или из темы)
Card background:   C.card с gradient overlay
Card border:       1px solid rgba(255,255,255,0.06)
Border radius:     16px (карточки), 12px (вложенные элементы)
Accent:            C.accent (#3b82f6 - голубой)
Text primary:      C.text
Text secondary:    C.sub
Text muted:        C.dim
Success:           C.green
PRO badge:         #6366f1 (indigo)
```

### 5.2 Channel Selector

- Расположение: верх блока аналитики
- Элементы: аватарка канала (32x32, border-radius: 50%), название канала, chevron-down иконка
- Поведение: dropdown с списком подключенных каналов
- Состояние "нет каналов": кнопка "Connect YouTube Channel" с redirect на OAuth
- Паттерн: переиспользовать логику из `PreviewSave.tsx` (строки с channel selector)

### 5.3 Stats Cards (SUBSCRIBERS + VIEWS)

- Layout: 2 карточки в ряд (flex, gap: 16px)
- Mobile: stack вертикально
- Каждая карточка:
  - Label: uppercase, 12px, C.sub ("SUBSCRIBERS" / "VIEWS")
  - Value: 28px, fontWeight 800, C.text (форматирование: 1.2K, 45.3K, 1.2M)
  - Progress bar: высота 6px, border-radius: 3px, background: C.surface, fill: C.accent
  - Progress = (current - min) / (max - min) * 100%
  - Под progress bar: "min" слева, "max" справа, fontSize: 11px, C.dim

### 5.4 Analytics Tabs

- Табы: All | Optimization | Research | Analytics | Achievements
- Стиль: горизонтальный scroll на мобильном, pill-style tabs
- Active tab: background C.accent, color #000
- Inactive tab: background transparent, color C.sub, border 1px solid C.border
- Табы фильтруют контент ниже (TrendingKeyword и SuggestedCompetitors)
- На MVP: только "All" и "Analytics" активны, остальные disabled с tooltip "Coming soon"

### 5.5 Trending Keyword

- Карточка с border-radius: 16px
- Header row:
  - Keyword name (16px, bold, C.text)
  - Lock icon + "Unlock" badge для FREE плана (C.accent, onClick -> upgrade modal)
  - PRO badge если заблокировано
- Stats row:
  - Searches count (bold) + growth badge (+153%, зеленый)
  - VPH справа (views per hour, с иконкой глаза)
- Chart area:
  - recharts `<LineChart>` (lazy-loaded)
  - Ось X: даты (последний месяц, формат "Mar 1", "Mar 15")
  - Ось Y: объем поиска
  - Линия: stroke C.accent, strokeWidth: 2
  - Area fill: gradient от C.accent (opacity 0.3) к transparent
  - Tooltip: дата + volume
  - Responsive: height 200px desktop, 160px mobile
  - Для FREE плана: график размыт (filter: blur(4px)) с overlay "Upgrade to PRO"

### 5.6 Suggested Competitors

- Заголовок: "Suggested Competitors" (18px, bold)
- Список карточек (вертикальный):
  - Аватарка канала (40x40, rounded)
  - Название канала (14px, bold)
  - Subscribers count (12px, C.sub)
  - Recent views (12px, C.dim)
  - Similarity score badge (pill, C.accent background)
- Максимум 5 конкурентов
- "View all" ссылка внизу

---

## 6. Адаптивность

### Breakpoints

```
Desktop (>= 768px):
  - Stats cards: 2 в ряд
  - Trending + Competitors: рядом (60/40 split)

Mobile (< 768px):
  - Stats cards: вертикальный stack
  - Trending + Competitors: full width, вертикальный stack
  - Channel selector: full width
  - Tabs: horizontal scroll
  - Chart height: 160px вместо 200px
```

### CSS подход

Использовать inline styles (паттерн проекта) + CSS media queries через `@media` в `<style>` теге или className. Проект использует inline styles повсеместно (Dashboard.tsx, StatCard.tsx), но также имеет className-based responsive overrides.

---

## 7. State Management

```typescript
// Локальный state в ChannelAnalytics.tsx:
const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'all' | 'optimization' | 'research' | 'analytics' | 'achievements'>('all');
const [period, setPeriod] = useState<'7' | '28' | '90' | '365'>('28');

// tRPC queries:
const channels = trpc.youtube.getChannels.useQuery();
const analytics = trpc.youtube.getAnalytics.useQuery(
  { channelId: selectedChannelId!, period },
  { enabled: !!selectedChannelId }
);
const keywords = trpc.keywords.getTrending.useQuery(
  { channelId: selectedChannelId! },
  { enabled: !!selectedChannelId }
);
const competitors = trpc.competitors.getSuggested.useQuery(
  { channelId: selectedChannelId! },
  { enabled: !!selectedChannelId }
);
```

---

## 8. Интеграция в Dashboard.tsx

Вставить `<ChannelAnalytics />` блок **после Welcome header и перед Product showcase** (строка ~329 в текущем файле):

```tsx
// Dashboard.tsx, после </div> welcome header (строка 327)
{/* ── Channel Analytics Block ──────────── */}
<ChannelAnalytics />
```

Это не ломает существующую структуру - просто добавляет новый блок.

---

## 9. Безопасность

- Все YouTube API вызовы через `protectedProcedure` (требуют авторизацию)
- Channel ownership verification через `verifyChannelOwnership()` (уже реализовано)
- Token refresh логика уже есть в `getYouTubeToken()`
- PRO-gating для keyword data: проверка `ctx.session.user.plan` на бэкенде
- Никаких `NEXT_PUBLIC_` переменных для секретных ключей

---

## 10. Этапы реализации

### Этап 1 (MVP) - Приоритет

1. **ChannelSelector** - дропдаун с каналами (переиспользовать `trpc.youtube.getChannels`)
2. **StatsCards** - SUBSCRIBERS + VIEWS с progress bar (данные из `trpc.youtube.getAnalytics`)
3. **AnalyticsTabs** - UI табов (без фильтрации, только визуал)
4. **TrendingKeyword** - с mock data и recharts графиком
5. **SuggestedCompetitors** - с mock data
6. **Интеграция** в Dashboard.tsx

### Этап 2 (Production Data)

1. Реальный keywords API (интеграция с внешним сервисом)
2. Реальный competitors API (YouTube search + кэширование)
3. Фильтрация по табам
4. Achievements блок

### Этап 3 (Polish)

1. i18n ключи для всех строк
2. Skeleton loaders для каждого блока
3. Error boundaries
4. Кэширование результатов (staleTime в react-query)

---

## 11. Зависимости и риски

| Риск | Митигация |
|------|-----------|
| YouTube API quota (10K units/day) | Кэширование, staleTime: 5 min, серверный cache для competitors |
| OAuth scope: youtube.readonly не запрошен в коде | Scopes настроены в Google Cloud Console (проверить!) |
| Keywords API не существует | MVP с mock data, далее интеграция с внешним API |
| recharts bundle size (~200KB) | Lazy-loading паттерн уже есть в `AdminPage.tsx` |
| Channel model не хранит viewCount | Использовать данные из YouTube API response напрямую |

---

## 12. Контрольный чек-лист для ревью

- [ ] Новый код не ломает существующие страницы
- [ ] Все API вызовы через protectedProcedure
- [ ] Channel ownership проверяется
- [ ] PRO-gating на бэкенде (не только на фронте)
- [ ] Responsive на мобильных (< 768px)
- [ ] Темная тема через useThemeStore
- [ ] Loading states (Skeleton)
- [ ] Error states (ErrorFallback)
- [ ] Нет hardcoded строк (i18n ready)
- [ ] recharts lazy-loaded
- [ ] TypeScript strict: нет any, нет type assertions без необходимости
