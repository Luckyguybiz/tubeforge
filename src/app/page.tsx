import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  LandingNav,
  LandingHero,
  ScrollRevealProvider,
  FaqAccordion,
  ClientCookieConsent,
  StickyMobileCTA,
  ReferralCapture,
  NewsletterForm,
  DashboardMockup,
  AnalyzerMockup,
  PricingSection,
} from "@/components/landing";

/* ── SEO Metadata ─────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "TubeForge — AI Studio for YouTube Creators",
  description:
    "AI-powered platform for YouTube creators. Video editor, thumbnail generator, metadata optimizer, VPN, analytics, and free tools.",
  openGraph: {
    title: "TubeForge — AI Studio for YouTube Creators",
    description:
      "Create professional YouTube content with AI. Thumbnail generation, metadata optimization, video editing, analytics.",
    type: "website",
    locale: "ru_RU",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "TubeForge — AI Studio for YouTube Creators" }],
  },
  alternates: { canonical: "https://tubeforge.co" },
  twitter: {
    card: "summary_large_image",
    title: "TubeForge — AI Studio for YouTube Creators",
    description: "Create professional YouTube content with AI. Thumbnails, SEO, video editing, and free tools.",
    images: ["/api/og"],
  },
};

/* ── Data ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "search",
    title: "Video Analyzer",
    desc: "Analyze any YouTube video — SEO scores, engagement metrics, title optimization, and actionable suggestions.",
  },
  {
    icon: "ai",
    title: "AI Generation",
    desc: "10+ AI providers: generate scripts, ideas, descriptions, and visual content for your channel.",
  },
  {
    icon: "shield",
    title: "VPN for YouTube",
    desc: "WireGuard VPN — lightning-fast and secure access to YouTube without restrictions.",
  },
  {
    icon: "image",
    title: "Thumbnail Designer",
    desc: "Professional Canva-style editor with AI generation and A/B testing for thumbnails.",
  },
  {
    icon: "chart",
    title: "SEO & Analytics",
    desc: "Optimize titles, descriptions, and tags. YouTube, Shorts, and TikTok analytics in real time.",
  },
  {
    icon: "users",
    title: "Teams & Referrals",
    desc: "Collaborate with up to 10 team members. Referral program: earn 20% from invited users.",
  },
];

const FEATURE_ICONS: Record<string, React.JSX.Element> = {
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
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
  { title: "YouTube Video Analyzer", desc: "SEO scores, engagement metrics & optimization tips" },
  { title: "MP3 Converter", desc: "Extract audio from any video" },
  { title: "Video Compressor", desc: "Compress without losing quality" },
  { title: "AI Text Editor", desc: "Generate descriptions and scripts" },
  { title: "Thumbnail Generator", desc: "AI-powered thumbnail design" },
  { title: "SEO Analyzer", desc: "Optimize your channel metadata" },
  { title: "YouTube Analytics", desc: "Channel stats and growth tracking" },
  { title: "Shorts Analytics", desc: "Short-form video metrics" },
];

const STATS = [
  { value: "10K+", label: "creators" },
  { value: "Next-Gen", label: "AI technology" },
  { value: "99.9%", label: "uptime" },
  { value: "EU", label: "data protection" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Describe Your Idea",
    desc: "Tell the AI what video you want to create — topic, style, and target audience. The AI understands context.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    step: "2",
    title: "AI Creates Content",
    desc: "The platform generates scripts, thumbnails, descriptions, and tags — all optimized for YouTube.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    step: "3",
    title: "Publish to YouTube",
    desc: "Your content is ready — upload to your channel and watch your views grow in real time.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    name: "Alex M.",
    role: "YouTuber, 150K subscribers",
    text: "TubeForge completely replaced 5 separate tools for me. Thumbnails, SEO, analytics \u2014 all in one place. I save at least 3 hours every week.",
  },
  {
    name: "Sarah K.",
    role: "Content Marketer",
    text: "The AI description generator is magical \u2014 every video with optimized tags gets more views. I recommend it to all marketers!",
  },
  {
    name: "David R.",
    role: "Full-time Creator",
    text: "The VPN works flawlessly, and team collaboration on the Studio plan is exactly what my team needed. Best platform for creators!",
  },
];

const COMPARISON_FEATURES = [
  "AI Video Generation",
  "YouTube Integration",
  "Free Plan",
  "Built-in VPN",
  "Team Collaboration",
  "Templates",
] as const;

type ComparisonEntry = { name: string; values: boolean[] };

const COMPARISON_DATA: ComparisonEntry[] = [
  { name: "TubeForge", values: [true, true, true, true, true, true] },
  { name: "Canva", values: [false, false, true, false, true, true] },
  { name: "CapCut", values: [true, false, true, false, false, true] },
  { name: "InVideo", values: [true, false, false, false, false, true] },
];

const TARGET_AUDIENCE = [
  {
    title: "YouTube Creators",
    desc: "Professional tools for channel growth and AI-powered content optimization.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    title: "Marketers",
    desc: "Quickly create video content for ad campaigns and social media.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: "Agencies",
    desc: "Team collaboration, API access, and multi-channel management for scaling production.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Educators",
    desc: "Create educational videos and online courses with AI \u2014 no special skills required.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Get started with the platform",
    features: [
      "3 video analyses per day",
      "Basic AI editor",
      "Thumbnail generation",
      "SEO optimization",
      "1 GB storage",
    ],
    popular: false,
    href: "/register",
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For active creators",
    features: [
      "Unlimited video analyses",
      "All AI tools",
      "VPN for YouTube",
      "Unlimited thumbnails",
      "A/B thumbnail testing",
      "50 GB storage",
      "Priority support",
    ],
    popular: true,
    href: "/billing?plan=PRO",
  },
  {
    name: "Studio",
    price: "$30",
    period: "/mo",
    desc: "For teams and agencies",
    features: [
      "All Pro features",
      "Team up to 10 members",
      "API access",
      "500 GB storage",
      "Branded templates",
      "Dedicated support",
      "Multi-channel management",
    ],
    popular: false,
    href: "/billing?plan=STUDIO",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is TubeForge?",
    a: "TubeForge is an AI-powered platform for YouTube creators that combines video analysis, AI tools, VPN, thumbnail editor, SEO optimization, and a referral program \u2014 all in one place.",
  },
  {
    q: "Do I need to pay?",
    a: "No, there is a free plan with 3 video analyses per day, a basic AI editor, thumbnail generation, and SEO optimization. No credit card required. The Pro plan unlocks unlimited access and advanced features.",
  },
  {
    q: "What video formats are supported?",
    a: "Export in MP4 with multiple resolutions \u2014 from 360p to 4K. MP3 conversion is also available for audio extraction. The Video Analyzer helps you optimize titles and metadata.",
  },
  {
    q: "How does AI generation work?",
    a: "TubeForge integrates with 10+ AI providers (OpenAI, Anthropic, Google, and more). The AI analyzes your content and generates optimized titles, descriptions, scripts, and visual content.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, cancel anytime from your account settings \u2014 no questions asked, no hidden conditions. Access to paid features remains until the end of your billing period.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Our servers are located in the EU, and all data is encrypted in transit and at rest. We comply with GDPR and never share personal data with third parties.",
  },
  {
    q: "Is there an API?",
    a: "Yes, API access is available on the Studio plan. You can integrate TubeForge tools into your applications and automate workflows.",
  },
];

/* ── JSON-LD Structured Data ──────────────────────────────── */

/* SoftwareApplication JSON-LD is defined in layout.tsx — single source of truth */

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <Suspense fallback={null}><ReferralCapture /></Suspense>
      <ScrollRevealProvider />
      <LandingNav />
      <LandingHero />

      {/* ===== DASHBOARD MOCKUP ===== */}
      <div style={{ padding: "0 24px 40px", maxWidth: 1000, margin: "0 auto" }}>
        <DashboardMockup />
      </div>

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

      {/* ===== HOW IT WORKS (Y1) ===== */}
      <section
        style={{
          padding: "120px 24px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
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
            How It Works
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
            Three Simple Steps
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            From idea to publication in minutes
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
          className="how-it-works-grid"
        >
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={i}
              className="tf-reveal tf-feature-card"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20,
                padding: "40px 32px",
                textAlign: "center",
                transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))",
                  border: "1px solid rgba(99,102,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#818cf8",
                }}
              >
                {item.step}
              </div>
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
                  margin: "0 auto 20px",
                }}
              >
                {item.icon}
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
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
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
            Features
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
            Everything to Grow Your Channel
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
            Six key areas — one platform
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

        {/* YouTube Analyzer Mockup */}
        <div className="tf-reveal" style={{ marginTop: 48 }}>
          <AnalyzerMockup />
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
              Tools
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
              Free Tools
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
              Use them right now — no sign-up required
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

      {/* ===== COMPARISON TABLE (Y3) ===== */}
      <section
        style={{
          padding: "120px 24px",
          maxWidth: 1000,
          margin: "0 auto",
        }}
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
            Comparison
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
            TubeForge vs Alternatives
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Why creators choose TubeForge
          </p>
        </div>
        <div className="tf-reveal" style={{ position: "relative" }}>
          {/* Right edge scroll gradient indicator (mobile) */}
          <div
            className="table-scroll-hint"
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 48,
              background: "linear-gradient(to right, transparent, rgba(10,10,10,0.8))",
              zIndex: 2,
              pointerEvents: "none",
              borderRadius: "0 20px 20px 0",
              display: "none",
            }}
          />
          <div
            style={{
              overflowX: "auto",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 600,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "20px 24px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.5)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  Feature
                </th>
                {COMPARISON_DATA.map((col, ci) => (
                  <th
                    key={ci}
                    style={{
                      textAlign: "center",
                      padding: "20px 16px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: ci === 0 ? "#818cf8" : "rgba(255,255,255,0.7)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      ...(ci === 0
                        ? { background: "rgba(99,102,241,0.06)" }
                        : {}),
                    }}
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((feature, fi) => (
                <tr key={fi}>
                  <td
                    style={{
                      padding: "16px 24px",
                      fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                      borderBottom:
                        fi < COMPARISON_FEATURES.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                    }}
                  >
                    {feature}
                  </td>
                  {COMPARISON_DATA.map((col, ci) => (
                    <td
                      key={ci}
                      style={{
                        textAlign: "center",
                        padding: "16px",
                        borderBottom:
                          fi < COMPARISON_FEATURES.length - 1
                            ? "1px solid rgba(255,255,255,0.04)"
                            : "none",
                        ...(ci === 0
                          ? { background: "rgba(99,102,241,0.06)" }
                          : {}),
                      }}
                    >
                      {col.values[fi] ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={ci === 0 ? "#818cf8" : "#4ade80"}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ display: "inline-block" }}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ display: "inline-block" }}
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* Swipe hint for mobile */}
          <p
            className="table-swipe-text"
            style={{
              display: "none",
              textAlign: "center",
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Swipe to see more {"→"}
          </p>
        </div>
      </section>

      {/* ===== FOR WHOM? (Y4) ===== */}
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
              Audience
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
              Who Is TubeForge For?
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.45)",
                maxWidth: 520,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Tools for everyone who creates video content
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {TARGET_AUDIENCE.map((item, i) => (
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
                  {item.icon}
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
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <PricingSection />

      {/* ===== TESTIMONIALS (Y2) ===== */}
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
              Testimonials
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
              What Creators Are Saying
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {TESTIMONIALS.map((testimonial, i) => (
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
              Frequently Asked Questions
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
              Everything you need to know about TubeForge
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
            Ready to Get Started?
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.45)",
              margin: "0 0 40px",
              lineHeight: 1.6,
            }}
          >
            Join TubeForge and get all the tools you need to grow your
            channel
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
            Start Free
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

      {/* ===== NEWSLETTER SIGNUP ===== */}
      <section
        className="tf-reveal"
        style={{
          padding: '80px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle top border */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: 600,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 560,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: '0 0 12px',
              lineHeight: 1.2,
            }}
          >
            Будь в курсе обновлений
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 32px',
              lineHeight: 1.6,
            }}
          >
            Получай советы по продвижению YouTube канала и новости TubeForge
          </p>
          <NewsletterForm />
          <p
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.2)',
              marginTop: 16,
            }}
          >
            Никакого спама. Отписаться можно в любой момент.
          </p>
        </div>
      </section>
      
      {/* ===== FOOTER ===== */}

      <footer
        className="landing-footer"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "64px 24px 40px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr repeat(4, 1fr)",
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
                AI-powered platform for YouTube creators. All the tools you need
                to create and promote content.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <a
                  href="https://youtube.com/@tubeforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s", padding: 10, minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                  style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s", padding: 10, minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                  style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s", padding: 10, minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
                title: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Tools", href: "#tools" },
                  { label: "VPN", href: "/vpn" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Blog", href: "/blog" },
                  { label: "About", href: "/about" },
                  { label: "Help", href: "/help" },
                  { label: "Contact", href: "/contact" },
                ],
              },
              {
                title: "Compare",
                links: [
                  { label: "TubeForge vs InVideo", href: "/compare/tubeforge-vs-invideo" },
                  { label: "TubeForge vs CapCut", href: "/compare/tubeforge-vs-capcut" },
                  { label: "TubeForge vs Pictory", href: "/compare/tubeforge-vs-pictory" },
                  { label: "TubeForge vs Synthesia", href: "/compare/tubeforge-vs-synthesia" },
                  { label: "TubeForge vs Fliki", href: "/compare/tubeforge-vs-fliki" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "DPA", href: "/dpa" },
                  { label: "SLA", href: "/sla" },
                  { label: "Security", href: "/security" },
                  {
                    label: "Refund Policy",
                    href: "mailto:support@tubeforge.co",
                  },
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
                          minHeight: 44,
                          display: "flex",
                          alignItems: "center",
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
              {"\u00A9"} 2026 TubeForge. All rights reserved.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <a
                href="/terms"
                style={{
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 13,
                  transition: "color 0.2s",
                  minHeight: 44,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                style={{
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 13,
                  transition: "color 0.2s",
                  minHeight: 44,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>

      <ClientCookieConsent />

      {/* Sticky Mobile CTA (Y5) */}
      <StickyMobileCTA />

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

        /* Sticky mobile CTA - show only on mobile */
        @media (max-width: 768px) {
          .sticky-mobile-cta {
            display: block !important;
          }
          .landing-footer {
            padding-bottom: 80px !important;
          }
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .landing-footer { padding-bottom: 80px !important; }
          .table-scroll-hint { display: block !important; }
          .table-swipe-text { display: block !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          .footer-grid a { min-height: 44px !important; display: flex !important; align-items: center !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-dropdown { display: none !important; }
          .mobile-menu-dropdown[data-open='true'] { display: block !important; position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 9999 !important; background: rgba(10,10,10,0.98) !important; overflow-y: auto !important; }
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
