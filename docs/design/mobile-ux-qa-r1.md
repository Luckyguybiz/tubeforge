# Design QA Report - Mobile UX Sprint R1

**Author:** Паша (Design)
**Date:** 2026-03-23
**Branch reviewed:** climpire/dbb1eb3f (Development)
**Target branch:** climpire/9c718b2a (Design)

---

## 1. Summary

Dev-команда реализовала мобильную адаптацию для 6 ключевых страниц:
- `/dashboard` - мобильная верстка
- Post-login redirect на `/dashboard`
- `/preview` - доработка инструмента
- `/preview?tab=seo` - SEO-оптимизатор
- `/preview?tab=planner` - контент-планнер
- `/analytics` - мобильная верстка

Ниже - дизайн-аудит реализации с оценкой качества и рекомендациями.

---

## 2. Страница /dashboard

### Что реализовано корректно
- [x] Горизонтальный скролл product cards со scroll-snap
- [x] Скрытые скроллбары (webkit + scrollbar-width: none)
- [x] Responsive heading через `clamp(18px, 4vw, 26px)`
- [x] Activity grid переключается на 1 колонку на мобильных
- [x] Touch-friendly свайп (WebkitOverflowScrolling + touchAction: pan-x)
- [x] Отдельный breakpoint 480px для маленьких экранов

### Замечания (MEDIUM)

| # | Проблема | Рекомендация | Severity |
|---|----------|-------------|----------|
| D1 | Product card width 180px - на iPhone SE (320px) видно только 1.5 карточки, что может выглядеть как обрезанный контент | Уменьшить до 150px на 480px breakpoint или добавить peek-эффект (padding-right: 32px на контейнере) | MEDIUM |
| D2 | Badge "NEW"/"FREE" font-size 10px - может быть сложно прочитать на мобильных | Увеличить до 11px на мобильных, добавить min-width: 32px | LOW |
| D3 | TopChoiceCard width 220px в JSX, переопределяется до 170px через CSS - потенциальный layout shift при загрузке CSS | Добавить inline responsive size через CSS variable | LOW |
| D4 | FreeToolChip padding 14px 20px + whiteSpace: nowrap - длинные названия инструментов могут вызывать горизонтальный overflow | Проверено: скролл контейнер обрабатывает, ОК | INFO |
| D5 | Showcase CTA кнопка "Explore Free Tools" с width:100% на мобиле - хороший паттерн | Подтверждено как корректное решение | OK |

### Визуальная спецификация (утверждена)

```
Mobile (< 768px):
  Container padding: 12px
  Showcase: column layout, padding 16px 14px, gap 16px
  Product cards: 140px width, 100px image height
  Top Choice cards: 170px width, 120px image height
  History grid: 1 column

Small mobile (< 480px):
  Container padding: 8px
  Heading: 18px
  Product cards: 130px width, 90px image height
  Top Choice cards: 160px width, 110px image height
```

---

## 3. Post-login redirect

### Реализация
- `middleware.ts`: fallback redirect изменен с `/ai-thumbnails` на `/dashboard`
- `login/page.tsx`: Auth redirect и OAuth callback обновлены

### Дизайн-оценка
- [x] Корректно: Dashboard - логичная точка входа с обзором инструментов
- [x] Соответствует UX-паттерну "hub & spoke" для платформ

---

## 4. /preview (Publish & Preview)

### Что реализовано
- Platform presets (YouTube, Shorts, Instagram Reels, TikTok, Instagram Post)
- Privacy settings с иконками
- Responsive skeleton loader (1fr vs 1fr 380px grid)
- isMobile detection через window.innerWidth

### Замечания

| # | Проблема | Рекомендация | Severity |
|---|----------|-------------|----------|
| P1 | isMobile определяется в PreviewSkeleton через `typeof window !== 'undefined' && window.innerWidth < 768` - серверный рендеринг всегда покажет desktop layout | Использовать CSS media query вместо JS для skeleton, или добавить useEffect для hydration-safe check | MEDIUM |
| P2 | Platform presets хорошо структурированы с aspect/maxDuration/format | Дизайн утвержден | OK |
| P3 | Privacy options с emoji иконками (globe, link, lock) - понятные визуальные метафоры | Дизайн утвержден | OK |

---

## 5. /preview?tab=seo

### Дизайн-оценка
- SEO tab интегрирован в Preview через tab-систему
- Функциональность полная: title analysis, description, tags
- Мобильная адаптация наследуется от Preview container

### Рекомендации: нет критических замечаний

---

## 6. /preview?tab=planner (Content Planner)

### Дизайн-оценка
- 4 вкладки (Calendar, Content List, Ideas Bank, Templates) реализованы
- Верстка наследуется от Preview container с tab-системой

### Замечания

| # | Проблема | Рекомендация | Severity |
|---|----------|-------------|----------|
| PL1 | 4 вкладки на мобильных могут не влезть в одну строку | CSS правила для горизонтального скролла табов уже добавлены в globals.css | OK |

---

## 7. /analytics

### Что реализовано корректно
- [x] Lazy-loaded tab content (ShortsAnalytics, TiktokAnalytics)
- [x] Tab switcher с gradient active state и box-shadow
- [x] URL sync через query params (?tab=shorts|tiktok)
- [x] ErrorBoundary + Suspense fallback
- [x] Container padding 24px 20px с maxWidth 1400

### Мобильная адаптация (globals.css)
- [x] Container padding: 12px (768px), 8px (480px)
- [x] Tabs: width 100%, flex: 1
- [x] Filters: column layout на мобильных
- [x] Period pills: horizontal scroll, hidden scrollbars
- [x] Stats grid: 2 колонки на мобильных
- [x] Data tables: horizontal scroll с touch support

### Замечания

| # | Проблема | Рекомендация | Severity |
|---|----------|-------------|----------|
| A1 | Tab button font-size 12px на мобильных - с иконкой 18x18 может выглядеть непропорционально | Уменьшить иконку до 14x14 на мобильных или увеличить текст до 13px | LOW |
| A2 | Header h1 font-size 20px (768px) / 18px (480px) - хорошая прогрессия | Дизайн утвержден | OK |
| A3 | Period pills font-size 11px на мобильных - минимально допустимый размер для touch | Убедиться что min-height кнопок >= 36px для tap target | LOW |

---

## 8. Общие замечания по дизайн-системе

### Положительные моменты
1. **Консистентная цветовая тема** - все компоненты используют C.text/C.sub/C.accent/C.card/C.border
2. **Единый border-radius** - 14px для карточек, 10px для кнопок, 12px для mobile
3. **Правильная типографика** - letter-spacing negative для заголовков, fontWeight прогрессия
4. **Touch-friendly** - WebkitOverflowScrolling, scroll-snap, touchAction
5. **Dark/Light mode** - isDark условия корректно применяются

### Рекомендации на будущее (не блокируют текущий спринт)
1. Унифицировать inline styles в CSS-классы для лучшей maintainability
2. Добавить CSS custom properties для повторяющихся значений (gap, padding, border-radius)
3. Рассмотреть Container Queries вместо media queries для компонентной адаптивности

---

## 9. Verdict

**Status: APPROVED**

Реализация соответствует дизайн-требованиям. Критических проблем не найдено.
Все MEDIUM-замечания документированы для следующего спринта.

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 (D1, P1) |
| LOW | 4 (D2, D3, A1, A3) |
| INFO/OK | 8 |

**Рекомендация:** merge можно делать. MEDIUM issues вынести в backlog.
