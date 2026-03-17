import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';

const C = {
  bg: '#0a0a0f',
  surface: '#12121a',
  card: '#111119',
  border: '#1e1e2e',
  text: '#e4e4e7',
  sub: '#7c7c96',
  dim: '#44445a',
  accent: '#6366f1',
  pink: '#ec4899',
};

const features = [
  {
    icon: '\u25B6',
    title: 'ИИ-видеоредактор',
    desc: 'Умный монтаж с помощью нейросети. Автоматическая нарезка, переходы и цветокоррекция за минуты.',
    color: C.accent,
  },
  {
    icon: '\u25AB',
    title: 'Умные обложки',
    desc: 'Генерация кликабельных обложек на основе анализа трендов и лучших практик YouTube.',
    color: C.pink,
  },
  {
    icon: '\u270E',
    title: 'SEO-метаданные',
    desc: 'Оптимизация заголовков, описаний и тегов для максимального охвата и ранжирования.',
    color: '#2dd4a0',
  },
  {
    icon: '\u25CE',
    title: 'Аналитика YouTube',
    desc: 'Глубокая аналитика канала: просмотры, CTR, удержание аудитории и рост подписчиков.',
    color: '#3a7bfd',
  },
  {
    icon: '\u2B06',
    title: 'Публикация в 1 клик',
    desc: 'Публикуйте видео на YouTube прямо из платформы. Планирование, премьеры и A/B тесты.',
    color: '#f59e0b',
  },
  {
    icon: '\u2B50',
    title: 'Командная работа',
    desc: 'Совместная работа с командой. Роли, комментарии и согласование контента в одном месте.',
    color: '#8b5cf6',
  },
];

const plans = [
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

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 40px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            Y
          </div>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.02em' }}>
            TubeForge
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link
            href="/login"
            style={{
              color: C.sub,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Войти
          </Link>
          <Link
            href="/register"
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Начать бесплатно
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          textAlign: 'center',
          padding: '100px 20px 80px',
          maxWidth: 900,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 400,
            background: `radial-gradient(ellipse at center, ${C.accent}22 0%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 20,
              border: `1px solid ${C.border}`,
              background: C.surface,
              fontSize: 13,
              color: C.sub,
              marginBottom: 32,
              fontWeight: 500,
            }}
          >
            ИИ-студия для YouTube
          </div>
          <h1
            style={{
              fontSize: 'clamp(36px, 8vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-.03em',
              marginBottom: 24,
              whiteSpace: 'pre-line',
              background: `linear-gradient(135deg, ${C.text} 0%, ${C.accent} 50%, ${C.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {'Создавайте.\nОптимизируйте.\nПубликуйте.'}
          </h1>
          <p
            style={{
              fontSize: 18,
              color: C.sub,
              lineHeight: 1.7,
              maxWidth: 600,
              margin: '0 auto 40px',
            }}
          >
            Платформа для YouTube-креаторов с искусственным интеллектом. Монтаж, обложки, SEO и
            аналитика — всё в одном месте. Создавайте контент быстрее и качественнее.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/register"
              style={{
                padding: '16px 36px',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                color: '#fff',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 700,
                display: 'inline-block',
              }}
            >
              Начать бесплатно
            </Link>
            <Link
              href="#features"
              style={{
                padding: '16px 36px',
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Узнать больше
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          padding: '80px 20px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: '-.02em',
              marginBottom: 16,
            }}
          >
            Всё для YouTube-канала
          </h2>
          <p style={{ fontSize: 16, color: C.sub, maxWidth: 500, margin: '0 auto' }}>
            Мощные ИИ-инструменты, которые помогут вырастить канал и сэкономить часы работы
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 32,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${f.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  marginBottom: 20,
                  color: f.color,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section
        style={{
          padding: '80px 20px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: '-.02em',
              marginBottom: 16,
            }}
          >
            Простые тарифы
          </h2>
          <p style={{ fontSize: 16, color: C.sub, maxWidth: 500, margin: '0 auto' }}>
            Начните бесплатно. Переходите на Pro, когда будете готовы масштабироваться.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: C.surface,
                border: `1px solid ${plan.highlighted ? C.accent : C.border}`,
                borderRadius: 20,
                padding: 36,
                position: 'relative',
                ...(plan.highlighted
                  ? {
                      boxShadow: `0 0 40px ${C.accent}22`,
                    }
                  : {}),
              }}
            >
              {plan.highlighted && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 16px',
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Популярный
                </div>
              )}
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {plan.name}
              </h3>
              <p style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>{plan.desc}</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-.03em' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 14, color: C.sub, marginLeft: 4 }}>{plan.period}</span>
              </div>
              <Link
                href={plan.href}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '14px 24px',
                  borderRadius: 12,
                  background: plan.highlighted
                    ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
                    : C.card,
                  border: plan.highlighted ? 'none' : `1px solid ${C.border}`,
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  marginBottom: 28,
                }}
              >
                {plan.cta}
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map((feat) => (
                  <div
                    key={feat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 14,
                      color: C.sub,
                    }}
                  >
                    <span
                      style={{
                        color: C.accent,
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {'\u2713'}
                    </span>
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '80px 20px 100px',
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 24,
            padding: '64px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, ${C.accent}, ${C.pink}, ${C.accent})`,
            }}
          />
          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: '-.02em',
              marginBottom: 16,
            }}
          >
            Готовы создавать с ИИ?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: C.sub,
              lineHeight: 1.7,
              maxWidth: 500,
              margin: '0 auto 32px',
            }}
          >
            Присоединяйтесь к тысячам креаторов, которые уже используют TubeForge для роста своих
            YouTube-каналов.
          </p>
          <Link
            href="/register"
            style={{
              padding: '16px 40px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 700,
              display: 'inline-block',
            }}
          >
            Начать бесплатно
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '40px 20px',
          maxWidth: 1100,
          margin: '0 auto',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <p style={{ fontSize: 13, color: C.dim }}>
          {'\u00A9'} {new Date().getFullYear()} TubeForge. Все права защищены.
        </p>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link
            href="/privacy"
            style={{ fontSize: 13, color: C.dim, textDecoration: 'none' }}
          >
            Конфиденциальность
          </Link>
          <Link
            href="/terms"
            style={{ fontSize: 13, color: C.dim, textDecoration: 'none' }}
          >
            Условия
          </Link>
        </div>
      </footer>
    </div>
  );
}
