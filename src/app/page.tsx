import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  LandingNav,
  LandingHero,
  ScrollRevealProvider,
  FaqAccordion,
  ClientCookieConsent,
} from "@/components/landing";

/* ── SEO Metadata ─────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "TubeForge — ИИ-студия для YouTube",
  description:
    "ИИ-платформа для YouTube-креаторов. Видеоредактор, генерация обложек, оптимизация метаданных, VPN, аналитика.",
  openGraph: {
    title: "TubeForge — ИИ-студия для YouTube",
    description:
      "Создавайте профессиональный YouTube-контент с ИИ. Генерация обложек, оптимизация метаданных, видеомонтаж.",
    type: "website",
    locale: "ru_RU",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "TubeForge" }],
  },
  alternates: { canonical: "https://tubeforge.co" },
  twitter: {
    card: "summary_large_image",
    title: "TubeForge — ИИ-студия для YouTube",
    description: "Создавайте профессиональный YouTube-контент с ИИ.",
    images: ["/api/og"],
  },
};

/* ── Data ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "download",
    title: "Скачивание видео",
    desc: "YouTube, TikTok, Instagram — скачивайте в любом качестве до 4K. Конвертируйте в MP3 и сжимайте видео.",
  },
  {
    icon: "ai",
    title: "ИИ-генерация",
    desc: "10+ ИИ-провайдеров: генерация текстов, идей, скриптов и визуального контента для вашего канала.",
  },
  {
    icon: "shield",
    title: "VPN для YouTube",
    desc: "WireGuard VPN — молниеносный и безопасный доступ к YouTube из России без ограничений.",
  },
  {
    icon: "image",
    title: "Дизайн обложек",
    desc: "Профессиональный редактор в стиле Canva с ИИ-генерацией и A/B тестированием превью.",
  },
  {
    icon: "chart",
    title: "SEO и аналитика",
    desc: "Оптимизация заголовков, описаний, тегов. YouTube, Shorts и TikTok аналитика в реальном времени.",
  },
  {
    icon: "users",
    title: "Команда и рефералы",
    desc: "Совместная работа до 10 человек. Реферальная программа: 20% от оплат приглашённых.",
  },
];

const FEATURE_ICONS: Record<string, React.JSX.Element> = {
  download: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ai: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
  shield: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  image: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  chart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  users: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

const TOOLS = [
  { title: "YouTube Downloader", desc: "Скачивание видео с YouTube в любом качестве" },
  { title: "MP3 Конвертер", desc: "Извлечение аудио из любого видео" },
  { title: "Компрессор видео", desc: "Сжатие без потери качества" },
  { title: "ИИ-редактор текстов", desc: "Генерация описаний и скриптов" },
  { title: "Генератор обложек", desc: "ИИ-дизайн превью для видео" },
  { title: "SEO-анализатор", desc: "Оптимизация метаданных канала" },
  { title: "YouTube аналитика", desc: "Статистика и рост канала" },
  { title: "Shorts аналитика", desc: "Метрики коротких видео" },
];

const STATS = [
  { value: "2026", label: "запущено" },
  { value: "Next-Gen", label: "ИИ-технологии" },
  { value: "99.9%", label: "uptime" },
  { value: "EU", label: "защита данных" },
];

const PLANS = [
  {
    name: "Free",
    price: "0₽",
    period: "",
    desc: "Для знакомства с платформой",
    features: [
      "3 скачивания в день",
      "Базовый ИИ-редактор",
      "Генерация обложек",
      "SEO-оптимизация",
      "1 ГБ хранилища",
    ],
    popular: false,
    href: "/register",
  },
  {
    name: "Pro",
    price: "990₽",
    period: "/мес",
    desc: "Для активных креаторов",
    features: [
      "Безлимит скачиваний",
      "Все ИИ-инструменты",
      "VPN для YouTube",
      "Безлимит обложек",
      "A/B тесты обложек",
      "50 ГБ хранилища",
      "Приоритетная поддержка",
    ],
    popular: true,
    href: "/billing?plan=PRO",
  },
  {
    name: "Studio",
    price: "2490₽",
    period: "/мес",
    desc: "Для команд и агентств",
    features: [
      "Все Pro-функции",
      "Команда до 10 человек",
      "API-доступ",
      "500 ГБ хранилища",
      "Брендированные шаблоны",
      "Выделенная поддержка",
      "Мульти-канальность",
    ],
    popular: false,
    href: "/billing?plan=STUDIO",
  },
];

const FAQ_ITEMS = [
  {
    q: "Что такое TubeForge?",
    a: "TubeForge — это ИИ-платформа для YouTube-креаторов, объединяющая скачивание видео, ИИ-инструменты, VPN, редактор обложек, SEO-оптимизацию и реферальную программу в одном месте.",
  },
  {
    q: "Нужно ли платить?",
    a: "Нет, есть бесплатный тариф: 3 скачивания в день, базовый ИИ-редактор, генерация обложек и SEO-оптимизация. Кредитная карта не требуется. Тариф Pro открывает безлимит и расширенные функции.",
  },
  {
    q: "Какие форматы видео поддерживаются?",
    a: "Скачивание и экспорт в формате MP4 с поддержкой нескольких разрешений — от 360p до 4K. Также доступна конвертация в MP3 для извлечения аудио.",
  },
  {
    q: "Как работает ИИ-генерация?",
    a: "TubeForge интегрирован с 10+ ИИ-провайдерами (OpenAI, Anthropic, Google и др.). ИИ анализирует ваш контент и генерирует оптимизированные заголовки, описания, скрипты и визуальный контент.",
  },
  {
    q: "Могу ли я отменить подписку?",
    a: "Да, отмена в любое время из настроек аккаунта — без вопросов и скрытых условий. Доступ к оплаченным функциям сохраняется до конца оплаченного периода.",
  },
  {
    q: "Безопасны ли мои данные?",
    a: "Да. Серверы расположены в ЕС, все данные шифруются при передаче и хранении. Мы соблюдаем требования GDPR и не передаём персональные данные третьим лицам.",
  },
  {
    q: "Есть ли API?",
    a: "Да, API-доступ доступен на тарифе Studio. Вы можете интегрировать инструменты TubeForge в свои приложения и автоматизировать рабочие процессы.",
  },
];

/* ── JSON-LD Structured Data ──────────────────────────────── */

const PAGE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TubeForge",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  url: "https://tubeforge.co",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "RUB",
  },
  description:
    "AI-powered video creation platform for YouTube creators",
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

/* ── Page (React Server Component) ────────────────────────── */

export default function LandingPage() {
  return (
    <div style={{ background: "#0a0a0a", color: "#ffffff", minHeight: "100vh", fontFamily: "var(--font-sans), system-ui, -apple-system, sans-serif" }}>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <ScrollRevealProvider />
      <LandingNav />
      <LandingHero />

      {/* ===== STATS BAR ===== */}
      <section
        className="tf-reveal"
        style={{
          padding: "48px 24px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
          className="stats-grid"
        >
          {STATS.map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(135deg, #818cf8, #6366f1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.2,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 500,
                  marginTop: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section
        id="features"
        style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 72 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#818cf8",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            Возможности
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: "0 0 16px",
              color: "#ffffff",
            }}
          >
            Всё для роста вашего канала
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 560,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Шесть ключевых направлений — одна платформа
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="tf-reveal tf-feature-card"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20,
                padding: "36px 32px",
                transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Hover glow */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)",
                  opacity: 0,
                  transition: "opacity 0.4s ease",
                }}
                className="tf-card-glow"
              />
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                {FEATURE_ICONS[feature.icon]}
              </div>
              <h3
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: "#ffffff",
                  margin: "0 0 10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TOOLS SHOWCASE ===== */}
      <section
        id="tools"
        style={{
          padding: "120px 24px",
          background: "rgba(255,255,255,0.015)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 72 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Инструменты
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              Бесплатные инструменты
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.45)",
                maxWidth: 500,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Используйте прямо сейчас — без регистрации
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {TOOLS.map((tool, i) => (
              <div
                key={i}
                className="tf-reveal tf-tool-card"
                style={{
                  padding: "24px 28px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#ffffff",
                    marginBottom: 6,
                  }}
                >
                  {tool.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.35)",
                    lineHeight: 1.5,
                  }}
                >
                  {tool.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" style={{ padding: "120px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 72 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Тарифы
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              Простые и прозрачные цены
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.45)",
                maxWidth: 480,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Начните бесплатно, масштабируйтесь когда готовы
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
              maxWidth: 1060,
              margin: "0 auto",
            }}
          >
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className="tf-reveal tf-pricing-card"
                style={{
                  background: plan.popular
                    ? "rgba(99,102,241,0.06)"
                    : "rgba(255,255,255,0.02)",
                  borderRadius: 24,
                  padding: "40px 36px",
                  border: plan.popular
                    ? "1px solid rgba(99,102,241,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  position: "relative",
                  transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                  overflow: "hidden",
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background:
                        "linear-gradient(90deg, #6366f1, #a78bfa, #6366f1)",
                    }}
                  />
                )}
                {plan.popular && (
                  <span
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: 50,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Популярный
                  </span>
                )}
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: 4,
                  }}
                >
                  {plan.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 24,
                  }}
                >
                  {plan.desc}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    marginBottom: 32,
                  }}
                >
                  <span
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: "#ffffff",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      style={{
                        fontSize: 16,
                        color: "rgba(255,255,255,0.35)",
                        fontWeight: 500,
                      }}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 36px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {plan.features.map((feat, fi) => (
                    <li
                      key={fi}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={plan.popular ? "#818cf8" : "#4ade80"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0, marginTop: 2 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={plan.popular ? "tf-cta-primary" : "tf-cta-secondary"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    padding: "14px 28px",
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                    ...(plan.popular
                      ? {
                          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                          color: "#fff",
                          border: "none",
                          boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                        }
                      : {
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(255,255,255,0.7)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }),
                  }}
                >
                  {plan.popular && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8.5 1L3 9H7.5L7 15L13 7H8.5L8.5 1Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  Выбрать
                  {plan.popular && <span aria-hidden="true">{"\u2192"}</span>}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section
        style={{
          padding: "120px 24px",
          background: "rgba(255,255,255,0.015)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 72 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Отзывы
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Что говорят креаторы
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                name: "Алексей М.",
                role: "150K подписчиков",
                text: "TubeForge заменил мне 5 отдельных сервисов. Обложки, SEO, аналитика — всё в одном месте. Экономлю минимум 3 часа в неделю.",
              },
              {
                name: "Марина К.",
                role: "YouTube-блогер",
                text: "VPN работает безупречно — YouTube грузится мгновенно. А ИИ-генератор описаний просто волшебный, каждое видео выходит в топ.",
              },
              {
                name: "Дмитрий Р.",
                role: "Продакшн-студия",
                text: "Взяли Studio-тариф для команды из 8 человек. API-доступ и совместная работа — именно то, что нам было нужно. Рекомендую.",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="tf-reveal"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 20,
                  padding: "36px 32px",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                  {[...Array(5)].map((_, si) => (
                    <svg
                      key={si}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#818cf8"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 15,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.7,
                    margin: "0 0 24px",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#ffffff",
                    }}
                  >
                    {testimonial.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.35)",
                      marginTop: 2,
                    }}
                  >
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" style={{ padding: "120px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              FAQ
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              Частые вопросы
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.45)",
                maxWidth: 480,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Всё, что нужно знать о TubeForge
            </p>
          </div>
          <div className="tf-reveal">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section
        className="tf-reveal"
        style={{
          padding: "120px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}
          >
            Готовы начать?
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.45)",
              margin: "0 0 40px",
              lineHeight: 1.6,
            }}
          >
            Присоединяйтесь к TubeForge и получите все инструменты для роста
            вашего канала
          </p>
          <Link
            href="/register"
            className="tf-cta-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              fontSize: 18,
              fontWeight: 600,
              padding: "18px 44px",
              borderRadius: 14,
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
              boxShadow:
                "0 4px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            Создать аккаунт бесплатно
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "64px 24px 40px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr repeat(3, 1fr)",
              gap: 40,
              marginBottom: 48,
            }}
            className="footer-grid"
          >
            {/* Brand */}
            <div>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  TF
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#ffffff" }}>
                  TubeForge
                </span>
              </Link>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.3)",
                  lineHeight: 1.6,
                  margin: "0 0 20px",
                  maxWidth: 260,
                }}
              >
                Платформа для YouTube-блогеров. Все инструменты для создания и
                продвижения контента.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <a
                  href="https://youtube.com/@tubeforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  href="https://t.me/tubeforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/tubeforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
            {/* Columns */}
            {[
              {
                title: "Продукт",
                links: [
                  { label: "Возможности", href: "#features" },
                  { label: "Тарифы", href: "#pricing" },
                  { label: "Инструменты", href: "#tools" },
                  { label: "VPN", href: "/vpn" },
                ],
              },
              {
                title: "Юридическое",
                links: [
                  { label: "Условия использования", href: "/terms" },
                  { label: "Конфиденциальность", href: "/privacy" },
                  {
                    label: "Возврат средств",
                    href: "mailto:support@tubeforge.co",
                  },
                ],
              },
              {
                title: "Соцсети",
                links: [
                  { label: "YouTube", href: "https://youtube.com/@tubeforge" },
                  { label: "Telegram", href: "https://t.me/tubeforge" },
                  { label: "Twitter / X", href: "https://twitter.com/tubeforge" },
                ],
              },
            ].map((col, ci) => (
              <div key={ci}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 16,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {col.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {col.links.map((link, li) => {
                    const isExternal =
                      link.href.startsWith("http") ||
                      link.href.startsWith("mailto:");
                    return (
                      <a
                        key={li}
                        href={link.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        style={{
                          textDecoration: "none",
                          color: "rgba(255,255,255,0.3)",
                          fontSize: 14,
                          transition: "color 0.2s",
                        }}
                      >
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
              {"\u00A9"} 2026 TubeForge. Все права защищены.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <a
                href="/terms"
                style={{
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 13,
                  transition: "color 0.2s",
                }}
              >
                Условия использования
              </a>
              <a
                href="/privacy"
                style={{
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 13,
                  transition: "color 0.2s",
                }}
              >
                Конфиденциальность
              </a>
            </div>
          </div>
        </div>
      </footer>

      <ClientCookieConsent />

      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        @keyframes tf-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes tf-float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(2deg); }
        }
        @keyframes tf-float-reverse {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-2deg); }
        }

        .tf-float-slow { animation: tf-float-slow 14s ease-in-out infinite; }
        .tf-float-reverse { animation: tf-float-reverse 12s ease-in-out infinite; }

        .tf-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.8s cubic-bezier(.4,0,.2,1), transform 0.8s cubic-bezier(.4,0,.2,1);
        }
        .tf-reveal.tf-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Feature card hover */
        .tf-feature-card:hover {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(99,102,241,0.2) !important;
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .tf-feature-card:hover .tf-card-glow {
          opacity: 1 !important;
        }

        /* Tool card hover */
        .tf-tool-card:hover {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.1) !important;
          transform: translateY(-2px);
        }

        /* Pricing card hover */
        .tf-pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        /* CTA hover states */
        .tf-cta-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 40px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15) !important;
        }
        .tf-cta-secondary:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.2) !important;
          color: #ffffff !important;
        }

        /* Footer link hovers */
        footer a:hover {
          color: rgba(255,255,255,0.7) !important;
        }

        /* Stats grid responsive */
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px !important;
          }
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

        /* Focus styles */
        a:focus-visible, button:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
          border-radius: 4px;
        }

        /* Selection */
        ::selection {
          background: rgba(99,102,241,0.3);
          color: #ffffff;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .tf-float-slow, .tf-float-reverse { animation: none; }
          .tf-reveal { opacity: 1; transform: none; transition: none; }
          * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
