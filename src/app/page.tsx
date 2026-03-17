'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';

/* ── Feature data ───────────────────────────────────── */

const FEATURES = [
  {
    icon: '\uD83C\uDFAC',
    title: 'Видеоредактор',
    desc: 'Создавайте видео сцена за сценой с ИИ-режиссёром. Автомонтаж, переходы, цветокоррекция и генерация контента за минуты.',
    colorKey: 'accent' as const,
  },
  {
    icon: '\uD83D\uDDBC',
    title: 'Обложки',
    desc: 'Canva-style редактор обложек с ИИ-генерацией. Анализ трендов, A/B тесты и шаблоны для максимального CTR.',
    colorKey: 'pink' as const,
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Метаданные',
    desc: 'ИИ генерирует заголовки, описания и теги, оптимизированные под SEO. Рост охватов и ранжирования на автопилоте.',
    colorKey: 'green' as const,
  },
  {
    icon: '\uD83D\uDE80',
    title: 'Публикация',
    desc: 'Публикуйте видео на YouTube прямо из платформы. Планирование, премьеры и полный контроль из одного окна.',
    colorKey: 'orange' as const,
  },
  {
    icon: '\uD83E\uDD16',
    title: 'ИИ-ассистент',
    desc: 'Искусственный интеллект помогает на каждом этапе: от идеи до публикации. Рекомендации, автозаполнение, анализ.',
    colorKey: 'purple' as const,
  },
  {
    icon: '\uD83D\uDCC8',
    title: 'Аналитика',
    desc: 'Глубокая аналитика канала: просмотры, CTR, удержание, рост подписчиков. Принимайте решения на основе данных.',
    colorKey: 'blue' as const,
  },
];

/* ── Pricing data ───────────────────────────────────── */

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'навсегда',
    desc: 'Для начинающих креаторов',
    features: [
      '3 видео в месяц',
      'Базовый ИИ-монтаж',
      '5 обложек в месяц',
      'SEO-подсказки',
      'Аналитика за 7 дней',
    ],
    cta: 'Начать бесплатно',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/мес',
    desc: 'Для активных авторов',
    features: [
      'Безлимитные видео',
      'Продвинутый ИИ-монтаж',
      'Безлимитные обложки',
      'Полная SEO-оптимизация',
      'Аналитика за 90 дней',
      'Публикация в 1 клик',
      'Приоритетная поддержка',
    ],
    cta: 'Выбрать Pro',
    href: '/register?plan=PRO',
    highlighted: true,
  },
  {
    name: 'Studio',
    price: '$49',
    period: '/мес',
    desc: 'Для команд и студий',
    features: [
      'Все из Pro',
      'До 10 участников',
      'Командные роли и доступ',
      'A/B тесты обложек',
      'API доступ',
      'Аналитика без ограничений',
      'Персональный менеджер',
      'SLA 99.9%',
    ],
    cta: 'Выбрать Studio',
    href: '/register?plan=STUDIO',
    highlighted: false,
  },
];

/* ── FAQ data ──────────────────────────────────────── */

const FAQ_ITEMS = [
  {
    q: 'Что такое TubeForge?',
    a: 'TubeForge — это ИИ-платформа для создания YouTube-контента. Мы объединяем видеоредактор, генерацию обложек, SEO-оптимизацию метаданных и аналитику в одном удобном интерфейсе.',
  },
  {
    q: 'Нужна ли кредитная карта для бесплатного плана?',
    a: 'Нет, бесплатный план не требует привязки кредитной карты. Вы можете начать пользоваться платформой сразу после регистрации.',
  },
  {
    q: 'Какие форматы видео поддерживаются?',
    a: 'Мы поддерживаем экспорт в MP4 в разрешениях Full HD (1080p) и 4K (2160p). Также доступны вертикальные форматы для Shorts.',
  },
  {
    q: 'Как работает ИИ-генерация обложек?',
    a: 'Мы используем передовые модели DALL-E и Claude для генерации обложек. Вы описываете идею, а ИИ создаёт несколько вариантов, которые можно доработать в встроенном редакторе.',
  },
  {
    q: 'Могу ли я отменить подписку?',
    a: 'Да, вы можете отменить подписку в любой момент в настройках аккаунта. После отмены вы сохраните доступ до конца оплаченного периода.',
  },
  {
    q: 'Поддерживается ли русский язык?',
    a: 'Да, платформа полностью локализована на русский язык, включая интерфейс, ИИ-генерацию контента и поддержку.',
  },
];

/* ── Main component ─────────────────────────────────── */

export default function LandingPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);
  const { status } = useSession();
  const router = useRouter();

  const [navScrolled, setNavScrolled] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  /* Scroll listener for navbar glass effect */
  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div style={{ width: '100%', height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  const getColor = (key: string) => (C as unknown as Record<string, string>)[key] ?? C.accent;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: "'Instrument Sans', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '0 20px',
          transition: 'all .3s cubic-bezier(.4,0,.2,1)',
          background: navScrolled
            ? (isDark ? 'rgba(6,6,11,.82)' : 'rgba(243,243,247,.82)')
            : 'transparent',
          backdropFilter: navScrolled ? 'blur(20px) saturate(1.8)' : 'none',
          WebkitBackdropFilter: navScrolled ? 'blur(20px) saturate(1.8)' : 'none',
          borderBottom: navScrolled ? `1px solid ${C.border}` : '1px solid transparent',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 800,
                color: '#fff',
                boxShadow: `0 4px 16px ${C.accent}44`,
              }}
            >
              TF
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>
              TubeForge
            </span>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Theme toggle */}
            <button
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}
              aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
              onClick={toggle}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.sub,
                fontSize: 15,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
            >
              {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
            </button>

            <Link
              href="/login"
              style={{
                color: C.sub,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: 10,
                transition: 'color .2s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = C.text; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = C.sub; }}
            >
              Войти
            </Link>
            <Link
              href="/register"
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                transition: 'transform .2s, box-shadow .2s',
                boxShadow: `0 2px 12px ${C.accent}33`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(-1px)';
                el.style.boxShadow = `0 4px 20px ${C.accent}55`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = `0 2px 12px ${C.accent}33`;
              }}
            >
              Начать бесплатно
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          textAlign: 'center',
          paddingTop: 160,
          paddingBottom: 120,
          paddingLeft: 20,
          paddingRight: 20,
          maxWidth: 1000,
          margin: '0 auto',
          overflow: 'visible',
        }}
      >
        {/* Background glow orbs */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 600,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${C.accent}15 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: 'landing-glow-pulse 4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            top: 80,
            right: '15%',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${C.pink}12 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: 'landing-glow-pulse 5s ease-in-out infinite 1s',
          }} />
          <div style={{
            position: 'absolute',
            top: 200,
            left: '40%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${C.purple}10 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: 'landing-glow-pulse 6s ease-in-out infinite 2s',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 18px 7px 10px',
              borderRadius: 100,
              border: `1px solid ${C.border}`,
              background: isDark ? 'rgba(17,17,25,.7)' : 'rgba(255,255,255,.7)',
              backdropFilter: 'blur(12px)',
              fontSize: 13,
              color: C.sub,
              fontWeight: 500,
              marginBottom: 36,
              animation: 'landing-fade-up .6s ease-out both',
            }}
          >
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.green,
              boxShadow: `0 0 8px ${C.green}88`,
            }} />
            Запущено в 2026 — уже в продакшене
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(40px, 7.5vw, 76px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-.04em',
              marginBottom: 28,
              animation: 'landing-fade-up .6s ease-out .1s both',
            }}
          >
            <span style={{ display: 'block', color: C.text }}>ИИ-студия для</span>
            <span
              style={{
                display: 'block',
                background: `linear-gradient(135deg, ${C.accent} 0%, ${C.pink} 40%, ${C.purple} 80%)`,
                backgroundSize: '200% 200%',
                animation: 'landing-gradient-shift 6s ease infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              YouTube-креаторов
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: C.sub,
              lineHeight: 1.7,
              maxWidth: 580,
              margin: '0 auto 44px',
              animation: 'landing-fade-up .6s ease-out .2s both',
            }}
          >
            Монтаж, обложки, SEO, аналитика и публикация — всё в одном месте. Искусственный интеллект помогает на каждом этапе создания контента.
          </p>

          {/* CTA buttons */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'landing-fade-up .6s ease-out .3s both',
            }}
          >
            <Link
              href="/register"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 32px ${C.accent}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${C.accent}33`;
              }}
              style={{
                padding: '16px 40px',
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                color: '#fff',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: `0 4px 20px ${C.accent}33`,
                transition: 'transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s cubic-bezier(.4,0,.2,1)',
              }}
            >
              Начать бесплатно
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 2 }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="#features"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.background = isDark ? 'rgba(17,17,25,.9)' : 'rgba(255,255,255,.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = isDark ? 'rgba(17,17,25,.5)' : 'rgba(255,255,255,.5)';
              }}
              style={{
                padding: '16px 36px',
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                background: isDark ? 'rgba(17,17,25,.5)' : 'rgba(255,255,255,.5)',
                backdropFilter: 'blur(12px)',
                color: C.text,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
                display: 'inline-block',
                transition: 'all .25s cubic-bezier(.4,0,.2,1)',
              }}
            >
              Узнать больше
            </Link>
          </div>

          {/* Trust signals */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 48,
              marginTop: 64,
              flexWrap: 'wrap',
              animation: 'landing-fade-up .6s ease-out .5s both',
            }}
          >
            {[
              { icon: '\u2728', label: 'ИИ нового поколения' },
              { icon: '\u26A1', label: 'Мгновенная генерация' },
              { icon: '\uD83D\uDEE1\uFE0F', label: '99.9% uptime' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{stat.icon}</span>
                <div style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature grid ────────────────────────────────── */}
      <section
        id="features"
        style={{
          padding: '80px 20px 100px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 100,
            background: C.accentDim,
            color: C.accent,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
          }}>
            Возможности
          </div>
          <h2
            style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-.03em',
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            Всё для YouTube-канала
          </h2>
          <p style={{
            fontSize: 17,
            color: C.sub,
            maxWidth: 520,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Мощные ИИ-инструменты, которые помогут вырастить канал и сэкономить часы работы
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {FEATURES.map((f, i) => {
            const color = getColor(f.colorKey);
            const isHovered = hoveredFeature === i;
            return (
              <div
                key={f.title}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  position: 'relative',
                  background: isHovered ? C.cardHover : C.surface,
                  border: `1px solid ${isHovered ? C.borderActive : C.border}`,
                  borderRadius: 20,
                  padding: '36px 32px',
                  cursor: 'default',
                  transition: 'all .3s cubic-bezier(.4,0,.2,1)',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHovered
                    ? `0 20px 40px ${isDark ? 'rgba(0,0,0,.4)' : 'rgba(0,0,0,.08)'}, 0 0 0 1px ${color}22`
                    : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Hover glow */}
                <div style={{
                  position: 'absolute',
                  top: -1,
                  left: -1,
                  right: -1,
                  height: 3,
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity .3s',
                  borderRadius: '20px 20px 0 0',
                }} />

                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: `${color}14`,
                    border: `1px solid ${color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginBottom: 22,
                    transition: 'transform .3s, box-shadow .3s',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isHovered ? `0 4px 16px ${color}22` : 'none',
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 10,
                    letterSpacing: '-.01em',
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Social proof ────────────────────────────────── */}
      <section
        id="social-proof"
        style={{
          padding: '60px 20px 80px',
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: isDark
              ? `linear-gradient(135deg, rgba(12,12,20,.8), rgba(17,17,25,.8))`
              : `linear-gradient(135deg, rgba(255,255,255,.8), rgba(238,238,243,.8))`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${C.border}`,
            borderRadius: 24,
            padding: '56px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative gradient strip */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${C.accent}, ${C.pink}, ${C.purple}, ${C.blue})`,
          }} />

          <div style={{
            fontSize: 'clamp(32px, 6vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-.04em',
            background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 12,
            animation: 'landing-counter .6s ease-out',
          }}>
            Присоединяйтесь к сообществу креаторов
          </div>
          <p style={{
            fontSize: 15,
            color: C.sub,
            maxWidth: 440,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Присоединяйтесь к растущему сообществу авторов, которые создают контент быстрее с помощью ИИ
          </p>

          {/* Avatar row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 28,
            gap: 0,
          }}>
            {[C.accent, C.pink, C.purple, C.blue, C.green].map((color, i) => (
              <div
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${color}, ${color}88)`,
                  border: `3px solid ${C.bg}`,
                  marginLeft: i === 0 ? 0 : -10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#fff',
                  fontWeight: 700,
                  zIndex: 5 - i,
                }}
              >
                {['\uD83D\uDE0A', '\uD83D\uDE80', '\uD83C\uDFAC', '\u2B50', '\uD83D\uDC4D'][i]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section
        id="pricing"
        style={{
          padding: '80px 20px 100px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 100,
            background: `${C.green}14`,
            color: C.green,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
          }}>
            Тарифы
          </div>
          <h2
            style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-.03em',
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            Простые и прозрачные цены
          </h2>
          <p style={{
            fontSize: 17,
            color: C.sub,
            maxWidth: 480,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Начните бесплатно. Переходите на Pro, когда будете готовы масштабироваться.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {PLANS.map((plan, idx) => {
            const isHovered = hoveredPlan === idx;
            const isHighlighted = plan.highlighted;
            return (
              <div
                key={plan.name}
                onMouseEnter={() => setHoveredPlan(idx)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  position: 'relative',
                  background: isHighlighted
                    ? (isDark
                        ? `linear-gradient(180deg, ${C.surface} 0%, rgba(12,12,20,.95) 100%)`
                        : `linear-gradient(180deg, ${C.surface} 0%, rgba(238,238,243,.95) 100%)`)
                    : C.surface,
                  border: `1px solid ${isHighlighted ? C.accent + '55' : (isHovered ? C.borderActive : C.border)}`,
                  borderRadius: 24,
                  padding: '40px 36px',
                  transition: 'all .3s cubic-bezier(.4,0,.2,1)',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHighlighted
                    ? `0 0 60px ${C.accent}18, 0 20px 40px ${isDark ? 'rgba(0,0,0,.3)' : 'rgba(0,0,0,.06)'}`
                    : (isHovered
                        ? `0 20px 40px ${isDark ? 'rgba(0,0,0,.3)' : 'rgba(0,0,0,.06)'}`
                        : 'none'),
                }}
              >
                {/* Top gradient bar for highlighted */}
                {isHighlighted && (
                  <div style={{
                    position: 'absolute',
                    top: -1,
                    left: 24,
                    right: 24,
                    height: 3,
                    background: `linear-gradient(90deg, ${C.accent}, ${C.pink})`,
                    borderRadius: '0 0 4px 4px',
                  }} />
                )}

                {/* Badge */}
                {isHighlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '5px 20px',
                      borderRadius: 100,
                      background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      boxShadow: `0 4px 12px ${C.accent}33`,
                      letterSpacing: '.02em',
                    }}
                  >
                    Популярный выбор
                  </div>
                )}

                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: C.sub,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  {plan.name}
                </h3>
                <p style={{ fontSize: 13, color: C.dim, marginBottom: 24 }}>{plan.desc}</p>

                <div style={{ marginBottom: 28, display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{
                    fontSize: 52,
                    fontWeight: 800,
                    letterSpacing: '-.04em',
                    lineHeight: 1,
                    background: isHighlighted
                      ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
                      : `linear-gradient(135deg, ${C.text}, ${C.sub})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 15, color: C.dim, fontWeight: 500 }}>{plan.period}</span>
                </div>

                <Link
                  href={plan.href}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    if (isHighlighted) {
                      el.style.boxShadow = `0 6px 24px ${C.accent}44`;
                      el.style.transform = 'translateY(-1px)';
                    } else {
                      el.style.borderColor = C.accent;
                      el.style.color = C.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    if (isHighlighted) {
                      el.style.boxShadow = `0 2px 12px ${C.accent}22`;
                      el.style.transform = 'translateY(0)';
                    } else {
                      el.style.borderColor = C.border;
                      el.style.color = C.text;
                    }
                  }}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '14px 24px',
                    borderRadius: 14,
                    background: isHighlighted
                      ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
                      : 'transparent',
                    border: isHighlighted ? 'none' : `1px solid ${C.border}`,
                    color: isHighlighted ? '#fff' : C.text,
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 32,
                    transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                    boxShadow: isHighlighted ? `0 2px 12px ${C.accent}22` : 'none',
                  }}
                >
                  {plan.cta}
                </Link>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {plan.features.map((feat) => (
                    <div
                      key={feat}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 14,
                        color: C.sub,
                      }}
                    >
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: isHighlighted ? `${C.accent}18` : `${C.green}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke={isHighlighted ? C.accent : C.green}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section
        id="faq"
        style={{
          padding: '80px 20px 100px',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 100,
            background: `${C.purple}14`,
            color: C.purple,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
          }}>
            Вопросы и ответы
          </div>
          <h2
            style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-.03em',
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            Часто задаваемые вопросы
          </h2>
          <p style={{
            fontSize: 17,
            color: C.sub,
            maxWidth: 480,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Не нашли ответ? Напишите нам — мы всегда на связи.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  border: `1px solid ${isOpen ? C.borderActive : C.border}`,
                  borderRadius: 16,
                  background: C.surface,
                  overflow: 'hidden',
                  transition: 'border-color .3s',
                }}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.text,
                    fontSize: 16,
                    fontWeight: 600,
                    textAlign: 'left',
                    gap: 16,
                    fontFamily: 'inherit',
                  }}
                >
                  <span>{item.q}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div
                  className="faq-answer"
                  style={{
                    maxHeight: isOpen ? 200 : 0,
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height .3s cubic-bezier(.4,0,.2,1), opacity .3s ease',
                  }}
                >
                  <p style={{
                    padding: '0 24px 20px',
                    fontSize: 15,
                    color: C.sub,
                    lineHeight: 1.7,
                  }}>
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section
        style={{
          padding: '40px 20px 100px',
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            background: isDark
              ? `linear-gradient(135deg, rgba(12,12,20,.9), rgba(17,17,25,.9))`
              : `linear-gradient(135deg, rgba(255,255,255,.9), rgba(238,238,243,.9))`,
            border: `1px solid ${C.border}`,
            borderRadius: 28,
            padding: '72px 48px',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Top gradient bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${C.accent}, ${C.pink}, ${C.purple})`,
              backgroundSize: '200% 100%',
              animation: 'landing-gradient-shift 4s ease infinite',
            }}
          />
          {/* Background glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 500,
              height: 300,
              background: `radial-gradient(ellipse, ${C.accent}10 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              style={{
                fontSize: 'clamp(28px, 5vw, 44px)',
                fontWeight: 800,
                letterSpacing: '-.03em',
                marginBottom: 16,
                lineHeight: 1.15,
              }}
            >
              Готовы создавать с ИИ?
            </h2>
            <p
              style={{
                fontSize: 17,
                color: C.sub,
                lineHeight: 1.7,
                maxWidth: 480,
                margin: '0 auto 36px',
              }}
            >
              Присоединяйтесь к креаторам, которые уже используют TubeForge для роста своих YouTube-каналов.
            </p>
            <Link
              href="/register"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 32px ${C.accent}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${C.accent}33`;
              }}
              style={{
                padding: '18px 44px',
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                color: '#fff',
                textDecoration: 'none',
                fontSize: 17,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: `0 4px 20px ${C.accent}33`,
                transition: 'all .25s cubic-bezier(.4,0,.2,1)',
              }}
            >
              Начать бесплатно
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p style={{ fontSize: 13, color: C.dim, marginTop: 20 }}>
              Не нужна кредитная карта
            </p>
          </div>
        </div>
      </section>

      {/* ── JSON-LD Structured Data ────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "TubeForge",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web",
        "offers": [
          { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
          { "@type": "Offer", "price": "19", "priceCurrency": "USD", "name": "Pro" },
          { "@type": "Offer", "price": "49", "priceCurrency": "USD", "name": "Studio" },
        ],
        "description": "ИИ-студия для YouTube-креаторов. Создавайте видео, обложки и метаданные с помощью искусственного интеллекта.",
        "url": "https://tubeforge.app",
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a,
          },
        })),
      }) }} />

      {/* ── Footer ──────────────────────────────────────── */}
      <footer
        style={{
          padding: '40px 20px',
          maxWidth: 1200,
          margin: '0 auto',
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          {/* Left: Logo + copyright */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                TF
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: C.sub }}>TubeForge</span>
            </div>
            <span style={{ fontSize: 13, color: C.dim }}>
              {'\u00A9'} {new Date().getFullYear()} Все права защищены.
            </span>
          </div>

          {/* Right: Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {[
              { href: '/privacy', label: 'Конфиденциальность' },
              { href: '/terms', label: 'Условия' },
              { href: 'https://github.com', label: 'GitHub', external: true },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onMouseEnter={(e) => setHoveredNav(link.href)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  fontSize: 13,
                  color: hoveredNav === link.href ? C.text : C.dim,
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color .2s',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
