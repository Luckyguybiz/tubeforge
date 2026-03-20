import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  LandingHeader,
  AnimatedHero,
  ScrollRevealProvider,
  FaqAccordion,
  HoverCard,
  HoverLink,
  HoverButton,
  ClientCookieConsent,
} from '@/components/landing';

/* ── Color constants ──────────────────────────────────────── */

const INDIGO_600 = '#4f46e5';
const INDIGO_500 = '#6366f1';
const INDIGO_50 = '#eef2ff';
const GRAY_50 = '#f9fafb';
const GRAY_100 = '#f3f4f6';
const GRAY_200 = '#e5e7eb';
const GRAY_400 = '#9ca3af';
const GRAY_500 = '#6b7280';
const GRAY_600 = '#4b5563';
const GRAY_700 = '#374151';
const GRAY_800 = '#1f2937';
const GRAY_900 = '#111827';
const WHITE = '#ffffff';

/* ── Shared icon component ────────────────────────────────── */

const LightningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8.5 1L3 9H7.5L7 15L13 7H8.5L8.5 1Z" fill="currentColor" />
  </svg>
);

/* ── Shared button style helpers ──────────────────────────── */

const primaryBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  textDecoration: 'none',
  color: WHITE,
  fontSize: 17,
  fontWeight: 700,
  padding: '14px 36px',
  borderRadius: 50,
  background: `linear-gradient(135deg, ${INDIGO_600}, ${INDIGO_500})`,
  boxShadow: '0 4px 24px rgba(79,70,229,0.35)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const outlineBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  textDecoration: 'none',
  color: GRAY_900,
  fontSize: 17,
  fontWeight: 700,
  padding: '14px 36px',
  borderRadius: 50,
  background: WHITE,
  border: `1px solid ${GRAY_200}`,
  transition: 'background 0.2s, transform 0.2s',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: 'clamp(28px, 4vw, 44px)',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: GRAY_900,
  margin: '0 0 14px',
  lineHeight: 1.15,
};

const sectionSubStyle: CSSProperties = {
  fontSize: 18,
  color: GRAY_500,
  fontWeight: 400,
  margin: 0,
  lineHeight: 1.6,
};

/* ── Data ─────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: 'Возможности', href: '#features' },
  { label: 'Инструменты', href: '#tools' },
  { label: 'Тарифы', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    title: 'ИИ-Генерация Видео',
    desc: 'Создавайте видео за минуты с помощью ИИ. Автоматический монтаж, переходы и озвучка из текста.',
    color: '#eef2ff',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    title: 'Умные Обложки',
    desc: 'ИИ-генерация и редактирование обложек в стиле Canva. A/B тесты для максимального CTR.',
    color: '#fdf2f8',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'SEO Метаданные',
    desc: 'Автоматическая генерация заголовков, описаний и тегов. Оптимизация для алгоритмов YouTube.',
    color: '#ecfdf5',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Аналитика Канала',
    desc: 'Глубокая аналитика: просмотры, CTR, удержание, рост подписчиков. Данные для решений.',
    color: '#eff6ff',
  },
];

const STEPS = [
  { num: '1', title: 'Создайте проект', desc: 'Опишите идею видео или вставьте текст — ИИ всё сделает сам' },
  { num: '2', title: 'ИИ сгенерирует', desc: 'Видео, обложка, озвучка и метаданные создаются за минуты' },
  { num: '3', title: 'Публикуйте', desc: 'Загрузите на YouTube прямо из TubeForge в один клик' },
];

const TOOLS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    title: 'ИИ-Генерация видео',
    desc: 'Из текста — в готовое видео с монтажом и переходами',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    title: 'ИИ-Озвучка',
    desc: 'Реалистичные голоса на 30+ языках с настройкой тона и скорости',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    title: 'ИИ-Изображения',
    desc: 'Генерация уникальных изображений и обложек по текстовому описанию',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3l14 9-14 9V3z" />
        <line x1="19" y1="3" x2="19" y2="21" />
      </svg>
    ),
    title: 'Удаление фона',
    desc: 'Мгновенное удаление фона из изображений и видеокадров',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    title: 'Скачивание видео',
    desc: 'Скачивайте видео с любых платформ для использования в проектах',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    title: 'Генератор идей',
    desc: 'ИИ предложит трендовые темы и заголовки для вашей ниши',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Улучшение речи',
    desc: 'Шумоподавление, выравнивание громкости и улучшение качества аудио',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    title: 'Удаление вокала',
    desc: 'Отделяйте голос от музыки для создания фоновых дорожек',
  },
];

const TESTIMONIALS = [
  {
    name: 'Алексей К.',
    role: 'YouTube блогер',
    avatar: { initials: 'АК', bg: '#6366f1' },
    quote: 'TubeForge полностью изменил мой рабочий процесс. Раньше на одно видео уходил целый день, теперь я делаю 3 видео за то же время. Рост канала — 400% за полгода.',
  },
  {
    name: 'Мария С.',
    role: 'Контент-менеджер',
    avatar: { initials: 'МС', bg: '#ec4899' },
    quote: 'Управляю 5 каналами одновременно, и без TubeForge это было бы невозможно. ИИ-обложки и автоматические метаданные экономят часы каждый день.',
  },
  {
    name: 'Дмитрий В.',
    role: 'Стример',
    avatar: { initials: 'ДВ', bg: '#f59e0b' },
    quote: 'Лучший инструмент для нарезки стримов в клипы. ИИ сам находит лучшие моменты, добавляет субтитры и оптимизирует для Shorts. Мой Shorts-канал вырос до 50К подписчиков.',
  },
  {
    name: 'Елена П.',
    role: 'Маркетолог',
    avatar: { initials: 'ЕП', bg: '#10b981' },
    quote: 'Используем TubeForge для видео-маркетинга клиентов. Генерация видео из текста — это магия. Клиенты довольны, а мы экономим бюджет на продакшн.',
  },
  {
    name: 'Игорь Н.',
    role: 'Видеограф',
    avatar: { initials: 'ИН', bg: '#8b5cf6' },
    quote: 'Как профессиональный видеограф, я скептически относился к ИИ-инструментам. Но TubeForge реально ускоряет рутину — цветокоррекция, субтитры, обложки за секунды.',
  },
  {
    name: 'Ольга Т.',
    role: 'SMM-специалист',
    avatar: { initials: 'ОТ', bg: '#ef4444' },
    quote: 'Перепробовала десяток инструментов, TubeForge — единственный, где всё в одном месте. Генерация, монтаж, SEO, аналитика. Рекомендую всем коллегам.',
  },
];

const FAQ_DATA = [
  {
    q: 'Что такое TubeForge?',
    a: 'TubeForge — это ИИ-студия для YouTube-креаторов. Платформа объединяет ИИ-генерацию видео, профессиональный веб-редактор, создание обложек, SEO-оптимизацию метаданных и аналитику канала — всё в одном браузерном приложении.',
  },
  {
    q: 'Как работает ИИ-генерация видео?',
    a: 'Вы вводите текстовое описание или сценарий, выбираете стиль и язык озвучки, а ИИ автоматически создаёт видеоряд, переходы, озвучку и субтитры. Весь процесс занимает 3-5 минут, после чего вы можете доработать результат во встроенном веб-редакторе.',
  },
  {
    q: 'Сколько стоит TubeForge?',
    a: 'У TubeForge есть бесплатный тариф: 3 видео в месяц, базовый редактор и 1 ГБ хранилища. Тариф Pro — 990\u20BD/мес с 30 видео, 4K-экспортом и YouTube-интеграцией. Тариф Studio — 2490\u20BD/мес с безлимитом видео, командной работой и API-доступом.',
  },
  {
    q: 'Какие языки и форматы поддерживаются?',
    a: 'TubeForge оптимизирован для YouTube, но видео можно использовать на любой платформе. ИИ-озвучка поддерживает 30+ языков, включая русский, английский, испанский, французский, немецкий, китайский и японский. Экспорт доступен в форматах MP4, WebM и MOV с разрешением до 4K.',
  },
  {
    q: 'Мои данные в безопасности?',
    a: 'Да. TubeForge использует шифрование корпоративного уровня для данных при хранении и передаче. Ваши видео, проекты и данные аккаунта хранятся в защищённом виде. Мы не передаём ваш контент третьим лицам. OAuth-токены для YouTube-интеграции зашифрованы и могут быть отозваны в любой момент.',
  },
  {
    q: 'Могу ли я монетизировать видео, созданные в TubeForge?',
    a: 'Безусловно. Все видео, созданные в TubeForge, полностью принадлежат вам. Вы можете монетизировать их на YouTube, использовать в коммерческих проектах или продавать — никаких лицензионных ограничений на ваш контент.',
  },
  {
    q: 'Есть ли возможность командной работы?',
    a: 'Да, тариф Studio поддерживает командную работу до 10 человек. Каждый участник получает собственный доступ с настраиваемыми правами. Вы можете совместно редактировать проекты, управлять несколькими каналами и использовать общие брендированные шаблоны.',
  },
];

const PRICING_PLANS = [
  {
    name: 'Бесплатный',
    price: '0\u20BD',
    period: '',
    desc: 'Для тех, кто хочет попробовать',
    features: [
      '3 видео в месяц',
      'Базовый ИИ-редактор',
      'Генерация обложек',
      'SEO-оптимизация',
      '1 ГБ хранилища',
      '720p экспорт',
    ],
    highlighted: false,
    badge: null as string | null,
    accent: null as string | null,
  },
  {
    name: 'Pro',
    price: '990\u20BD',
    period: '/мес',
    desc: 'Для активных креаторов',
    features: [
      '30 видео в месяц',
      'Продвинутый ИИ-редактор',
      'Приоритетная ИИ-озвучка',
      'Безлимит обложек',
      'A/B тесты обложек',
      '50 ГБ хранилища',
      '1080p / 4K экспорт',
      'YouTube-интеграция',
      'Аналитика канала',
    ],
    highlighted: true,
    badge: 'Популярный',
    accent: `linear-gradient(135deg, ${INDIGO_600}, ${INDIGO_500})`,
  },
  {
    name: 'Studio',
    price: '2490\u20BD',
    period: '/мес',
    desc: 'Для команд и агентств',
    features: [
      'Безлимит видео',
      'Все Pro-функции',
      'Командная работа до 10 чел.',
      'Брендированные шаблоны',
      'API-доступ',
      '500 ГБ хранилища',
      '4K + HDR экспорт',
      'Выделенная поддержка',
      'Приоритетная генерация',
      'Мульти-канальность',
    ],
    highlighted: false,
    badge: null,
    accent: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
  },
];

const FOOTER_COLUMNS = [
  {
    title: 'Продукт',
    links: [
      { label: 'Возможности', href: '#features' },
      { label: 'Тарифы', href: '#pricing' },
      { label: 'Редактор', href: '#editor' },
      { label: 'ИИ-Инструменты', href: '#tools' },
    ],
  },
  {
    title: 'Инструменты',
    links: [
      { label: 'Генерация видео', href: '#tools' },
      { label: 'ИИ-Озвучка', href: '#tools' },
      { label: 'Обложки', href: '#tools' },
      { label: 'SEO-оптимизация', href: '#tools' },
    ],
  },
  {
    title: 'Юридическое',
    links: [
      { label: 'Условия использования', href: '#' },
      { label: 'Конфиденциальность', href: '#' },
      { label: 'Возврат средств', href: '#' },
      { label: 'Cookie-политика', href: '#' },
    ],
  },
  {
    title: 'Соцсети',
    links: [
      { label: 'YouTube', href: '#' },
      { label: 'Telegram', href: '#' },
      { label: 'Twitter / X', href: '#' },
      { label: 'ВКонтакте', href: '#' },
    ],
  },
];

/* ── Main component (Server Component) ───────────────────── */

export default function LandingPage() {
  return (
    <div
      style={{
        background: WHITE,
        color: GRAY_900,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        minHeight: '100vh',
      }}
    >
      {/* Client island: sets up IntersectionObserver + smooth scroll */}
      <ScrollRevealProvider />

      {/* ========== JSON-LD STRUCTURED DATA ========== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'TubeForge',
            description: 'ИИ-студия для YouTube-креаторов. Генерация видео, редактирование обложек, SEO-оптимизация метаданных и аналитика канала.',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web',
            url: 'https://tubeforge.co',
            offers: [
              {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'RUB',
                name: 'Free',
              },
              {
                '@type': 'Offer',
                price: '990',
                priceCurrency: 'RUB',
                name: 'Pro',
              },
              {
                '@type': 'Offer',
                price: '2490',
                priceCurrency: 'RUB',
                name: 'Studio',
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_DATA.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            })),
          }),
        }}
      />

      {/* ========== HEADER (client island) ========== */}
      <LandingHeader navLinks={NAV_LINKS} lightningIcon={<LightningIcon />} />

      {/* ========== HERO ========== */}
      <section style={{ paddingTop: 160, paddingBottom: 100, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Animated gradient orbs */}
        <div
          aria-hidden="true"
          className="tf-float"
          style={{
            position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
            width: 800, height: 800, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          className="tf-float-slow"
          style={{
            position: 'absolute', top: 100, right: -200, width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          className="tf-float-reverse"
          style={{
            position: 'absolute', bottom: -100, left: -200, width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Client island: animated entrance for hero content */}
        <AnimatedHero>
          <div
            className="tf-badge-pulse"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: INDIGO_50, border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 50, padding: '8px 20px', marginBottom: 32,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.5 1L3 9H7.5L7 15L13 7H8.5L8.5 1Z" fill={INDIGO_600} /></svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: INDIGO_600 }}>Запущено в 2026 году</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 24px', color: GRAY_900,
          }}>
            Создавайте<br />
            <span className="tf-gradient-text" style={{ display: 'inline-block', background: `linear-gradient(135deg, ${INDIGO_600}, ${INDIGO_500}, #ec4899, ${INDIGO_600})`, backgroundSize: '300% 100%', color: WHITE, padding: '4px 20px', borderRadius: 14, margin: '8px 0' }}>
              #1 ИИ-Студия
            </span><br />
            Вирусные Видео для YouTube
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)', color: GRAY_500, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 40px', fontWeight: 400,
          }}>
            Ваш универсальный инструмент для создания видео с ИИ-озвучкой, обложками, метаданными и аналитикой.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <HoverButton
              href="/register"
              style={{ ...primaryBtnStyle, fontSize: 18, padding: '16px 40px' }}
              hoverTransform="translateY(-2px)"
              hoverBoxShadow="0 8px 32px rgba(79,70,229,0.5)"
              resetTransform="translateY(0)"
              resetBoxShadow="0 4px 24px rgba(79,70,229,0.35)"
            >
              <LightningIcon /> Попробовать бесплатно
            </HoverButton>
            <HoverButton
              href="#editor"
              isAnchor
              style={{ ...outlineBtnStyle, fontSize: 18, padding: '16px 40px' }}
              hoverBackground={GRAY_50}
              hoverTransform="translateY(-2px)"
              resetBackground={WHITE}
              resetTransform="translateY(0)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              Смотреть демо
            </HoverButton>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { label: 'Бесплатный старт' },
              { label: 'Не нужна карта' },
              { label: 'Отмена в любой момент' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GRAY_400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{ fontSize: 14, color: GRAY_500, fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </AnimatedHero>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="tf-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={sectionHeadingStyle}>Инструменты для Вирального Роста</h2>
          <p style={sectionSubStyle}>Всё что нужно для YouTube — в одном месте</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {FEATURES.map((feature, i) => (
            <HoverCard
              key={i}
              className="tf-reveal tf-card-hover"
              style={{ background: WHITE, border: `1px solid ${GRAY_100}`, borderRadius: 20, padding: 32, transition: 'transform 0.25s ease, box-shadow 0.25s ease', cursor: 'default', transitionDelay: `${i * 100}ms` }}
              hoverTransform="translateY(-6px) scale(1.02)"
              hoverBoxShadow="0 16px 48px rgba(0,0,0,0.1)"
              resetTransform="translateY(0) scale(1)"
              resetBoxShadow="none"
            >
              <div className="tf-icon-bounce" style={{ width: 56, height: 56, borderRadius: 14, background: feature.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'transform 0.3s ease' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: GRAY_900, margin: '0 0 10px', letterSpacing: '-0.01em' }}>{feature.title}</h3>
              <p style={{ fontSize: 15, color: GRAY_500, lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
            </HoverCard>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section style={{ padding: '100px 24px', background: GRAY_50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="tf-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={sectionHeadingStyle}>Как это работает</h2>
            <p style={sectionSubStyle}>Три простых шага до вирусного видео</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, maxWidth: 900, margin: '0 auto' }}>
            {STEPS.map((step, i) => (
              <div key={i} className="tf-reveal" style={{ textAlign: 'center', position: 'relative', transitionDelay: `${i * 150}ms` }}>
                {i < STEPS.length - 1 && (
                  <div aria-hidden="true" className="step-connector" style={{ position: 'absolute', top: 32, left: 'calc(50% + 40px)', width: 'calc(100% - 80px)', height: 2, background: 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))' }} />
                )}
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${INDIGO_600}, ${INDIGO_500})`, color: WHITE, fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 16px rgba(79,70,229,0.25)', position: 'relative', zIndex: 2 }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: GRAY_900, margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: GRAY_500, lineHeight: 1.6, margin: 0, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WEB EDITOR ========== */}
      <section id="editor" className="tf-reveal" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="editor-grid">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: INDIGO_50, borderRadius: 50, padding: '6px 16px', marginBottom: 20 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INDIGO_600} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: INDIGO_600 }}>Веб-редактор</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', color: GRAY_900, margin: '0 0 16px', lineHeight: 1.15 }}>Полный контроль</h2>
            <p style={{ fontSize: 17, color: GRAY_500, lineHeight: 1.7, margin: '0 0 12px' }}>
              Мощный веб-редактор, который работает прямо в браузере. Не нужно скачивать ПО — просто откройте TubeForge и начните создавать.
            </p>
            <p style={{ fontSize: 17, color: GRAY_500, lineHeight: 1.7, margin: '0 0 32px' }}>
              Таймлайн, слои, эффекты, субтитры, обрезка, цветокоррекция — все инструменты профессионального редактора доступны в интуитивном интерфейсе.
            </p>
            <HoverButton
              href="/register"
              style={{ ...primaryBtnStyle, fontSize: 16, padding: '14px 32px' }}
              hoverTransform="translateY(-2px)"
              hoverBoxShadow="0 8px 32px rgba(79,70,229,0.5)"
              resetTransform="translateY(0)"
              resetBoxShadow="0 4px 24px rgba(79,70,229,0.35)"
            >
              <LightningIcon /> Попробовать редактор <span aria-hidden="true" style={{ marginLeft: 2 }}>{'\u2192'}</span>
            </HoverButton>
          </div>

          {/* Mock editor UI */}
          <div style={{ background: GRAY_900, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: `1px solid ${GRAY_800}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${GRAY_800}` }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: GRAY_400, fontWeight: 500 }}>TubeForge Editor — Мой_проект.mp4</span>
            </div>
            <div style={{ display: 'flex', height: 280 }}>
              <div style={{ width: 50, borderRight: `1px solid ${GRAY_800}`, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                {['T', '\u25A1', '\u25EF', '\u2702', '\u266A'].map((icon, idx) => (
                  <div key={idx} style={{ width: 28, height: 28, borderRadius: 6, background: idx === 0 ? 'rgba(99,102,241,0.3)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? INDIGO_500 : GRAY_500, fontSize: 13, cursor: 'default' }}>
                    {icon}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${INDIGO_600}, ${INDIGO_500})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                    <div style={{ fontSize: 11, color: GRAY_500 }}>1920 x 1080 {'\u2022'} 00:04:32</div>
                  </div>
                </div>
                <div style={{ height: 72, borderTop: `1px solid ${GRAY_800}`, padding: '8px 12px' }}>
                  <div style={{ display: 'flex', gap: 4, height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 18, borderRadius: 4, background: 'rgba(99,102,241,0.4)', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 4, top: 2, fontSize: 9, color: WHITE, fontWeight: 600 }}>Видео</div>
                      </div>
                      <div style={{ height: 18, borderRadius: 4, background: 'rgba(16,185,129,0.4)', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 4, top: 2, fontSize: 9, color: WHITE, fontWeight: 600 }}>Аудио</div>
                      </div>
                      <div style={{ height: 12, borderRadius: 4, background: 'rgba(245,158,11,0.3)', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 4, top: 1, fontSize: 8, color: WHITE, fontWeight: 600 }}>Субтитры</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== AI TOOLS GRID ========== */}
      <section id="tools" className="tf-reveal" style={{ padding: '100px 24px', background: GRAY_50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={sectionHeadingStyle}>Бесчисленные ИИ-Инструменты</h2>
            <p style={sectionSubStyle}>Все инструменты для создания контента — на одной платформе</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {TOOLS.map((tool, i) => (
              <HoverCard
                key={i}
                style={{ background: WHITE, border: `1px solid ${GRAY_100}`, borderRadius: 16, padding: 28, transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease', cursor: 'default' }}
                hoverTransform="translateY(-4px)"
                hoverBoxShadow="0 12px 40px rgba(0,0,0,0.06)"
                hoverBorderColor="rgba(99,102,241,0.3)"
                resetTransform="translateY(0)"
                resetBoxShadow="none"
                resetBorderColor={GRAY_100}
              >
                <div style={{ width: 52, height: 52, borderRadius: 12, background: INDIGO_50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {tool.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: GRAY_900, margin: '0 0 8px' }}>{tool.title}</h3>
                <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6, margin: 0 }}>{tool.desc}</p>
              </HoverCard>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SOCIAL PROOF ========== */}
      <section className="tf-reveal" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', color: GRAY_900, margin: '0 0 20px', lineHeight: 1.15 }}>
            TubeForge помогает креаторам создавать вирусный контент
          </h2>
          <p style={{ fontSize: 18, color: GRAY_500, lineHeight: 1.7, margin: '0 auto', maxWidth: 650 }}>
            Наша платформа объединяет ИИ-генерацию видео, профессиональный редактор, SEO-оптимизацию и аналитику.
            Всё, что нужно для роста на YouTube — в одном окне браузера.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { num: '2026', label: 'Год запуска' },
              { num: 'Next-Gen', label: 'ИИ-технологии' },
              { num: '99.9%', label: 'Uptime SLA' },
              { num: 'Enterprise', label: 'Безопасность' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 800, background: `linear-gradient(135deg, ${INDIGO_600}, ${INDIGO_500})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>
                  {stat.num}
                </div>
                <div style={{ fontSize: 14, color: GRAY_500, fontWeight: 500, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section style={{ padding: '100px 24px', background: GRAY_50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="tf-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={sectionHeadingStyle}>Что говорят креаторы</h2>
            <p style={sectionSubStyle}>Отзывы наших пользователей</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <HoverCard
                key={i}
                style={{ background: WHITE, borderRadius: 16, padding: 28, border: `1px solid ${GRAY_100}`, transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                hoverTransform="translateY(-3px)"
                hoverBoxShadow="0 8px 32px rgba(0,0,0,0.06)"
                resetTransform="translateY(0)"
                resetBoxShadow="none"
              >
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, si) => (
                    <svg key={si} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                <p style={{ fontSize: 15, color: GRAY_700, lineHeight: 1.65, margin: '0 0 20px' }}>
                  {'\u201C'}{t.quote}{'\u201D'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.avatar.bg, color: WHITE, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.avatar.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: GRAY_900 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: GRAY_400 }}>{t.role}</div>
                  </div>
                </div>
              </HoverCard>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="tf-reveal" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={sectionHeadingStyle}>Простые и прозрачные тарифы</h2>
            <p style={sectionSubStyle}>Начните бесплатно, масштабируйтесь когда будете готовы</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 1060, margin: '0 auto' }}>
            {PRICING_PLANS.map((plan, i) => (
              <HoverCard
                key={i}
                style={{
                  background: WHITE, borderRadius: 20, padding: 36,
                  border: plan.highlighted ? `2px solid ${INDIGO_500}` : `1px solid ${GRAY_100}`,
                  position: 'relative', transition: 'transform 0.25s ease, box-shadow 0.25s ease', overflow: 'hidden',
                }}
                hoverTransform="translateY(-4px)"
                hoverBoxShadow={plan.highlighted ? '0 16px 48px rgba(79,70,229,0.2)' : '0 12px 40px rgba(0,0,0,0.08)'}
                resetTransform="translateY(0)"
                resetBoxShadow="none"
              >
                {plan.accent && !plan.highlighted && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: plan.accent }} />
                )}
                {plan.badge && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: `linear-gradient(135deg, ${INDIGO_600}, ${INDIGO_500})`, color: WHITE, fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 50 }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontSize: 18, fontWeight: 700, color: GRAY_900, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: GRAY_500, marginBottom: 20 }}>{plan.desc}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, color: GRAY_900, letterSpacing: '-0.02em', lineHeight: 1 }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 16, color: GRAY_400, fontWeight: 500 }}>{plan.period}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((feat, fi) => (
                    <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: GRAY_700 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={plan.highlighted ? INDIGO_600 : '#22c55e'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <HoverButton
                  href={plan.highlighted ? '/register?plan=PRO' : plan.price === '0\u20BD' ? '/register' : '/register?plan=STUDIO'}
                  style={plan.highlighted ? { ...primaryBtnStyle, width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px 28px' } : { ...outlineBtnStyle, width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px 28px' }}
                  hoverTransform={plan.highlighted ? 'translateY(-2px)' : 'translateY(-1px)'}
                  hoverBoxShadow={plan.highlighted ? '0 8px 32px rgba(79,70,229,0.5)' : undefined}
                  hoverBackground={plan.highlighted ? undefined : GRAY_50}
                  resetTransform="translateY(0)"
                  resetBoxShadow={plan.highlighted ? '0 4px 24px rgba(79,70,229,0.35)' : undefined}
                  resetBackground={plan.highlighted ? undefined : WHITE}
                >
                  {plan.highlighted && <LightningIcon />}
                  {plan.highlighted ? 'Начать с Pro' : plan.price === '0\u20BD' ? 'Начать бесплатно' : 'Выбрать Studio'}
                  {plan.highlighted && <span aria-hidden="true">{'\u2192'}</span>}
                </HoverButton>
              </HoverCard>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ (client island) ========== */}
      <section id="faq" style={{ padding: '100px 24px', background: GRAY_50 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={sectionHeadingStyle}>Частые вопросы</h2>
            <p style={sectionSubStyle}>Всё, что нужно знать о TubeForge</p>
          </div>
          <FaqAccordion items={FAQ_DATA} />
        </div>
      </section>

      {/* ========== BOTTOM CTA ========== */}
      <section className="tf-reveal" style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', bottom: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', color: GRAY_900, margin: '0 0 14px', lineHeight: 1.15 }}>
            Готовы создать вирусное видео?
          </h2>
          <p style={{ fontSize: 18, color: GRAY_500, fontWeight: 400, margin: '0 0 40px', lineHeight: 1.6 }}>
            Присоединяйтесь к TubeForge и начните создавать контент, который смотрят миллионы
          </p>
          <HoverButton
            href="/register"
            style={{ ...primaryBtnStyle, fontSize: 18, padding: '16px 40px' }}
            hoverTransform="translateY(-2px)"
            hoverBoxShadow="0 8px 32px rgba(79,70,229,0.5)"
            resetTransform="translateY(0)"
            resetBoxShadow="0 4px 24px rgba(79,70,229,0.35)"
          >
            <LightningIcon /> Создать аккаунт <span aria-hidden="true">{'\u2192'}</span>
          </HoverButton>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{ borderTop: `1px solid ${GRAY_100}`, padding: '64px 24px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(4, 1fr)', gap: 40, marginBottom: 48 }} className="footer-grid">
            <div>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontWeight: 800, fontSize: 12 }}>TF</div>
                <span style={{ fontSize: 18, fontWeight: 700, color: GRAY_900 }}>TubeForge</span>
              </Link>
              <p style={{ fontSize: 14, color: GRAY_400, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 240 }}>
                ИИ-платформа для YouTube-креаторов. Создавайте, оптимизируйте и публикуйте видео быстрее.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <HoverLink href="#" ariaLabel="YouTube" style={{ color: GRAY_400, transition: 'color 0.2s' }} hoverColor={GRAY_700} resetColor={GRAY_400}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </HoverLink>
                <HoverLink href="#" ariaLabel="Telegram" style={{ color: GRAY_400, transition: 'color 0.2s' }} hoverColor={GRAY_700} resetColor={GRAY_400}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                </HoverLink>
                <HoverLink href="#" ariaLabel="Twitter" style={{ color: GRAY_400, transition: 'color 0.2s' }} hoverColor={GRAY_700} resetColor={GRAY_400}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </HoverLink>
                <HoverLink href="#" ariaLabel="ВКонтакте" style={{ color: GRAY_400, transition: 'color 0.2s' }} hoverColor={GRAY_700} resetColor={GRAY_400}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.188 1.368 1.259 2.184 1.814.617.42 1.085.328 1.085.328l2.181-.03s1.14-.071.6-.97c-.045-.074-.32-.666-1.64-1.88-1.383-1.272-1.197-1.066.468-3.27.732-.965 1.532-2.166 1.396-2.453-.128-.27-.914-.198-.914-.198l-2.455.015s-.182-.025-.317.056c-.133.08-.218.265-.218.265s-.39 1.04-.911 1.926c-1.098 1.871-1.537 1.97-1.716 1.854-.416-.272-.312-1.092-.312-1.674 0-1.82.276-2.58-.537-2.777-.27-.065-.468-.108-1.155-.115-.881-.01-1.627.003-2.05.21-.28.137-.497.443-.365.46.163.022.532.1.728.364.253.342.244 1.108.244 1.108s.145 2.14-.34 2.404c-.332.182-.787-.19-1.765-1.893-.5-.872-.878-1.836-.878-1.836s-.073-.179-.203-.275c-.158-.116-.378-.153-.378-.153l-2.334.015s-.35.01-.478.162c-.114.135-.009.414-.009.414s1.839 4.302 3.921 6.468c1.91 1.987 4.078 1.857 4.078 1.857h.983z" /></svg>
                </HoverLink>
              </div>
            </div>
            {FOOTER_COLUMNS.map((col, ci) => (
              <div key={ci}>
                <div style={{ fontSize: 14, fontWeight: 700, color: GRAY_900, marginBottom: 16, letterSpacing: '-0.01em' }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((link, li) => (
                    <HoverLink key={li} href={link.href} style={{ textDecoration: 'none', color: GRAY_400, fontSize: 14, transition: 'color 0.2s' }} hoverColor={GRAY_600} resetColor={GRAY_400}>
                      {link.label}
                    </HoverLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${GRAY_100}`, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 13, color: GRAY_400 }}>{'\u00A9'} 2026 TubeForge. Все права защищены.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {([['Условия использования', '/terms'], ['Конфиденциальность', '/privacy'], ['Cookie', '/privacy']] as const).map(([text, href], idx) => (
                <HoverLink key={idx} href={href} style={{ textDecoration: 'none', color: GRAY_400, fontSize: 13, transition: 'color 0.2s' }} hoverColor={GRAY_600} resetColor={GRAY_400}>
                  {text}
                </HoverLink>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ========== RESPONSIVE STYLES ========== */}
      <style>{`
        /* === Keyframes === */
        @keyframes tf-float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-30px); }
        }
        @keyframes tf-float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes tf-float-reverse {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-3deg); }
        }
        @keyframes tf-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes tf-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
        }
        @keyframes tf-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* === Floating background orbs === */
        .tf-float { animation: tf-float 8s ease-in-out infinite; }
        .tf-float-slow { animation: tf-float-slow 12s ease-in-out infinite; }
        .tf-float-reverse { animation: tf-float-reverse 10s ease-in-out infinite; }

        /* === Gradient text shimmer === */
        .tf-gradient-text { animation: tf-gradient-shift 4s ease infinite; }

        /* === Badge pulse === */
        .tf-badge-pulse { animation: tf-pulse 3s ease-in-out infinite 1s; }

        /* === Scroll reveal === */
        .tf-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
        }
        .tf-reveal.tf-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* === Card hover effects === */
        .tf-card-hover:hover .tf-icon-bounce {
          transform: scale(1.1) rotate(-3deg);
        }

        /* === Responsive === */
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .editor-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .step-connector { display: none !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-dropdown { display: none !important; }
        }
        a:focus-visible {
          outline: 2px solid ${INDIGO_500};
          outline-offset: 2px;
          border-radius: 4px;
        }
        ::selection {
          background: rgba(99,102,241,0.2);
        }

        /* === Smooth scrollbar === */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }

        /* === Prefers reduced motion === */
        @media (prefers-reduced-motion: reduce) {
          .tf-float, .tf-float-slow, .tf-float-reverse { animation: none; }
          .tf-gradient-text { animation: none; }
          .tf-badge-pulse { animation: none; }
          .tf-reveal { opacity: 1; transform: none; transition: none; }
        }
      `}</style>
      <ClientCookieConsent />
    </div>
  );
}
