export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'fix' | 'improvement';
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-03-20',
    title: 'AI Video Generation',
    description: 'Запущена генерация видео через AI: поддержка Runway Gen-3 и Google Veo 3. Создавайте видеоклипы из текстового описания прямо в редакторе.',
    type: 'feature',
  },
  {
    date: '2026-03-18',
    title: 'Minecraft-стили в инструментах',
    description: 'Добавлены Minecraft-стилизованные темы для инструментов. Исправлена работа промокодов в аналитике и типизация ImportModal.',
    type: 'improvement',
  },
  {
    date: '2026-03-15',
    title: 'YouTube Download — новая архитектура',
    description: 'Полностью переработана система скачивания видео: self-hosted Cobalt + VPS прокси. Улучшена стабильность и скорость загрузки.',
    type: 'improvement',
  },
  {
    date: '2026-03-12',
    title: 'SEO и лендинг',
    description: 'Обновлена главная страница: новый дизайн, блог с SEO-статьями, адаптивная вёрстка, документация по деплою.',
    type: 'feature',
  },
  {
    date: '2026-03-10',
    title: 'Реферальная программа',
    description: 'Запущена реферальная система: приглашайте друзей и получайте 20% от их оплат. Интеграция с Sentry для мониторинга ошибок.',
    type: 'feature',
  },
  {
    date: '2026-03-07',
    title: 'VPN для YouTube',
    description: 'Встроенный WireGuard VPN для доступа к YouTube из России. Автоматическая генерация конфигов, скорость до 1 Гбит/с.',
    type: 'feature',
  },
  {
    date: '2026-03-04',
    title: 'Исправления биллинга',
    description: 'Исправлены ошибки при обработке webhook от Stripe. Улучшено отображение статуса подписки и истории платежей.',
    type: 'fix',
  },
  {
    date: '2026-03-01',
    title: 'Онбординг-тур',
    description: 'Добавлен интерактивный тур для новых пользователей: пошаговое знакомство с редактором, инструментами и настройками.',
    type: 'feature',
  },
  {
    date: '2026-02-25',
    title: 'Shorts и TikTok аналитика',
    description: 'Новые дашборды для YouTube Shorts и TikTok: просмотры, CTR, время удержания. Сравнение метрик между платформами.',
    type: 'feature',
  },
  {
    date: '2026-02-20',
    title: 'Улучшения редактора',
    description: 'Добавлены стикеры, улучшено масштабирование холста, исправлена работа undo/redo при множественных изменениях.',
    type: 'improvement',
  },
];
