'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore, type Locale } from '@/stores/useLocaleStore';

/* ── Translations ────────────────────────────────────────── */

const T: Record<string, Record<Locale, string>> = {
  back: { ru: 'На главную', en: 'Back to Home', kk: 'Басты бетке', es: 'Volver al inicio' },
  heroTitle: {
    ru: 'Доступ к YouTube из России',
    en: 'YouTube Access from Russia',
    kk: 'Ресейден YouTube-ге қол жеткізу',
    es: 'Acceso a YouTube desde Rusia',
  },
  heroSubtitle: {
    ru: 'Персональный VPN от TubeForge — быстрый, безопасный, без ограничений',
    en: 'Personal VPN by TubeForge — fast, secure, no restrictions',
    kk: 'TubeForge жеке VPN — жылдам, қауіпсіз, шектеусіз',
    es: 'VPN personal de TubeForge — rápido, seguro, sin restricciones',
  },
  cta: { ru: 'Получить доступ', en: 'Get Access', kk: 'Қол жеткізу', es: 'Obtener acceso' },
  howTitle: { ru: 'Как это работает', en: 'How It Works', kk: 'Қалай жұмыс істейді', es: 'Cómo funciona' },
  step1Title: { ru: 'Оформите подписку', en: 'Subscribe', kk: 'Жазылыңыз', es: 'Suscríbete' },
  step1Desc: {
    ru: 'Выберите тариф Pro или Studio для получения VPN-доступа',
    en: 'Choose Pro or Studio plan for VPN access',
    kk: 'VPN қол жеткізу үшін Pro немесе Studio жоспарын таңдаңыз',
    es: 'Elige el plan Pro o Studio para acceso VPN',
  },
  step2Title: {
    ru: 'Получите VPN-конфиг',
    en: 'Get VPN Config',
    kk: 'VPN конфигін алыңыз',
    es: 'Obtén la configuración VPN',
  },
  step2Desc: {
    ru: 'Скачайте конфигурацию в настройках аккаунта',
    en: 'Download configuration from account settings',
    kk: 'Аккаунт параметрлерінен конфигурацияны жүктеңіз',
    es: 'Descarga la configuración desde los ajustes de tu cuenta',
  },
  step3Title: {
    ru: 'Импортируйте в WireGuard',
    en: 'Import into WireGuard',
    kk: 'WireGuard-қа импорттаңыз',
    es: 'Importa en WireGuard',
  },
  step3Desc: {
    ru: 'Импортируйте в WireGuard — YouTube работает!',
    en: 'Import into WireGuard — YouTube works!',
    kk: 'WireGuard-қа импорттаңыз — YouTube жұмыс істейді!',
    es: 'Importa en WireGuard — YouTube funciona!',
  },
  featuresTitle: {
    ru: 'Возможности',
    en: 'Features',
    kk: 'Мүмкіндіктер',
    es: 'Características',
  },
  feat1: { ru: 'Серверы в Европе', en: 'Servers in Europe', kk: 'Еуропадағы серверлер', es: 'Servidores en Europa' },
  feat2: { ru: 'WireGuard шифрование', en: 'WireGuard Encryption', kk: 'WireGuard шифрлау', es: 'Cifrado WireGuard' },
  feat3: { ru: 'Высокая скорость', en: 'High Speed', kk: 'Жоғары жылдамдық', es: 'Alta velocidad' },
  feat4: {
    ru: 'Работает на всех устройствах',
    en: 'Works on All Devices',
    kk: 'Барлық құрылғыларда жұмыс істейді',
    es: 'Funciona en todos los dispositivos',
  },
  feat5: {
    ru: 'Автоматическая настройка',
    en: 'Automatic Setup',
    kk: 'Автоматты баптау',
    es: 'Configuración automática',
  },
  feat6: {
    ru: 'Включено в подписку Pro/Studio',
    en: 'Included in Pro/Studio',
    kk: 'Pro/Studio жазылымына кіреді',
    es: 'Incluido en Pro/Studio',
  },
  pricingTitle: { ru: 'Тарифы', en: 'Pricing', kk: 'Тарифтер', es: 'Precios' },
  free: { ru: 'Бесплатный', en: 'Free', kk: 'Тегін', es: 'Gratis' },
  freeDesc: {
    ru: 'VPN не включён',
    en: 'VPN not included',
    kk: 'VPN кірмейді',
    es: 'VPN no incluido',
  },
  pro: { ru: 'Pro', en: 'Pro', kk: 'Pro', es: 'Pro' },
  proPrice: { ru: '$12/мес', en: '$12/mo', kk: '$12/ай', es: '$12/mes' },
  proDesc: { ru: 'VPN включён', en: 'VPN included', kk: 'VPN кіреді', es: 'VPN incluido' },
  studio: { ru: 'Studio', en: 'Studio', kk: 'Studio', es: 'Studio' },
  studioPrice: { ru: '$30/мес', en: '$30/mo', kk: '$30/ай', es: '$30/mes' },
  studioDesc: {
    ru: 'VPN включён + приоритет',
    en: 'VPN included + priority',
    kk: 'VPN кіреді + басымдық',
    es: 'VPN incluido + prioridad',
  },
  studioFeature: {
    ru: 'Приоритетный сервер',
    en: 'Priority server',
    kk: 'Басым сервер',
    es: 'Servidor prioritario',
  },
  popular: { ru: 'Популярный', en: 'Popular', kk: 'Танымал', es: 'Popular' },
  subscribe: { ru: 'Оформить', en: 'Subscribe', kk: 'Жазылу', es: 'Suscribirse' },
  appsTitle: {
    ru: 'Совместимые приложения',
    en: 'Compatible Apps',
    kk: 'Үйлесімді қосымшалар',
    es: 'Aplicaciones compatibles',
  },
  appsDesc: {
    ru: 'Импортируйте конфигурацию в любое WireGuard-совместимое приложение',
    en: 'Import configuration into any WireGuard-compatible app',
    kk: 'Конфигурацияны кез келген WireGuard-үйлесімді қосымшаға импорттаңыз',
    es: 'Importa la configuración en cualquier app compatible con WireGuard',
  },
  faqTitle: { ru: 'Частые вопросы', en: 'FAQ', kk: 'Жиі қойылатын сұрақтар', es: 'Preguntas frecuentes' },
  faq1q: { ru: 'Это VPN?', en: 'Is this a VPN?', kk: 'Бұл VPN ме?', es: '¿Es una VPN?' },
  faq1a: {
    ru: 'Да, персональный WireGuard VPN с выделенным сервером в Европе. Ваш трафик шифруется и проходит через безопасный туннель.',
    en: 'Yes, a personal WireGuard VPN with a dedicated server in Europe. Your traffic is encrypted and routed through a secure tunnel.',
    kk: 'Иә, Еуропадағы арнайы сервері бар жеке WireGuard VPN. Сіздің трафик шифрланады және қауіпсіз туннель арқылы өтеді.',
    es: 'Sí, una VPN personal WireGuard con un servidor dedicado en Europa. Tu tráfico se cifra y se enruta a través de un túnel seguro.',
  },
  faq2q: { ru: 'Безопасно ли?', en: 'Is it secure?', kk: 'Қауіпсіз бе?', es: '¿Es seguro?' },
  faq2a: {
    ru: 'WireGuard обеспечивает современное шифрование. Ваш приватный ключ генерируется на наших серверах и доступен только вам. Мы не храним логи трафика.',
    en: 'WireGuard provides modern encryption. Your private key is generated on our servers and is only accessible to you. We do not store traffic logs.',
    kk: 'WireGuard заманауи шифрлауды қамтамасыз етеді. Сіздің жеке кілтіңіз біздің серверлерде жасалады және тек сізге қолжетімді. Біз трафик журналдарын сақтамаймыз.',
    es: 'WireGuard proporciona cifrado moderno. Tu clave privada se genera en nuestros servidores y solo tú tienes acceso. No almacenamos registros de tráfico.',
  },
  faq3q: { ru: 'Какая скорость?', en: 'What speed can I expect?', kk: 'Қандай жылдамдық?', es: '¿Qué velocidad puedo esperar?' },
  faq3a: {
    ru: 'Серверы расположены в Европе с каналом 1 Гбит/с. Реальная скорость зависит от вашего интернет-провайдера, обычно достаточно для просмотра YouTube в 4K.',
    en: 'Servers are located in Europe with 1 Gbps bandwidth. Actual speed depends on your ISP, typically sufficient for 4K YouTube streaming.',
    kk: '1 Гбит/с өткізу қабілеті бар Еуропадағы серверлер. Нақты жылдамдық сіздің провайдеріңізге байланысты, әдетте YouTube-ді 4K-де көру үшін жеткілікті.',
    es: 'Los servidores están en Europa con 1 Gbps de ancho de banda. La velocidad real depende de tu ISP, generalmente suficiente para streaming en 4K.',
  },
  faq4q: {
    ru: 'Работает с YouTube?',
    en: 'Does it work with YouTube?',
    kk: 'YouTube-мен жұмыс істей ме?',
    es: '¿Funciona con YouTube?',
  },
  faq4a: {
    ru: 'Да, и с любыми другими сервисами. VPN-туннель пропускает весь трафик, поэтому все заблокированные сайты и приложения будут работать.',
    en: 'Yes, and with any other services. The VPN tunnel routes all traffic, so all blocked sites and apps will work.',
    kk: 'Иә, және кез келген басқа қызметтермен. VPN туннелі барлық трафикті өткізеді, сондықтан барлық бұғатталған сайттар мен қосымшалар жұмыс істейді.',
    es: 'Sí, y con cualquier otro servicio. El túnel VPN enruta todo el tráfico, por lo que todos los sitios y apps bloqueados funcionarán.',
  },
  faq5q: { ru: 'Как отменить?', en: 'How to cancel?', kk: 'Қалай бас тартуға болады?', es: '¿Cómo cancelar?' },
  faq5a: {
    ru: 'В настройках аккаунта, одним кликом. VPN-конфигурация перестанет работать по окончании оплаченного периода.',
    en: 'In account settings, with one click. The VPN configuration will stop working at the end of the paid period.',
    kk: 'Аккаунт параметрлерінде, бір басу арқылы. VPN конфигурациясы ақылы кезең аяқталғаннан кейін жұмысын тоқтатады.',
    es: 'En los ajustes de tu cuenta, con un clic. La configuración VPN dejará de funcionar al final del período pagado.',
  },
  footer: {
    ru: 'TubeForge. Все права защищены.',
    en: 'TubeForge. All rights reserved.',
    kk: 'TubeForge. Барлық құқықтар қорғалған.',
    es: 'TubeForge. Todos los derechos reservados.',
  },
};

function t(key: string, locale: Locale): string {
  return T[key]?.[locale] ?? T[key]?.ru ?? key;
}

/* ── Color constants (matching landing page) ─────────────── */

const INDIGO_600 = '#4f46e5';
const INDIGO_500 = '#6366f1';
const INDIGO_50 = '#eef2ff';

/* ── FAQ Accordion Item ──────────────────────────────────── */

function FaqItem({
  question,
  answer,
  textColor,
  subColor,
  borderColor,
}: {
  question: string;
  answer: string;
  textColor: string;
  subColor: string;
  borderColor: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: `1px solid ${borderColor}`,
        padding: '20px 0',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
          color: textColor,
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'inherit',
          lineHeight: 1.5,
        }}
      >
        {question}
        <span
          style={{
            fontSize: 20,
            fontWeight: 400,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            flexShrink: 0,
            marginLeft: 16,
          }}
        >
          +
        </span>
      </button>
      {open && (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 14,
            lineHeight: 1.7,
            color: subColor,
          }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}

/* ── Main Page Component ─────────────────────────────────── */

export default function VpnPage() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const locale = useLocaleStore((s) => s.locale);

  /* Derived colors */
  const bg = isDark ? theme.bg : '#ffffff';
  const surfaceBg = isDark ? theme.surface : '#f9fafb';
  const cardBg = isDark ? theme.card : '#ffffff';
  const textColor = theme.text;
  const subColor = theme.sub;
  const dimColor = theme.dim;
  const borderColor = theme.border;
  const accentGradient = `linear-gradient(135deg, ${INDIGO_600}, ${INDIGO_500})`;

  const sectionStyle: CSSProperties = {
    padding: '80px 24px',
    maxWidth: 1100,
    margin: '0 auto',
  };

  const headingStyle: CSSProperties = {
    fontSize: 'clamp(24px, 3.5vw, 36px)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: textColor,
    margin: '0 0 12px',
    textAlign: 'center',
  };

  const subheadingStyle: CSSProperties = {
    fontSize: 16,
    color: subColor,
    fontWeight: 400,
    margin: '0 0 48px',
    textAlign: 'center',
    lineHeight: 1.6,
  };

  /* ── Steps data ──────────────────────────────────────────── */

  const steps = [
    { num: '1', title: t('step1Title', locale), desc: t('step1Desc', locale), icon: '\uD83D\uDCCB' },
    { num: '2', title: t('step2Title', locale), desc: t('step2Desc', locale), icon: '\u2B07\uFE0F' },
    { num: '3', title: t('step3Title', locale), desc: t('step3Desc', locale), icon: '\u2705' },
  ];

  /* ── Features data ───────────────────────────────────────── */

  const features: { icon: string; label: string }[] = [
    { icon: '\uD83C\uDDEA\uD83C\uDDFA', label: t('feat1', locale) },
    { icon: '\uD83D\uDD12', label: t('feat2', locale) },
    { icon: '\u26A1', label: t('feat3', locale) },
    { icon: '\uD83D\uDCF1', label: t('feat4', locale) },
    { icon: '\uD83D\uDD04', label: t('feat5', locale) },
    { icon: '\uD83D\uDCB0', label: t('feat6', locale) },
  ];

  /* ── Pricing data ────────────────────────────────────────── */

  const plans = [
    {
      name: t('free', locale),
      price: '0\u20BD',
      period: '',
      desc: t('freeDesc', locale),
      features: [] as string[],
      highlighted: false,
      accent: null as string | null,
      badge: null as string | null,
      href: '/register',
    },
    {
      name: t('pro', locale),
      price: t('proPrice', locale),
      period: '',
      desc: t('proDesc', locale),
      features: ['WireGuard VPN', t('feat1', locale), t('feat3', locale)],
      highlighted: true,
      accent: accentGradient,
      badge: t('popular', locale),
      href: '/billing',
    },
    {
      name: t('studio', locale),
      price: t('studioPrice', locale),
      period: '',
      desc: t('studioDesc', locale),
      features: ['WireGuard VPN', t('feat1', locale), t('feat3', locale), t('studioFeature', locale)],
      highlighted: false,
      accent: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
      badge: null,
      href: '/billing',
    },
  ];

  /* ── FAQ data ────────────────────────────────────────────── */

  const faqItems = [
    { q: t('faq1q', locale), a: t('faq1a', locale) },
    { q: t('faq2q', locale), a: t('faq2a', locale) },
    { q: t('faq3q', locale), a: t('faq3a', locale) },
    { q: t('faq4q', locale), a: t('faq4a', locale) },
    { q: t('faq5q', locale), a: t('faq5a', locale) },
  ];

  /* ── Compatible apps ──────────────────────────────────────── */

  const apps = [
    { name: 'WireGuard', desc: 'iOS, Android, Windows, macOS, Linux' },
    { name: 'AmneziaVPN', desc: 'iOS, Android, Windows, macOS' },
    { name: 'WG Tunnel', desc: 'Android' },
  ];

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: bg,
        color: textColor,
        fontFamily: "'Inter', 'Instrument Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── JSON-LD ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />

      {/* ── Back nav ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 0' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: subColor,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 18 }}>{'\u2190'}</span>
          {t('back', locale)}
        </Link>
      </div>

      {/* ═══════ HERO ═══════ */}
      <section
        style={{
          padding: '80px 24px 60px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient orb */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: isDark ? 'rgba(99,102,241,0.12)' : INDIGO_50,
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 50,
              padding: '8px 20px',
              marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 16 }}>{'\uD83D\uDD12'}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: INDIGO_500 }}>WireGuard VPN</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              margin: '0 0 20px',
              color: textColor,
            }}
          >
            {t('heroTitle', locale)}
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: subColor,
              lineHeight: 1.6,
              maxWidth: 600,
              margin: '0 auto 36px',
              fontWeight: 400,
            }}
          >
            {t('heroSubtitle', locale)}
          </p>

          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: '#ffffff',
              fontSize: 17,
              fontWeight: 700,
              padding: '14px 40px',
              borderRadius: 50,
              background: accentGradient,
              boxShadow: '0 4px 24px rgba(79,70,229,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: 'none',
            }}
          >
            {t('cta', locale)}
          </Link>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section style={{ ...sectionStyle, paddingTop: 40 }}>
        <h2 style={headingStyle}>{t('howTitle', locale)}</h2>
        <p style={subheadingStyle}>{'\u00A0'}</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 16,
                padding: '32px 28px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: accentGradient,
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                {step.num}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: textColor,
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: subColor, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FEATURES GRID ═══════ */}
      <section style={{ ...sectionStyle, paddingTop: 40 }}>
        <h2 style={headingStyle}>{t('featuresTitle', locale)}</h2>
        <p style={subheadingStyle}>{'\u00A0'}</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
          }}
        >
          {features.map((feat, i) => (
            <div
              key={i}
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 16,
                padding: '28px 24px',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{feat.icon}</div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: textColor,
                  margin: 0,
                }}
              >
                {feat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section
        style={{
          ...sectionStyle,
          paddingTop: 60,
          paddingBottom: 60,
          background: surfaceBg,
          maxWidth: 'none',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={headingStyle}>{t('pricingTitle', locale)}</h2>
          <p style={subheadingStyle}>{'\u00A0'}</p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
              maxWidth: 960,
              margin: '0 auto',
            }}
          >
            {plans.map((plan, i) => (
              <div
                key={i}
                style={{
                  background: cardBg,
                  border: plan.highlighted
                    ? '2px solid ' + INDIGO_500
                    : `1px solid ${borderColor}`,
                  borderRadius: 20,
                  padding: '36px 28px',
                  position: 'relative',
                  textAlign: 'center',
                  boxShadow: plan.highlighted
                    ? '0 8px 32px rgba(79,70,229,0.15)'
                    : 'none',
                }}
              >
                {plan.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: accentGradient,
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 16px',
                      borderRadius: 50,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    margin: '0 0 4px',
                    color: textColor,
                  }}
                >
                  {plan.name}
                </h3>

                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: plan.highlighted ? INDIGO_500 : textColor,
                    margin: '12px 0 4px',
                  }}
                >
                  {plan.price}
                </div>

                <p
                  style={{
                    fontSize: 14,
                    color: subColor,
                    margin: '0 0 20px',
                    fontWeight: 500,
                  }}
                >
                  {plan.desc}
                </p>

                {plan.features.length > 0 && (
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 24px',
                      textAlign: 'left',
                    }}
                  >
                    {plan.features.map((f, j) => (
                      <li
                        key={j}
                        style={{
                          fontSize: 14,
                          color: subColor,
                          padding: '6px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ color: '#16a34a', fontSize: 14, fontWeight: 700 }}>
                          {'\u2713'}
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={plan.href}
                  style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                    color: plan.highlighted ? '#ffffff' : textColor,
                    fontSize: 15,
                    fontWeight: 700,
                    padding: '12px 32px',
                    borderRadius: 50,
                    background: plan.highlighted
                      ? accentGradient
                      : 'transparent',
                    border: plan.highlighted
                      ? 'none'
                      : `1px solid ${borderColor}`,
                    transition: 'transform 0.2s',
                  }}
                >
                  {t('subscribe', locale)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ COMPATIBLE APPS ═══════ */}
      <section style={sectionStyle}>
        <h2 style={headingStyle}>{t('appsTitle', locale)}</h2>
        <p style={subheadingStyle}>{t('appsDesc', locale)}</p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          {apps.map((app, i) => (
            <div
              key={i}
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 16,
                padding: '24px 32px',
                textAlign: 'center',
                minWidth: 180,
              }}
            >
              {/* App icon placeholder */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: isDark
                    ? 'rgba(99,102,241,0.12)'
                    : INDIGO_50,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  fontSize: 24,
                }}
              >
                {/* WireGuard shield icon */}
                {'\uD83D\uDEE1\uFE0F'}
              </div>
              <h4
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: '0 0 4px',
                  color: textColor,
                }}
              >
                {app.name}
              </h4>
              <p
                style={{
                  fontSize: 13,
                  color: dimColor,
                  margin: 0,
                }}
              >
                {app.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section
        style={{
          ...sectionStyle,
          paddingTop: 60,
          paddingBottom: 80,
          background: surfaceBg,
          maxWidth: 'none',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={headingStyle}>{t('faqTitle', locale)}</h2>
          <div style={{ marginTop: 32 }}>
            {faqItems.map((item, i) => (
              <FaqItem
                key={i}
                question={item.q}
                answer={item.a}
                textColor={textColor}
                subColor={subColor}
                borderColor={borderColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ BOTTOM CTA ═══════ */}
      <section
        style={{
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 800,
            color: textColor,
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}
        >
          {t('heroTitle', locale)}
        </h2>
        <p
          style={{
            fontSize: 16,
            color: subColor,
            margin: '0 0 32px',
            lineHeight: 1.6,
          }}
        >
          {t('heroSubtitle', locale)}
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: '#ffffff',
            fontSize: 17,
            fontWeight: 700,
            padding: '14px 40px',
            borderRadius: 50,
            background: accentGradient,
            boxShadow: '0 4px 24px rgba(79,70,229,0.35)',
            border: 'none',
          }}
        >
          {t('cta', locale)}
        </Link>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px',
          fontSize: 13,
          color: dimColor,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        {'\u00A9'} {new Date().getFullYear()} {t('footer', locale)}
      </div>
    </main>
  );
}
