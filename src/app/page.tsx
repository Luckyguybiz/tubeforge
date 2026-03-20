'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, type CSSProperties, type ReactNode } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import type { Theme } from '@/lib/types';

/* ── Bilingual content ────────────────────────────────────── */

const i18n = {
  ru: {
    nav: {
      features: 'Возможности',
      tools: 'Инструменты',
      pricing: 'Тарифы',
      faq: 'FAQ',
      login: 'Войти',
      startFree: 'Начать бесплатно',
    },
    hero: {
      badge: 'Все инструменты в одном месте',
      h1Line1: 'Все инструменты для',
      h1Highlight: 'YouTube-блогера',
      h1Line2: 'в одном месте',
      sub: 'Скачивание видео, AI-генерация, VPN, SEO, превью и реферальная программа. Начните бесплатно за 30 секунд.',
      cta: 'Начать бесплатно',
      ctaSecondary: 'Узнать больше',
      trustFree: 'Бесплатный старт',
      trustNoCard: 'Не нужна карта',
      trustCancel: 'Отмена в любой момент',
    },
    features: {
      heading: 'Все возможности для роста канала',
      sub: '6 ключевых направлений — одна платформа',
      items: [
        {
          title: 'Скачивание видео',
          desc: 'Скачивайте видео с YouTube, TikTok и других платформ в любом качестве — до 4K.',
        },
        {
          title: 'AI-инструменты',
          desc: 'Генерация текстов, аналитика контента, идеи для видео с помощью 10+ AI-провайдеров.',
        },
        {
          title: 'VPN для YouTube',
          desc: 'WireGuard VPN для стабильного доступа к YouTube из России. Быстрый и безопасный.',
        },
        {
          title: 'Создание превью',
          desc: 'Профессиональный редактор обложек с AI-генерацией и шаблонами в стиле Canva.',
        },
        {
          title: 'SEO оптимизация',
          desc: 'Автоматическая генерация заголовков, описаний и тегов для максимального охвата.',
        },
        {
          title: 'Реферальная программа',
          desc: 'Приглашайте друзей и получайте бонусы. 20% от оплат приглашённых пользователей.',
        },
      ],
    },
    stats: {
      heading: 'Платформа, которой доверяют',
      sub: 'Цифры говорят сами за себя',
      items: [
        { num: '1000+', label: 'инструментов' },
        { num: '10+', label: 'AI-провайдеров' },
        { num: 'WireGuard', label: 'VPN протокол' },
        { num: '0 ₽', label: 'Бесплатный старт' },
      ],
    },
    pricing: {
      heading: 'Простые и прозрачные тарифы',
      sub: 'Начните бесплатно, масштабируйтесь когда готовы',
      plans: [
        {
          name: 'FREE',
          price: '0₽',
          period: '',
          desc: 'Для знакомства с платформой',
          features: [
            '3 скачивания в день',
            'Базовый AI-редактор',
            'Генерация обложек',
            'SEO-оптимизация',
            '1 ГБ хранилища',
          ],
          cta: 'Выбрать',
        },
        {
          name: 'PRO',
          price: '990₽',
          period: '/мес',
          desc: 'Для активных креаторов',
          features: [
            'Безлимит скачиваний',
            'Все AI-инструменты',
            'VPN для YouTube',
            'Безлимит обложек',
            'A/B тесты обложек',
            '50 ГБ хранилища',
            'Приоритетная поддержка',
          ],
          cta: 'Выбрать',
        },
        {
          name: 'STUDIO',
          price: '2490₽',
          period: '/мес',
          desc: 'Для команд и агентств',
          features: [
            'Все PRO-функции',
            'Командная работа до 10 чел.',
            'API-доступ',
            '500 ГБ хранилища',
            'Брендированные шаблоны',
            'Выделенная поддержка',
            'Мульти-канальность',
          ],
          cta: 'Выбрать',
        },
      ],
    },
    faq: {
      heading: 'Частые вопросы',
      sub: 'Всё, что нужно знать о TubeForge',
      items: [
        {
          q: 'Что такое TubeForge?',
          a: 'TubeForge — это платформа для YouTube-блогеров, объединяющая скачивание видео, AI-инструменты, VPN, редактор обложек, SEO-оптимизацию и реферальную программу в одном месте.',
        },
        {
          q: 'Действительно ли есть бесплатный тариф?',
          a: 'Да, бесплатный тариф включает 3 скачивания в день, базовый AI-редактор, генерацию обложек и SEO-оптимизацию. Кредитная карта не требуется.',
        },
        {
          q: 'Как работает VPN для YouTube?',
          a: 'Мы используем протокол WireGuard — самый быстрый и безопасный VPN-протокол. После подключения вы получаете стабильный доступ к YouTube из России без ограничений скорости.',
        },
        {
          q: 'Какие AI-провайдеры поддерживаются?',
          a: 'TubeForge интегрирован с 10+ AI-провайдерами, включая OpenAI, Anthropic, Google и другие. Вы можете генерировать тексты, идеи, аналитику и визуальный контент.',
        },
        {
          q: 'Как работает реферальная программа?',
          a: 'Поделитесь своей уникальной ссылкой с друзьями. Вы получите 20% от каждого платежа приглашённого пользователя. Выплаты — ежемесячно без минимальной суммы.',
        },
        {
          q: 'Могу ли я отменить подписку в любой момент?',
          a: 'Да, вы можете отменить подписку в любое время из настроек аккаунта. Доступ к оплаченным функциям сохраняется до конца оплаченного периода.',
        },
      ],
    },
    footerCta: {
      heading: 'Готовы начать?',
      sub: 'Присоединяйтесь к TubeForge и получите все инструменты для роста вашего канала',
      cta: 'Создать аккаунт бесплатно',
    },
    footer: {
      desc: 'Платформа для YouTube-блогеров. Все инструменты для создания и продвижения контента.',
      cols: [
        {
          title: 'Продукт',
          links: [
            { label: 'Возможности', href: '#features' },
            { label: 'Тарифы', href: '#pricing' },
            { label: 'AI-Инструменты', href: '#tools' },
            { label: 'VPN', href: '/vpn' },
          ],
        },
        {
          title: 'Юридическое',
          links: [
            { label: 'Условия использования', href: '/terms' },
            { label: 'Конфиденциальность', href: '/privacy' },
            { label: 'Возврат средств', href: 'mailto:support@tubeforge.co' },
          ],
        },
        {
          title: 'Соцсети',
          links: [
            { label: 'YouTube', href: 'https://youtube.com/@tubeforge' },
            { label: 'Telegram', href: 'https://t.me/tubeforge' },
            { label: 'Twitter / X', href: 'https://twitter.com/tubeforge' },
          ],
        },
      ],
      copy: '© 2026 TubeForge. Все права защищены.',
      terms: 'Условия использования',
      privacy: 'Конфиденциальность',
    },
  },
  en: {
    nav: {
      features: 'Features',
      tools: 'Tools',
      pricing: 'Pricing',
      faq: 'FAQ',
      login: 'Sign in',
      startFree: 'Start free',
    },
    hero: {
      badge: 'All tools in one place',
      h1Line1: 'All the tools a',
      h1Highlight: 'YouTube creator',
      h1Line2: 'needs — in one place',
      sub: 'Video downloading, AI generation, VPN, SEO, thumbnails, and referral program. Start free in 30 seconds.',
      cta: 'Start free',
      ctaSecondary: 'Learn more',
      trustFree: 'Free to start',
      trustNoCard: 'No credit card',
      trustCancel: 'Cancel anytime',
    },
    features: {
      heading: 'Everything you need to grow',
      sub: '6 key directions — one platform',
      items: [
        {
          title: 'Video Download',
          desc: 'Download videos from YouTube, TikTok, and other platforms in any quality — up to 4K.',
        },
        {
          title: 'AI Tools',
          desc: 'Text generation, content analytics, video ideas powered by 10+ AI providers.',
        },
        {
          title: 'VPN for YouTube',
          desc: 'WireGuard VPN for stable YouTube access from Russia. Fast and secure.',
        },
        {
          title: 'Thumbnail Creator',
          desc: 'Professional thumbnail editor with AI generation and Canva-like templates.',
        },
        {
          title: 'SEO Optimization',
          desc: 'Auto-generate titles, descriptions, and tags for maximum reach.',
        },
        {
          title: 'Referral Program',
          desc: 'Invite friends and earn bonuses. 20% of payments from referred users.',
        },
      ],
    },
    stats: {
      heading: 'A platform you can trust',
      sub: 'The numbers speak for themselves',
      items: [
        { num: '1000+', label: 'tools' },
        { num: '10+', label: 'AI providers' },
        { num: 'WireGuard', label: 'VPN protocol' },
        { num: '$0', label: 'Free to start' },
      ],
    },
    pricing: {
      heading: 'Simple, transparent pricing',
      sub: 'Start free, scale when ready',
      plans: [
        {
          name: 'FREE',
          price: '$0',
          period: '',
          desc: 'Get to know the platform',
          features: [
            '3 downloads per day',
            'Basic AI editor',
            'Thumbnail generation',
            'SEO optimization',
            '1 GB storage',
          ],
          cta: 'Choose',
        },
        {
          name: 'PRO',
          price: '$12',
          period: '/mo',
          desc: 'For active creators',
          features: [
            'Unlimited downloads',
            'All AI tools',
            'VPN for YouTube',
            'Unlimited thumbnails',
            'A/B thumbnail tests',
            '50 GB storage',
            'Priority support',
          ],
          cta: 'Choose',
        },
        {
          name: 'STUDIO',
          price: '$29',
          period: '/mo',
          desc: 'For teams and agencies',
          features: [
            'All PRO features',
            'Team up to 10 people',
            'API access',
            '500 GB storage',
            'Branded templates',
            'Dedicated support',
            'Multi-channel',
          ],
          cta: 'Choose',
        },
      ],
    },
    faq: {
      heading: 'FAQ',
      sub: 'Everything you need to know about TubeForge',
      items: [
        {
          q: 'What is TubeForge?',
          a: 'TubeForge is a platform for YouTube creators that combines video downloading, AI tools, VPN, thumbnail editor, SEO optimization, and a referral program in one place.',
        },
        {
          q: 'Is there really a free plan?',
          a: 'Yes, the free plan includes 3 downloads per day, basic AI editor, thumbnail generation, and SEO optimization. No credit card required.',
        },
        {
          q: 'How does the YouTube VPN work?',
          a: 'We use WireGuard protocol — the fastest and most secure VPN protocol. After connecting, you get stable YouTube access from Russia with no speed limits.',
        },
        {
          q: 'Which AI providers are supported?',
          a: 'TubeForge integrates with 10+ AI providers, including OpenAI, Anthropic, Google, and more. You can generate text, ideas, analytics, and visual content.',
        },
        {
          q: 'How does the referral program work?',
          a: 'Share your unique link with friends. You earn 20% of every payment from referred users. Payouts are monthly with no minimum amount.',
        },
        {
          q: 'Can I cancel my subscription anytime?',
          a: 'Yes, you can cancel anytime from your account settings. Access to paid features continues until the end of the billing period.',
        },
      ],
    },
    footerCta: {
      heading: 'Ready to get started?',
      sub: 'Join TubeForge and get all the tools to grow your channel',
      cta: 'Create free account',
    },
    footer: {
      desc: 'Platform for YouTube creators. All tools for content creation and promotion.',
      cols: [
        {
          title: 'Product',
          links: [
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'AI Tools', href: '#tools' },
            { label: 'VPN', href: '/vpn' },
          ],
        },
        {
          title: 'Legal',
          links: [
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Refunds', href: 'mailto:support@tubeforge.co' },
          ],
        },
        {
          title: 'Social',
          links: [
            { label: 'YouTube', href: 'https://youtube.com/@tubeforge' },
            { label: 'Telegram', href: 'https://t.me/tubeforge' },
            { label: 'Twitter / X', href: 'https://twitter.com/tubeforge' },
          ],
        },
      ],
      copy: '\u00A9 2026 TubeForge. All rights reserved.',
      terms: 'Terms of Service',
      privacy: 'Privacy',
    },
  },
} as const;

type Lang = keyof typeof i18n;

/* ── Feature icons (SVG) ──────────────────────────────────── */

const FEATURE_ICONS = [
  /* Download */
  (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  /* AI */
  (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  /* VPN / Shield */
  (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  /* Thumbnail / Image */
  (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  /* SEO / Chart */
  (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  /* Referral / Users */
  (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
];

const FEATURE_BG_COLORS = ['#eef2ff', '#fdf2f8', '#ecfdf5', '#fff7ed', '#eff6ff', '#fef3c7'];

/* ── Shared icon ──────────────────────────────────────────── */

const LightningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8.5 1L3 9H7.5L7 15L13 7H8.5L8.5 1Z" fill="currentColor" />
  </svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDown = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── FAQ Accordion (inline, no separate component needed) ── */

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
  theme,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
  theme: Theme;
}) {
  return (
    <div
      style={{
        background: theme.surface,
        borderRadius: 14,
        border: `1px solid ${isOpen ? theme.accent : theme.border}`,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '20px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{q}</span>
        <span
          style={{
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'flex',
          }}
        >
          <ChevronDown color={theme.dim} />
        </span>
      </button>
      <div
        style={{
          maxHeight: isOpen ? 300 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, padding 0.3s ease',
          padding: isOpen ? '0 24px 20px' : '0 24px 0',
        }}
      >
        <p style={{ fontSize: 15, color: theme.sub, lineHeight: 1.65, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */

export default function LandingPage() {
  const { theme, isDark } = useThemeStore();
  const locale = useLocaleStore((s) => s.locale);
  const lang: Lang = locale === 'en' ? 'en' : 'ru';
  const t = i18n[lang];

  /* Scroll state for header */
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* Scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Hero entrance */
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /* Scroll reveal */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('tf-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' },
    );
    document.querySelectorAll('.tf-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Smooth scroll */
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  /* Hover helpers */
  const hoverIn = useCallback(
    (e: React.MouseEvent<HTMLElement>, transform?: string, shadow?: string, bg?: string) => {
      if (transform) e.currentTarget.style.transform = transform;
      if (shadow) e.currentTarget.style.boxShadow = shadow;
      if (bg) e.currentTarget.style.background = bg;
    },
    [],
  );
  const hoverOut = useCallback(
    (e: React.MouseEvent<HTMLElement>, transform?: string, shadow?: string, bg?: string) => {
      if (transform) e.currentTarget.style.transform = transform;
      if (shadow) e.currentTarget.style.boxShadow = shadow;
      if (bg) e.currentTarget.style.background = bg;
    },
    [],
  );

  /* ── Derived colors ── */
  const ACCENT = theme.accent;
  const ACCENT_BG = isDark ? 'rgba(99,102,241,0.12)' : '#eef2ff';
  const SECTION_ALT_BG = isDark ? theme.surface : '#f9fafb';
  const CARD_BORDER = theme.border;

  /* ── Style builders ── */
  const primaryBtn: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 700,
    padding: '14px 36px',
    borderRadius: 50,
    background: `linear-gradient(135deg, #4f46e5, #6366f1)`,
    boxShadow: '0 4px 24px rgba(79,70,229,0.35)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const outlineBtn: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    color: theme.text,
    fontSize: 17,
    fontWeight: 700,
    padding: '14px 36px',
    borderRadius: 50,
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    transition: 'background 0.2s, transform 0.2s',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const sectionHeading: CSSProperties = {
    fontSize: 'clamp(28px, 4vw, 44px)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: theme.text,
    margin: '0 0 14px',
    lineHeight: 1.15,
  };

  const sectionSub: CSSProperties = {
    fontSize: 18,
    color: theme.sub,
    fontWeight: 400,
    margin: 0,
    lineHeight: 1.6,
  };

  const navLinks = [
    { label: t.nav.features, href: '#features' },
    { label: t.nav.tools, href: '#tools' },
    { label: t.nav.pricing, href: '#pricing' },
    { label: t.nav.faq, href: '#faq' },
  ];

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        minHeight: '100vh',
      }}
    >
      {/* ========== JSON-LD ========== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'TubeForge',
            description: lang === 'ru'
              ? 'Платформа для YouTube-блогеров: скачивание видео, AI-инструменты, VPN, SEO, превью.'
              : 'Platform for YouTube creators: video downloading, AI tools, VPN, SEO, thumbnails.',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web',
            url: 'https://tubeforge.co',
            offers: [
              { '@type': 'Offer', price: '0', priceCurrency: 'RUB', name: 'Free' },
              { '@type': 'Offer', price: '990', priceCurrency: 'RUB', name: 'Pro' },
              { '@type': 'Offer', price: '2490', priceCurrency: 'RUB', name: 'Studio' },
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
            mainEntity: t.faq.items.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />

      {/* ========== HEADER ========== */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled
            ? (isDark ? 'rgba(6,6,11,0.92)' : 'rgba(255,255,255,0.92)')
            : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled
            ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
            : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: -0.5 }}>
              TF
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>TubeForge</span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{ textDecoration: 'none', color: theme.sub, fontSize: 15, fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = theme.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = theme.sub; }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{ textDecoration: 'none', color: theme.sub, fontSize: 15, fontWeight: 500, padding: '8px 16px', transition: 'color 0.2s' }}>
              {t.nav.login}
            </Link>
            <Link
              href="/register"
              style={{ ...primaryBtn, fontSize: 15, padding: '10px 24px' }}
              onMouseEnter={(e) => hoverIn(e, 'translateY(-2px)', '0 8px 32px rgba(79,70,229,0.5)')}
              onMouseLeave={(e) => hoverOut(e, 'translateY(0)', '0 4px 24px rgba(79,70,229,0.35)')}
            >
              <LightningIcon /> {t.nav.startFree}
            </Link>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="mobile-menu-dropdown"
            style={{
              background: theme.surface,
              borderTop: `1px solid ${theme.border}`,
              padding: '16px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ textDecoration: 'none', color: theme.text, fontSize: 16, fontWeight: 500, padding: '8px 0' }}
              >
                {link.label}
              </a>
            ))}
            <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/login" style={{ textDecoration: 'none', color: theme.text, fontSize: 16, fontWeight: 500, padding: '8px 0' }}>
                {t.nav.login}
              </Link>
              <Link href="/register" style={{ ...primaryBtn, fontSize: 16, padding: '12px 24px', justifyContent: 'center' }}>
                <LightningIcon /> {t.nav.startFree}
              </Link>
            </div>
          </div>
        )}
      </header>

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

        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '0 24px',
            position: 'relative',
            zIndex: 1,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s cubic-bezier(.4,0,.2,1), transform 0.8s cubic-bezier(.4,0,.2,1)',
          }}
        >
          {/* Badge */}
          <div
            className="tf-badge-pulse"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: ACCENT_BG, border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
              borderRadius: 50, padding: '8px 20px', marginBottom: 32,
            }}
          >
            <LightningIcon />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#6366f1' }}>{t.hero.badge}</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 24px', color: theme.text,
          }}>
            {t.hero.h1Line1}<br />
            <span
              className="tf-gradient-text"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1, #ec4899, #4f46e5)',
                backgroundSize: '300% 100%',
                color: '#fff',
                padding: '4px 20px',
                borderRadius: 14,
                margin: '8px 0',
              }}
            >
              {t.hero.h1Highlight}
            </span><br />
            {t.hero.h1Line2}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)', color: theme.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 40px', fontWeight: 400,
          }}>
            {t.hero.sub}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{ ...primaryBtn, fontSize: 18, padding: '16px 40px' }}
              onMouseEnter={(e) => hoverIn(e, 'translateY(-2px)', '0 8px 32px rgba(79,70,229,0.5)')}
              onMouseLeave={(e) => hoverOut(e, 'translateY(0)', '0 4px 24px rgba(79,70,229,0.35)')}
            >
              <LightningIcon /> {t.hero.cta}
            </Link>
            <a
              href="#features"
              style={{ ...outlineBtn, fontSize: 18, padding: '16px 40px' }}
              onMouseEnter={(e) => hoverIn(e, 'translateY(-2px)', undefined, isDark ? theme.card : '#f9fafb')}
              onMouseLeave={(e) => hoverOut(e, 'translateY(0)', undefined, theme.surface)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              {t.hero.ctaSecondary}
            </a>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 56, flexWrap: 'wrap' }}>
            {[t.hero.trustFree, t.hero.trustNoCard, t.hero.trustCancel].map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{ fontSize: 14, color: theme.sub, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES (6 items) ========== */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="tf-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={sectionHeading}>{t.features.heading}</h2>
          <p style={sectionSub}>{t.features.sub}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {t.features.items.map((feature, i) => (
            <div
              key={i}
              className="tf-reveal tf-card-hover"
              style={{
                background: theme.surface,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: 20,
                padding: 32,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                cursor: 'default',
                transitionDelay: `${i * 80}ms`,
              }}
              onMouseEnter={(e) => hoverIn(e, 'translateY(-6px) scale(1.02)', '0 16px 48px rgba(0,0,0,0.1)')}
              onMouseLeave={(e) => hoverOut(e, 'translateY(0) scale(1)', 'none')}
            >
              <div
                className="tf-icon-bounce"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: isDark ? 'rgba(99,102,241,0.12)' : FEATURE_BG_COLORS[i] ?? '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  transition: 'transform 0.3s ease',
                }}
              >
                {FEATURE_ICONS[i]?.('#6366f1')}
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: theme.text, margin: '0 0 10px', letterSpacing: '-0.01em' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: 15, color: theme.sub, lineHeight: 1.6, margin: 0 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== STATS / SOCIAL PROOF ========== */}
      <section id="tools" className="tf-reveal" style={{ padding: '100px 24px', background: SECTION_ALT_BG }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={sectionHeading}>{t.stats.heading}</h2>
          <p style={{ ...sectionSub, marginBottom: 56 }}>{t.stats.sub}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {t.stats.items.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 120 }}>
                <div
                  style={{
                    fontSize: stat.num.length > 6 ? 28 : 36,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.2,
                  }}
                >
                  {stat.num}
                </div>
                <div style={{ fontSize: 14, color: theme.sub, fontWeight: 500, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="tf-reveal" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={sectionHeading}>{t.pricing.heading}</h2>
            <p style={sectionSub}>{t.pricing.sub}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 1060, margin: '0 auto' }}>
            {t.pricing.plans.map((plan, i) => {
              const isPro = i === 1;
              const isStudio = i === 2;
              const planParam = isPro ? '?plan=PRO' : isStudio ? '?plan=STUDIO' : '';
              return (
                <div
                  key={i}
                  style={{
                    background: theme.surface,
                    borderRadius: 20,
                    padding: 36,
                    border: isPro ? '2px solid #6366f1' : `1px solid ${CARD_BORDER}`,
                    position: 'relative',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => hoverIn(e, 'translateY(-4px)', isPro ? '0 16px 48px rgba(79,70,229,0.2)' : '0 12px 40px rgba(0,0,0,0.08)')}
                  onMouseLeave={(e) => hoverOut(e, 'translateY(0)', 'none')}
                >
                  {isStudio && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }} />
                  )}
                  {isPro && (
                    <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 50 }}>
                      {lang === 'ru' ? 'Популярный' : 'Popular'}
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: theme.sub, marginBottom: 20 }}>{plan.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                    <span style={{ fontSize: 44, fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: 16, color: theme.dim, fontWeight: 500 }}>{plan.period}</span>}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {plan.features.map((feat, fi) => (
                      <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: theme.text }}>
                        <CheckIcon color={isPro ? '#6366f1' : '#22c55e'} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/billing${planParam}`}
                    style={
                      isPro
                        ? { ...primaryBtn, width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px 28px' }
                        : { ...outlineBtn, width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px 28px' }
                    }
                    onMouseEnter={(e) =>
                      hoverIn(
                        e,
                        isPro ? 'translateY(-2px)' : 'translateY(-1px)',
                        isPro ? '0 8px 32px rgba(79,70,229,0.5)' : undefined,
                        isPro ? undefined : (isDark ? theme.card : '#f9fafb'),
                      )
                    }
                    onMouseLeave={(e) =>
                      hoverOut(
                        e,
                        'translateY(0)',
                        isPro ? '0 4px 24px rgba(79,70,229,0.35)' : undefined,
                        isPro ? undefined : theme.surface,
                      )
                    }
                  >
                    {isPro && <LightningIcon />}
                    {plan.cta}
                    {isPro && <span aria-hidden="true">{'\u2192'}</span>}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section id="faq" className="tf-reveal" style={{ padding: '100px 24px', background: SECTION_ALT_BG }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={sectionHeading}>{t.faq.heading}</h2>
            <p style={sectionSub}>{t.faq.sub}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t.faq.items.map((item, i) => (
              <FaqItem
                key={i}
                q={item.q}
                a={item.a}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq((prev) => (prev === i ? null : i))}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========== FOOTER CTA ========== */}
      <section className="tf-reveal" style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: -200, left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', color: theme.text, margin: '0 0 14px', lineHeight: 1.15 }}>
            {t.footerCta.heading}
          </h2>
          <p style={{ fontSize: 18, color: theme.sub, fontWeight: 400, margin: '0 0 40px', lineHeight: 1.6 }}>
            {t.footerCta.sub}
          </p>
          <Link
            href="/register"
            style={{ ...primaryBtn, fontSize: 18, padding: '16px 40px' }}
            onMouseEnter={(e) => hoverIn(e, 'translateY(-2px)', '0 8px 32px rgba(79,70,229,0.5)')}
            onMouseLeave={(e) => hoverOut(e, 'translateY(0)', '0 4px 24px rgba(79,70,229,0.35)')}
          >
            <LightningIcon /> {t.footerCta.cta} <span aria-hidden="true">{'\u2192'}</span>
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{ borderTop: `1px solid ${theme.border}`, padding: '64px 24px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(3, 1fr)', gap: 40, marginBottom: 48 }} className="footer-grid">
            <div>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>TF</div>
                <span style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>TubeForge</span>
              </Link>
              <p style={{ fontSize: 14, color: theme.dim, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 240 }}>
                {t.footer.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {[
                  {
                    label: 'YouTube',
                    href: 'https://youtube.com/@tubeforge',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
                  },
                  {
                    label: 'Telegram',
                    href: 'https://t.me/tubeforge',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>,
                  },
                  {
                    label: 'Twitter',
                    href: 'https://twitter.com/tubeforge',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
                  },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    style={{ color: theme.dim, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.dim; }}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
            {t.footer.cols.map((col, ci) => (
              <div key={ci}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 16, letterSpacing: '-0.01em' }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((link, li) => {
                    const isExternal = link.href.startsWith('http') || link.href.startsWith('mailto:');
                    return (
                      <a
                        key={li}
                        href={link.href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        style={{ textDecoration: 'none', color: theme.dim, fontSize: 14, transition: 'color 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = theme.sub; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = theme.dim; }}
                      >
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 13, color: theme.dim }}>{t.footer.copy}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {[
                [t.footer.terms, '/terms'],
                [t.footer.privacy, '/privacy'],
              ].map(([text, href], idx) => (
                <a
                  key={idx}
                  href={href}
                  style={{ textDecoration: 'none', color: theme.dim, fontSize: 13, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.sub; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.dim; }}
                >
                  {text}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ========== STYLES ========== */}
      <style>{`
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

        .tf-float { animation: tf-float 8s ease-in-out infinite; }
        .tf-float-slow { animation: tf-float-slow 12s ease-in-out infinite; }
        .tf-float-reverse { animation: tf-float-reverse 10s ease-in-out infinite; }
        .tf-gradient-text { animation: tf-gradient-shift 4s ease infinite; }
        .tf-badge-pulse { animation: tf-pulse 3s ease-in-out infinite 1s; }

        .tf-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
        }
        .tf-reveal.tf-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .tf-card-hover:hover .tf-icon-bounce {
          transform: scale(1.1) rotate(-3deg);
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-dropdown { display: none !important; }
        }

        a:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
          border-radius: 4px;
        }
        ::selection {
          background: rgba(99,102,241,0.2);
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }

        @media (prefers-reduced-motion: reduce) {
          .tf-float, .tf-float-slow, .tf-float-reverse { animation: none; }
          .tf-gradient-text { animation: none; }
          .tf-badge-pulse { animation: none; }
          .tf-reveal { opacity: 1; transform: none; transition: none; }
        }
      `}</style>
    </div>
  );
}
