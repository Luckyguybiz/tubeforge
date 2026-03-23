# Спецификация: Mobile UX Sprint Round 1

**Дата:** 2026-03-23
**Автор:** Аналитик (Planning)
**Статус:** Ready for Development

---

## Обзор задач

| # | Задача | Приоритет | Сложность | Файлы для изменений |
|---|--------|-----------|-----------|---------------------|
| 1 | Мобильная верстка /dashboard | HIGH | Medium | `Dashboard.tsx`, `globals.css` |
| 2 | Редирект после логина на /dashboard | HIGH | Low | `login/page.tsx`, `middleware.ts` |
| 3 | Доделать инструмент /preview | MEDIUM | High | `PreviewSave.tsx` |
| 4 | Доделать /preview?tab=seo | MEDIUM | High | `Metadata.tsx` |
| 5 | Верстка /preview?tab=planner | MEDIUM | Medium | `ContentPlanner.tsx` |
| 6 | Мобильная верстка /analytics | HIGH | Medium | `analytics/page.tsx`, `ShortsAnalytics.tsx`, `TiktokAnalytics.tsx`, `globals.css` |

---

## 1. Мобильная верстка /dashboard

### Текущее состояние
- **Файл:** `src/views/Dashboard/Dashboard.tsx` (~602 строк)
- **CSS:** `src/app/globals.css` (строки 250-317)
- Контейнер: `maxWidth: 1200`, `padding: '0 16px'`
- Есть медиа-запросы для 960px, 768px, 640px

### Выявленные проблемы

#### 1.1 Product Showcase секция (строки 330-409)
- **Проблема:** На мобильном (< 640px) горизонтальный скролл карточек продуктов (`tf-dash-showcase-scroll`) работает, но левая часть с заголовком (`tf-dash-showcase-left`) имеет `minWidth: 200` и не уменьшается
- **CSS медиа (768px):** `flex-direction: column` - ок, но `text-align: center` для заголовков выглядит неестественно
- **Карточки продуктов:** Ширина 180px фиксированная, на маленьких экранах (< 375px) видны максимум 1.5 карточки
- **Рекомендация:**
  - Убрать `text-align: center` из `.tf-dash-showcase-left` на мобильных, оставить `left`
  - Уменьшить padding showcase на мобильных до `12px`
  - Добавить padding-right к scroll-контейнеру чтобы последняя карточка не обрезалась

#### 1.2 Top Choice Tools (строки 411-484)
- **Проблема:** На 960px переключается на `flex-wrap`, ширина 50% - карточки не влезают с `width: 220px`
- На 640px: `width: 180px`, `flex-shrink: 0` - горизонтальный скролл ок
- **Рекомендация:** Высота gradient-area (160px) слишком велика для мобильных, сократить до 120px на < 640px

#### 1.3 Free YouTube Tools (строки 486-530)
- **Проблема:** Горизонтальный скролл работает (`touch-action: pan-x`), но нет визуального индикатора что есть больше элементов
- **Рекомендация:** Добавить fade-out gradient справа как визуальный hint для скролла

#### 1.4 Recent History Grid (строки 532-598)
- **Проблема:** `gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))'` - хорошо адаптируется
- CSS на 640px: `grid-template-columns: 1fr` - ок
- **Статус:** Работает корректно, минимальные правки

#### 1.5 Welcome Header (строки 310-327)
- `fontSize: 'clamp(20px, 4vw, 26px)'` - адаптивный размер ок
- **Рекомендация:** Добавить `marginTop: 16` для мобильных, чтобы не прилипал к TopBar

### Требуемые изменения в `globals.css`

```css
/* Добавить в @media (max-width: 640px) */
.tf-dash-showcase-left {
  text-align: left !important;
}
.tf-dash-container {
  padding: 0 12px !important;
}
.tf-top-choice-card > div:first-child {
  height: 120px !important; /* уменьшить gradient area */
}
.tf-dash-showcase {
  padding: 12px !important;
}
```

### Требуемые изменения в `Dashboard.tsx`
- Строка 308: Добавить `paddingTop: 8` в container на мобильных (через CSS класс)
- Showcase scroll: добавить `paddingRight: 16` для breathing room последней карточки

---

## 2. Редирект после логина на /dashboard

### Текущее состояние
Текущий редирект: `/ai-thumbnails` (3 точки)

### Точки изменений

#### 2.1 Login page (`src/app/(auth)/login/page.tsx`)
- **Строка 27:** `if (status === 'authenticated') window.location.href = '/ai-thumbnails';`
  - **Изменить на:** `'/dashboard'`
- **Строка 86:** `onClick={() => signIn('google', { callbackUrl: '/ai-thumbnails' })}`
  - **Изменить на:** `{ callbackUrl: '/dashboard' }`

#### 2.2 Middleware (`src/middleware.ts`)
- **Строка 265:** Fallback redirect: `'/ai-thumbnails'`
  - **Изменить на:** `'/dashboard'`

### Проверка безопасности (DevSecOps)
- Редирект только для authenticated пользователей - ок
- Middleware уже валидирует `callbackUrl` (строки 262-264) - open redirect защита есть
- Unauthenticated запрос к `/dashboard` корректно перенаправит на `/login?callbackUrl=/dashboard` - ок
- **Вердикт:** Безопасно, без рисков auth bypass

### Дополнительная проверка
- Искать другие файлы с хардкодом `/ai-thumbnails` как redirect destination
- Sidebar `active` state должен корректно подсвечивать Dashboard

---

## 3. Доделать инструмент /preview (Preview & Publish)

### Текущее состояние
- **Файл:** `src/views/Preview/PreviewSave.tsx` (~1771 строк)
- Компонент: `PreviewSave({ projectId })`
- isMobile check: `window.innerWidth < 768` (строка 109)
- Основной layout: `grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 380px'` (строка 835)

### Функциональность (что уже есть)
- Multi-platform export presets (YouTube, Shorts, Reels, TikTok, Instagram Post)
- Privacy settings (public, unlisted, private)
- Video player with playback controls
- Scene preview thumbnails
- Publish to YouTube (requires OAuth)
- Publishing history (localStorage)
- Download progress tracking
- AI Captions (SRT download)
- Celebration on first video publish

### Что нужно доделать / проверить
1. **Без projectId:** Компонент получает `projectId` из URL params. Если нет projectId, нужен graceful fallback (выбор проекта или placeholder)
2. **Mobile layout:** Уже есть `isMobile` state - grid переключается на 1fr. Нужно проверить:
   - Sidebar publish panel на мобильном не должен быть слишком широким
   - Кнопки действий должны быть full-width на мобильных
   - Scene thumbnails должны горизонтально скроллиться
3. **Platform presets:** Проверить что переключение aspect ratio работает и preview обновляется
4. **Публикация:** Проверить что YouTube OAuth flow работает корректно

### Рекомендации
- Добавить project selector если `projectId === null` (вместо пустого экрана)
- Убедиться что кнопка "Publish" на мобильных имеет достаточный touch target (минимум 44px)
- Video player aspect ratio: добавить `max-height: 60vh` на мобильных чтобы не занимал весь экран

---

## 4. Доделать /preview?tab=seo (Metadata Editor)

### Текущее состояние
- **Файл:** `src/views/Metadata/Metadata.tsx` (~2142 строк)
- `isMobile` check: `window.innerWidth < 900` (строка 415)
- Main layout: `maxWidth: 1060`, padding adaptive
- Two-column layout на десктопе, column на мобильных

### Функциональность (что уже есть)
- Title editor с character counter (100 max)
- Description editor с character counter (5000 max)
- YouTube category selector (16 categories)
- Tag management (add/remove chips)
- Description templates (timecodes, links, social, CTA)
- AI suggestions для title, description, tags
- Timestamp validation and extraction
- Project selector breadcrumb
- Save to project functionality

### Что нужно доделать / проверить
1. **AI Suggestions:** Проверить что AI кнопки работают (OpenAI API)
2. **Mobile layout:**
   - Строка 1100: `flexDirection: isMobile ? 'column' : 'row'` - ок
   - Строка 1578: Sidebar (340px) becomes full-width - ок
   - SectionCard padding уже адаптивный (строка 167)
3. **Save functionality:** Сохранение в проект через tRPC mutation
4. **Character counter warnings:** Визуальное предупреждение при приближении к лимитам

### Рекомендации
- AI suggestion chips: увеличить touch target на мобильных (текущий padding: `5px 14px` мал)
- Tag input: на мобильных `maxWidth: 400` (строка 953) - нужно `maxWidth: '100%'` на isMobile
- Description textarea: добавить `min-height: 150px` на мобильных
- Category select: проверить что `<select>` элемент корректно отображается на мобильных iOS/Android

---

## 5. Верстка /preview?tab=planner (Content Planner)

### Текущее состояние
- **Файл:** `src/views/Tools/ContentPlanner.tsx` (~1552 строк)
- Используется `ToolPageShell` wrapper
- 4 вкладки: Calendar, Content List, Ideas Bank, Templates
- Zustand persistent store для данных

### Выявленные проблемы мобильной верстки

#### 5.1 Calendar Grid (строки 569-584)
- `gridTemplateColumns: 'repeat(7, minmax(40px, 1fr))'` с `minWidth: 320`
- Обернут в `overflowX: 'auto'` - горизонтальный скролл есть
- **Проблема:** На < 375px ячейки (40px * 7 = 280px + gaps) могут быть слишком мелкими для touch

#### 5.2 Stats Grid (строки 429-430)
- `repeat(auto-fit, minmax(140px, 1fr))` - адаптивный
- **Статус:** ок

#### 5.3 Content List Cards (строки 844-845)
- `repeat(auto-fill, minmax(260px, 1fr))` - адаптивный
- **Статус:** ок, на мобильных будет 1 колонка

#### 5.4 Tabs (TAB_KEYS)
- 4 вкладки в горизонтальном ряду
- **Проблема:** На мобильных 4 вкладки ("Calendar", "Content List", "Ideas Bank", "Templates") не влезают в одну строку
- **Рекомендация:**
  - `overflow-x: auto` для tab-контейнера
  - Или перестроить в 2x2 grid на < 480px

#### 5.5 Modal (строка 1282)
- `maxHeight: 'calc(100dvh - 80px)'`, `overflowY: 'auto'`
- **Проблема:** Нет maxWidth на мобильных, может быть шире экрана
- **Рекомендация:** Добавить `maxWidth: 'calc(100vw - 32px)'` и `width: '100%'`

#### 5.6 Templates Grid (строка 1366)
- `repeat(auto-fill, minmax(200px, 1fr))` - адаптивный
- **Статус:** ок

### Рекомендации
- Tab container: добавить `flex-wrap: wrap` или `overflow-x: auto` на мобильных
- Calendar cells: увеличить touch target, добавить padding
- Modal: адаптировать ширину и padding на мобильных
- Add/Edit form inputs: проверить что все `<input>` и `<select>` имеют `width: 100%`

---

## 6. Мобильная верстка /analytics

### Текущее состояние
- **Page:** `src/app/(app)/analytics/page.tsx` (210 строк)
- **CSS:** `globals.css` (строки 319-353)
- **Components:** `ShortsAnalytics.tsx` (~1810 строк), `TiktokAnalytics.tsx` (~1868 строк)
- Container: `padding: '32px 36px'`, `maxWidth: 1400`

### Выявленные проблемы

#### 6.1 Container Padding (analytics/page.tsx, строка 91)
- `padding: '32px 36px'` - слишком большой для мобильных
- CSS override (globals.css:322): `padding: 16px` на 768px - ок
- **Но:** промежуток 768px-960px не покрыт, padding 36px слишком велик для планшетов

#### 6.2 Tab Switcher (строки 125-176)
- `width: 'fit-content'` - ок для десктопа
- CSS override: `width: 100%` на 768px, кнопки `flex: 1` - ок
- **Статус:** Работает

#### 6.3 ShortsAnalytics внутренний layout
- Hero gradient cards: `flex: 1, minWidth: 160` - на мобильных все 4 карточки в column
- **Проблема:** Нет `flex-wrap: wrap` для stat cards контейнера - карточки могут overflow
- Table: `minWidth: 700` в `.tf-shorts-table-wrap` с `overflowX: auto` - горизонтальный скролл ок
- **Проблема:** Filter dropdowns (`<select>`) - CSS override `width: 100%` на 768px, но сами фильтры в inline flex контейнере
- **Рекомендация:** Фильтры (period, country, category) должны стакаться вертикально на < 640px

#### 6.4 TiktokAnalytics внутренний layout
- Аналогичные проблемы что и ShortsAnalytics
- Дополнительные фильтры (hashtag, sounds) занимают больше места

#### 6.5 Stat Cards (StatCard.tsx)
- `flex: '1 1 220px'`, `minWidth: 200` - на мобильных overflow
- **Рекомендация:** `minWidth: '100%'` или `minWidth: 0` на < 640px

### Требуемые изменения в `globals.css`

```css
/* Добавить новый медиа-запрос */
@media (max-width: 640px) {
  .tf-analytics-container {
    padding: 12px !important;
  }
  /* Stat cards stacking */
  .tf-analytics-content .stat-cards-row {
    flex-direction: column !important;
  }
  /* Filters stacking */
  .tf-analytics-content .filters-row {
    flex-direction: column !important;
    gap: 8px !important;
  }
}
```

**Примечание:** ShortsAnalytics и TiktokAnalytics используют inline styles, поэтому потребуется добавить CSS-классы к контейнерам фильтров и stat cards, или использовать `isMobile` state аналогично PreviewSave.

---

## Общие рекомендации

### Безопасность (DevSecOps)
- Редирект `/dashboard` - проверить что middleware auth guard работает (уже покрыт)
- Никаких изменений в `.env`, Prisma schema, deploy scripts
- Все изменения frontend-only

### Тестирование
- Проверить на реальных устройствах: iPhone SE (375px), iPhone 14 (390px), Samsung Galaxy (360px)
- Проверить landscape ориентацию
- Проверить с открытой клавиатурой (для input полей)
- Проверить touch scrolling на всех горизонтальных каруселях

### Post-deploy проверка
- `pm2 restart tubeforge`
- Визуальная проверка всех 6 страниц в Chrome DevTools mobile emulation
- Проверить что post-login redirect работает корректно

---

## Порядок реализации (рекомендация)

1. **Редирект на /dashboard** (5 мин) - 3 строки кода, наименьший риск
2. **Мобильная верстка /dashboard** (30 мин) - CSS + minor TSX changes
3. **Мобильная верстка /analytics** (45 мин) - CSS + inline style adjustments
4. **/preview?tab=planner верстка** (30 мин) - tab overflow + modal fixes
5. **Доделать /preview** (60 мин) - project selector, mobile polish
6. **Доделать /preview?tab=seo** (45 мин) - AI buttons, touch targets
