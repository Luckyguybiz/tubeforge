# Анализ: Увеличение таймаутов генерации

**Дата:** 2026-03-23
**Автор:** Аналитик (Planning)
**Запрос CEO:** "Response generation timed out, so the run was stopped. Please try again shortly. Мы можем как-то увеличить?"

---

## 1. Текущее состояние таймаутов

### 1.1 Глобальные настройки
| Параметр | Значение | Файл |
|----------|----------|------|
| Next.js `maxDuration` (глобально) | **Не задан** | `next.config.ts` |
| PM2 режим | cluster, 4 инстанса | `ecosystem.config.js` |
| PM2 memory limit | 512 MB | `ecosystem.config.js` |

### 1.2 Таймауты AI-генерации (наиболее вероятные причины таймаута)
| Компонент | Таймаут | Файл : строка |
|-----------|---------|---------------|
| `GENERATION_TIMEOUT_MS` (сцены) | **120с (2 мин)** | `src/lib/constants.ts:105` |
| `fetchWithTimeout` (ai router) | **30с** | `src/server/routers/ai.ts:12` |
| `fetchWithTimeout` (aiThumbnails) | **30с** | `src/server/routers/aiThumbnails.ts:22` |
| `fetchWithTimeout` (videoTask) | **30с** | `src/server/routers/videoTask.ts:9` |
| `fetchWithTimeout` (youtube) | **30с** | `src/server/routers/youtube.ts:13` |
| thumbnail-ai route | **60с** | `src/app/api/tools/thumbnail-ai/route.ts:10` |
| free-tools generate | **30с** | `src/app/api/free-tools/generate/route.ts:175` |

### 1.3 Таймауты медиа-обработки
| Компонент | Таймаут | Файл : строка |
|-----------|---------|---------------|
| mp4-to-gif (`maxDuration`) | 120с | `src/app/api/tools/mp4-to-gif/route.ts:7` |
| video-translate (extract) | 120с | `src/app/api/tools/video-translate/route.ts:121` |
| video-translate (merge) | 60с | `src/app/api/tools/video-translate/route.ts:242` |
| video-translate (другие) | 300с | `src/app/api/tools/video-translate/route.ts:284` |

### 1.4 Таймауты внешних API
| Компонент | Таймаут | Файл : строка |
|-----------|---------|---------------|
| YouTube/TikTok analytics | 10с | shorts-analytics, tiktok-analytics |
| Pexels stock | 8с | `src/server/routers/stock.ts:75` |
| Webhook delivery | 5-10с | webhook.ts, webhook-delivery.ts |
| Image download | 30с | `src/lib/image-storage.ts:32` |

---

## 2. Диагностика: Что именно таймаутит?

### Наиболее вероятные сценарии:
1. **AI-генерация (30с `fetchWithTimeout`)** - вызовы OpenAI/fal.ai через tRPC роутеры ограничены 30 секундами. При высокой нагрузке на API или сложных запросах 30с может быть недостаточно.
2. **Scene generation (120с)** - `GENERATION_TIMEOUT_MS` помечает сцену как ошибку через 2 минуты.
3. **Next.js Server Actions** - нет глобального `maxDuration`, по умолчанию Next.js применяет 30с для serverless-функций (но на self-hosted это менее критично).

### Ключевое наблюдение:
На self-hosted сервере (VPS 57.128.254.111) **нет жестких ограничений serverless runtime** как на Vercel. Основные ограничения - это наши собственные `fetchWithTimeout` и `GENERATION_TIMEOUT_MS`.

---

## 3. Рекомендации

### 3.1 Быстрые изменения (Quick Wins)

**A. Увеличить `fetchWithTimeout` для AI-роутеров с 30с до 90с**
- Файлы: `ai.ts`, `aiThumbnails.ts`, `videoTask.ts`
- Обоснование: OpenAI и fal.ai могут отвечать до 60-90с при сложных генерациях
- Риск: Низкий. На self-hosted нет ограничений serverless

**B. Увеличить `GENERATION_TIMEOUT_MS` с 120с до 180с (3 мин)**
- Файл: `src/lib/constants.ts:105`
- Обоснование: Дает запас для каскадных вызовов (prompt → OpenAI → fal.ai → сохранение)

**C. Увеличить thumbnail-ai timeout с 60с до 120с**
- Файл: `src/app/api/tools/thumbnail-ai/route.ts:10`
- Обоснование: Генерация thumbnail через Flux Pro может занимать больше 60с

**D. Увеличить free-tools generate с 30с до 60с**
- Файл: `src/app/api/free-tools/generate/route.ts:175`

### 3.2 Архитектурные улучшения (среднесрочно)

**E. Вынести таймауты в переменные окружения**
- Вместо хардкода создать env-переменные: `AI_FETCH_TIMEOUT_MS`, `GENERATION_TIMEOUT_MS`
- Позволит менять таймауты без пересборки

**F. Добавить retry-логику для AI-вызовов**
- Если первый вызов таймаутит, повторить 1 раз с увеличенным таймаутом
- Паттерн: exponential backoff (30с → 60с → fail)

**G. Добавить streaming для долгих генераций**
- Вместо ожидания полного ответа, стримить прогресс на клиент
- Убирает ощущение "зависания" у пользователя

### 3.3 Мониторинг

**H. Добавить логирование таймаутов**
- При каждом таймауте логировать: endpoint, длительность, тип запроса
- Позволит точно диагностировать, какие именно операции таймаутят

---

## 4. Приоритетный план действий

| # | Действие | Приоритет | Сложность | Владелец |
|---|----------|-----------|-----------|----------|
| 1 | Увеличить fetchWithTimeout в AI-роутерах до 90с | **CRITICAL** | Низкая (4 файла, 1 значение) | Backend |
| 2 | Увеличить GENERATION_TIMEOUT_MS до 180с | **HIGH** | Низкая (1 файл) | Backend |
| 3 | Увеличить thumbnail-ai timeout до 120с | **HIGH** | Низкая (1 файл) | Backend |
| 4 | Увеличить free-tools timeout до 60с | **HIGH** | Низкая (1 файл) | Backend |
| 5 | Вынести таймауты в env-переменные | **MEDIUM** | Средняя | Backend |
| 6 | Retry-логика для AI | **MEDIUM** | Средняя | Backend |
| 7 | Логирование таймаутов | **MEDIUM** | Низкая | Backend/DevOps |
| 8 | Streaming для генерации | **LOW** | Высокая | Backend + Frontend |

---

## 5. Что НЕ нужно менять

- **Webhook delivery (5-10с)** - адекватное значение для webhook
- **Analytics API (10с)** - YouTube API отвечает быстро
- **Stock API (8с)** - Pexels отвечает за 1-2с
- **Health check (15с)** - достаточно
- **PM2 config** - 4 инстанса в cluster mode адекватно

---

## 6. Резюме

**Да, можно увеличить.** Основная проблема - жесткий лимит 30с на `fetchWithTimeout` в AI-роутерах. На self-hosted VPS нет ограничений serverless runtime, поэтому увеличение безопасно. Рекомендуемые значения:

| Параметр | Было | Станет |
|----------|------|--------|
| AI fetch timeout | 30с | 90с |
| Generation timeout | 120с (2 мин) | 180с (3 мин) |
| Thumbnail AI timeout | 60с | 120с |
| Free tools timeout | 30с | 60с |

Пункты 1-4 можно применить за один коммит с минимальным риском.
