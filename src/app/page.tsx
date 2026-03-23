import React, { Suspense, lazy } from "react";
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
} from "@/components/landing";

/* Lazy-load heavy below-fold client component to avoid blocking hero LCP */
const ProductDemo = lazy(() =>
  import("@/components/landing/ProductDemo").then((m) => ({ default: m.ProductDemo })),
);

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "TubeForge — AI Studio for YouTube Creators",
  description:
    "AI-powered platform for YouTube creators. Video editor, thumbnail generator, metadata optimizer, VPN, analytics, and free tools.",
  openGraph: {
    title: "TubeForge — AI Studio for YouTube Creators",
    description:
      "Create professional YouTube content with AI. Thumbnail generation, metadata optimization, video editing, analytics.",
    type: "website",
    locale: "en_US",
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

/* -- Data ---------------------------------------------------------- */

const KEY_FEATURES = [
  {
    icon: "thumbnail",
    title: "AI Thumbnail Generator",
    desc: "Create viral thumbnails with AI in seconds. Professional Canva-style editor with A/B testing built in.",
    href: "/ai-thumbnails",
    cta: "Try it",
  },
  {
    icon: "video",
    title: "Video Editor",
    desc: "Scene-based AI video creation for YouTube. Generate scripts, storyboards, and full video content.",
    href: "/editor",
    cta: "Try it",
  },
  {
    icon: "tools",
    title: "Free YouTube Tools",
    desc: "10+ free tools for titles, tags, descriptions, SEO optimization, and thumbnail sizing.",
    href: "/free-tools",
    cta: "Try it",
  },
];

const KEY_FEATURE_ICONS: Record<string, React.JSX.Element> = {
  thumbnail: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  video: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  tools: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Describe Your Idea",
    desc: "Tell the AI what video you want to create — topic, style, and target audience.",
  },
  {
    step: "2",
    title: "AI Creates Content",
    desc: "The platform generates scripts, thumbnails, descriptions, and tags — all optimized for YouTube.",
  },
  {
    step: "3",
    title: "Publish on YouTube",
    desc: "Your content is ready — upload to your channel and watch your views grow.",
  },
];

const FREE_TOOLS = [
  { title: "Title Generator", desc: "AI-powered YouTube titles that get clicks", href: "/free-tools/title-generator", icon: "type" },
  { title: "Description Generator", desc: "SEO-optimized descriptions in seconds", href: "/free-tools/description-generator", icon: "file" },
  { title: "Tag Generator", desc: "Find the best tags for your videos", href: "/free-tools/tag-generator", icon: "tag" },
  { title: "Thumbnail Checker", desc: "Preview how your thumbnail looks everywhere", href: "/free-tools/thumbnail-checker", icon: "image" },
  { title: "Script Generator", desc: "AI scripts for any video topic or niche", href: "/free-tools/script-generator", icon: "edit" },
  { title: "Video Ideas", desc: "Never run out of content ideas again", href: "/free-tools/video-ideas", icon: "bulb" },
  { title: "YouTube Title Generator", desc: "SEO titles optimized for search and CTR", href: "/tools/youtube-title-generator", icon: "search" },
  { title: "YouTube Tag Generator", desc: "Discover high-volume tags for any topic", href: "/tools/youtube-tag-generator", icon: "hash" },
];

const FREE_TOOL_ICONS: Record<string, React.JSX.Element> = {
  type: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  tag: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  image: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
  edit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  bulb: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></svg>,
  search: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  hash: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>,
};

const TESTIMONIALS = [
  {
    name: "Alex M.",
    role: "YouTuber, 150K subscribers",
    text: "TubeForge completely replaced 5 separate tools for me. Thumbnails, SEO, analytics \u2014 all in one place. I save at least 3 hours every week.",
    avatar: "A",
  },
  {
    name: "Sarah K.",
    role: "Content Marketer",
    text: "The AI description generator is magical \u2014 every video with optimized tags gets more views. I recommend it to all marketers!",
    avatar: "S",
  },
  {
    name: "David R.",
    role: "Full-time Creator",
    text: "The team collaboration on the Studio plan is exactly what my team needed. Best platform for creators, hands down.",
    avatar: "D",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Get started with the platform",
    features: [
      "3 projects",
      "5 AI generations / month",
      "500 MB storage",
      "Thumbnail generation",
      "SEO optimization",
      "720p export",
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
      "25 projects",
      "100 AI generations / month",
      "5 GB storage",
      "All AI tools",
      "A/B thumbnail testing",
      "1080p export",
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
      "Unlimited projects",
      "Unlimited AI generations",
      "50 GB storage",
      "Team up to 10 members",
      "4K export",
      "API access",
      "Dedicated support",
    ],
    popular: false,
    href: "/billing?plan=STUDIO",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is TubeForge?",
    a: "TubeForge is an AI-powered platform for YouTube creators that combines video editing, AI tools, thumbnail generation, SEO optimization, and analytics \u2014 all in one place.",
  },
  {
    q: "Is TubeForge really free?",
    a: "Yes. The Free plan includes 3 projects, 5 AI generations per month, thumbnail generation, and SEO optimization. No credit card required, free forever.",
  },
  {
    q: "What AI tools are included?",
    a: "TubeForge integrates with 10+ AI providers including OpenAI and Google. Generate titles, descriptions, scripts, thumbnails, tags, and video ideas \u2014 all optimized for YouTube.",
  },
  {
    q: "Can I use the free tools without signing up?",
    a: "Yes. All tools on the Free Tools page (title generator, tag generator, description generator, and more) are completely free to use without an account.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, cancel anytime from your account settings \u2014 no questions asked. Access to paid features remains until the end of your billing period.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Our servers are located in the EU, and all data is encrypted in transit and at rest. We comply with GDPR and CCPA.",
  },
  {
    q: "Is there an API?",
    a: "Yes, API access is available on the Studio plan. Integrate TubeForge tools into your applications and automate workflows.",
  },
];

/* -- JSON-LD Structured Data -------------------------------------- */

const PAGE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TubeForge",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  url: "https://tubeforge.co",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "30",
    priceCurrency: "USD",
    offerCount: "3",
  },
  description:
    "AI-powered video creation platform for YouTube creators",
};

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TubeForge",
  url: "https://tubeforge.co",
  logo: "https://tubeforge.co/icon-512.png",
  sameAs: [
    "https://youtube.com/@tubeforge",
    "https://t.me/tubeforge",
    "https://twitter.com/tubeforge",
  ],
  description: "AI-powered video creation platform for YouTube creators",
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

/* -- Dark color palette ------------------------------------------- */
const BG_PRIMARY = "#0a0a0a";
const BG_ALT = "#111111";
const CARD_BG = "#1a1a1a";
const TEXT_PRIMARY = "#ffffff";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_DIM = "rgba(255,255,255,0.45)";
const BORDER_SUBTLE = "rgba(255,255,255,0.06)";
const ACCENT = "#6366f1";

/* -- Page (React Server Component) -------------------------------- */

export default function LandingPage() {
  return (
    <div style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, minHeight: "100vh", fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif" }}>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <Suspense fallback={null}><ReferralCapture /></Suspense>
      <ScrollRevealProvider />
      <LandingNav />
      <LandingHero />

      {/* ===== TRUSTED BY CREATORS (Social Proof) ===== */}
      <section style={{ padding: "48px 24px", background: BG_PRIMARY, borderTop: `1px solid ${BORDER_SUBTLE}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_DIM, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 24px" }}>
            Trusted by creators worldwide
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { label: "10K+", sub: "Creators" },
              { label: "50K+", sub: "Videos optimized" },
              { label: "1M+", sub: "Thumbnails generated" },
              { label: "4.9/5", sub: "Average rating" },
            ].map((stat, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "0 16px" }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: "-0.02em" }}>{stat.label}</span>
                <span style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 400 }}>{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEY FEATURES (3 Cards) ===== */}
      <section
        id="features"
        style={{ padding: "80px 24px", background: BG_ALT }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 12px", color: TEXT_PRIMARY }}>
              Everything to grow your channel.
            </h2>
            <p style={{ fontSize: 18, color: TEXT_MUTED, maxWidth: 480, margin: "0 auto", lineHeight: 1.5, fontWeight: 400 }}>
              Three powerful products. One platform.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="features-grid">
            {KEY_FEATURES.map((feature, i) => (
              <div key={i} className="tf-reveal tf-feature-card" style={{ background: CARD_BG, borderRadius: 14, padding: "36px 28px", transition: "all 0.3s ease", cursor: "default", border: `1px solid ${BORDER_SUBTLE}`, display: "flex", flexDirection: "column" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  {KEY_FEATURE_ICONS[feature.icon]}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 600, color: TEXT_PRIMARY, margin: "0 0 8px" }}>{feature.title}</h3>
                <p style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.6, margin: "0 0 20px", flex: 1 }}>{feature.desc}</p>
                <Link
                  href={feature.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    color: ACCENT,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "gap 0.2s ease",
                  }}
                >
                  {feature.cta}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUCT DEMO (vidIQ-style interactive tabs) ===== */}
      <Suspense fallback={<div style={{ minHeight: 400, background: BG_ALT }} />}>
        <ProductDemo />
      </Suspense>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" style={{ padding: "80px 24px", background: BG_PRIMARY, contentVisibility: "auto", containIntrinsicSize: "auto 600px" } as React.CSSProperties}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 12px", color: TEXT_PRIMARY }}>
              Three simple steps.
            </h2>
            <p style={{ fontSize: 18, color: TEXT_MUTED, maxWidth: 420, margin: "0 auto", lineHeight: 1.5, fontWeight: 400 }}>
              From idea to publication in minutes.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="how-it-works-grid">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="tf-reveal" style={{ textAlign: "center", padding: "32px 24px" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(99,102,241,0.1)", border: `1px solid rgba(99,102,241,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{item.step}</span>
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 600, color: TEXT_PRIMARY, margin: "0 0 8px" }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FREE TOOLS SHOWCASE ===== */}
      <section id="tools" style={{ padding: "80px 24px", background: BG_ALT, contentVisibility: "auto", containIntrinsicSize: "auto 700px" } as React.CSSProperties}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 12px", color: TEXT_PRIMARY }}>
              Free tools for every creator.
            </h2>
            <p style={{ fontSize: 18, color: TEXT_MUTED, maxWidth: 480, margin: "0 auto", lineHeight: 1.5, fontWeight: 400 }}>
              No signup required. Use them right now.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="tools-grid">
            {FREE_TOOLS.map((tool, i) => (
              <Link
                key={i}
                href={tool.href}
                className="tf-reveal tf-feature-card"
                style={{
                  background: CARD_BG,
                  borderRadius: 14,
                  padding: "24px 20px",
                  transition: "all 0.3s ease",
                  border: `1px solid ${BORDER_SUBTLE}`,
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {FREE_TOOL_ICONS[tool.icon]}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>{tool.title}</h3>
                <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, margin: 0 }}>{tool.desc}</p>
              </Link>
            ))}
          </div>
          <div className="tf-reveal" style={{ textAlign: "center", marginTop: 40 }}>
            <Link
              href="/free-tools"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: ACCENT,
                fontSize: 15,
                fontWeight: 500,
                textDecoration: "none",
                transition: "gap 0.2s ease",
              }}
            >
              See All Tools
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" style={{ padding: "80px 24px", background: BG_PRIMARY, contentVisibility: "auto", containIntrinsicSize: "auto 800px" } as React.CSSProperties}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 12px", color: TEXT_PRIMARY }}>
              Simple, transparent pricing.
            </h2>
            <p style={{ fontSize: 18, color: TEXT_MUTED, maxWidth: 420, margin: "0 auto", lineHeight: 1.5, fontWeight: 400 }}>
              Start free, scale when you are ready.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 980, margin: "0 auto" }} className="pricing-grid">
            {PLANS.map((plan, i) => (
              <div key={i} className="tf-reveal tf-pricing-card" style={{ background: CARD_BG, borderRadius: 14, padding: "36px 28px", border: plan.popular ? `2px solid ${ACCENT}` : `1px solid ${BORDER_SUBTLE}`, position: "relative", transition: "all 0.3s ease", display: "flex", flexDirection: "column" }}>
                {plan.popular && (
                  <span style={{ position: "absolute", top: 16, right: 16, background: ACCENT, color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 980, letterSpacing: "0.02em" }}>Popular</span>
                )}
                <div style={{ fontSize: 19, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 24 }}>{plan.desc}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 28 }}>
                  <span style={{ fontSize: 40, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: "-0.02em", lineHeight: 1 }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 17, color: TEXT_MUTED, fontWeight: 400 }}>{plan.period}</span>}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  {plan.features.map((feat, fi) => (
                    <li key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="20 6 9 17 4 12" /></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={plan.popular ? "tf-cta-primary" : "tf-cta-secondary"}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 28px", borderRadius: 12, fontSize: 17, fontWeight: 500, textDecoration: "none", transition: "all 0.3s ease", minHeight: 48,
                    ...(plan.popular
                      ? { background: ACCENT, color: "#fff", border: "none", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }
                      : { background: "transparent", color: ACCENT, border: "1px solid rgba(99,102,241,0.3)" }),
                  }}
                >
                  Choose {plan.name}
                </Link>
              </div>
            ))}
          </div>

          {/* Guarantee Badge */}
          <div className="tf-reveal" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 48, padding: "20px 28px", borderRadius: 12, background: CARD_BG, border: `1px solid ${BORDER_SUBTLE}`, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
            </svg>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }}>14-Day Money-Back Guarantee</div>
              <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.4 }}>Not satisfied? Full refund, no questions asked.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section style={{ padding: "80px 24px", background: BG_ALT, contentVisibility: "auto", containIntrinsicSize: "auto 500px" } as React.CSSProperties}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0, color: TEXT_PRIMARY }}>
              What creators are saying.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="testimonials-grid">
            {TESTIMONIALS.map((testimonial, i) => (
              <div key={i} className="tf-reveal tf-feature-card" style={{ background: CARD_BG, borderRadius: 14, padding: "32px 28px", transition: "all 0.3s ease", cursor: "default", border: `1px solid ${BORDER_SUBTLE}` }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {[...Array(5)].map((_, si) => (
                    <svg key={si} width="14" height="14" viewBox="0 0 24 24" fill={ACCENT}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  ))}
                </div>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 20px" }}>&ldquo;{testimonial.text}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: BORDER_SUBTLE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: TEXT_MUTED }}>{testimonial.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{testimonial.name}</div>
                    <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 1 }}>{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" style={{ padding: "80px 24px", background: BG_PRIMARY, contentVisibility: "auto", containIntrinsicSize: "auto 600px" } as React.CSSProperties}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 12px", color: TEXT_PRIMARY }}>
              Frequently asked questions.
            </h2>
            <p style={{ fontSize: 18, color: TEXT_MUTED, maxWidth: 420, margin: "0 auto", lineHeight: 1.5, fontWeight: 400 }}>
              Everything you need to know.
            </p>
          </div>
          <div className="tf-reveal">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="tf-reveal" style={{ padding: "80px 24px 100px", textAlign: "center", background: BG_ALT }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", color: TEXT_PRIMARY, margin: "0 0 12px", lineHeight: 1.1 }}>
            Ready to create?
          </h2>
          <p style={{ fontSize: 18, color: TEXT_MUTED, margin: "0 0 36px", lineHeight: 1.5 }}>
            Join 10,000+ creators using TubeForge to grow their channels.
          </p>
          <Link href="/register" className="tf-cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT, color: "#fff", fontSize: 17, fontWeight: 500, padding: "12px 28px", borderRadius: 12, textDecoration: "none", border: "none", cursor: "pointer", transition: "all 0.3s ease", minHeight: 48, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}>
            Start Free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: BG_PRIMARY, padding: "56px 24px 32px", borderTop: `1px solid ${BORDER_SUBTLE}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 32, marginBottom: 40 }} className="footer-grid">
            {[
              { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "/pricing" }, { label: "AI Thumbnails", href: "/ai-thumbnails" }] },
              { title: "Free Tools", links: [{ label: "Title Generator", href: "/free-tools/title-generator" }, { label: "Description Generator", href: "/free-tools/description-generator" }, { label: "Tag Generator", href: "/free-tools/tag-generator" }, { label: "Thumbnail Checker", href: "/free-tools/thumbnail-checker" }] },
              { title: "Compare", links: [{ label: "vs InVideo", href: "/compare/tubeforge-vs-invideo" }, { label: "vs CapCut", href: "/compare/tubeforge-vs-capcut" }, { label: "vs Pictory", href: "/compare/tubeforge-vs-pictory" }, { label: "vs Synthesia", href: "/compare/tubeforge-vs-synthesia" }] },
              { title: "Resources", links: [{ label: "Blog", href: "/blog" }, { label: "Help", href: "/help" }, { label: "Contact", href: "/contact" }, { label: "About", href: "/about" }] },
              { title: "Legal", links: [{ label: "Terms of Service", href: "/terms" }, { label: "Privacy Policy", href: "/privacy" }, { label: "DPA", href: "/dpa" }, { label: "SLA", href: "/sla" }, { label: "Security", href: "/security" }] },
            ].map((col, ci) => (
              <div key={ci}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 12, letterSpacing: "0.01em" }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map((link, li) => {
                    const isExternal = link.href.startsWith("http") || link.href.startsWith("mailto:");
                    return (
                      <a key={li} href={link.href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "nofollow noopener noreferrer" : undefined} style={{ textDecoration: "none", color: TEXT_DIM, fontSize: 12, transition: "color 0.3s ease" }}>
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontSize: 12, color: TEXT_DIM }}>{"\u00A9"} 2026 TubeForge. All rights reserved.</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <a href="https://youtube.com/@tubeforge" target="_blank" rel="nofollow noopener noreferrer" aria-label="YouTube" style={{ color: TEXT_DIM, transition: "color 0.3s ease" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              </a>
              <a href="https://t.me/tubeforge" target="_blank" rel="nofollow noopener noreferrer" aria-label="Telegram" style={{ color: TEXT_DIM, transition: "color 0.3s ease" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 0C5.37 0 0 5.37 0 12s5.37 12 11.99 12S24 18.63 24 12 18.61 0 11.99 0zm5.9 8.17l-1.93 9.12c-.15.67-.54.83-1.1.52l-3.02-2.23-1.46 1.4c-.16.16-.3.3-.61.3l.22-3.07 5.56-5.02c.24-.22-.05-.34-.38-.13L8.6 13.85l-2.97-.93c-.65-.2-.66-.65.13-.96l11.6-4.47c.54-.2 1.01.13.83.96l-.3-.28z"/></svg>
              </a>
              <a href="https://twitter.com/tubeforge" target="_blank" rel="nofollow noopener noreferrer" aria-label="Twitter" style={{ color: TEXT_DIM, transition: "color 0.3s ease" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
              <a href="/terms" style={{ textDecoration: "none", color: TEXT_DIM, fontSize: 12, transition: "color 0.3s ease" }}>Terms</a>
              <a href="/privacy" style={{ textDecoration: "none", color: TEXT_DIM, fontSize: 12, transition: "color 0.3s ease" }}>Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      <ClientCookieConsent />
      <StickyMobileCTA />

      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        .tf-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.8s cubic-bezier(.4,0,.2,1), transform 0.8s cubic-bezier(.4,0,.2,1); }
        .tf-reveal.tf-visible { opacity: 1; transform: translateY(0); }
        .tf-feature-card:hover { transform: translateY(-4px); box-shadow: 0 8px 40px rgba(0,0,0,0.3) !important; border-color: rgba(255,255,255,0.1) !important; }
        .tf-pricing-card:hover { transform: translateY(-4px); box-shadow: 0 8px 40px rgba(0,0,0,0.3) !important; }
        .tf-cta-primary:hover { background: #7c3aed !important; transform: scale(1.02); box-shadow: 0 0 40px rgba(99,102,241,0.5) !important; }
        .tf-cta-secondary:hover { color: #818cf8 !important; border-color: rgba(99,102,241,0.5) !important; }
        footer a:hover { color: rgba(255,255,255,0.7) !important; }
        @media (max-width: 768px) {
          .features-grid, .how-it-works-grid, .pricing-grid, .testimonials-grid { grid-template-columns: 1fr !important; }
          .tools-grid { grid-template-columns: 1fr 1fr !important; }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .sticky-mobile-cta { display: block !important; }
          #features, #how-it-works, #tools, #pricing, #faq { padding-left: 16px !important; padding-right: 16px !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid, .testimonials-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tools-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          .tools-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) { .mobile-menu-dropdown { display: none !important; } }
        a:focus-visible, button:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; border-radius: 4px; }
        ::selection { background: rgba(99,102,241,0.3); color: #ffffff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @media (prefers-reduced-motion: reduce) { .tf-reveal { opacity: 1; transform: none; transition: none; } * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }
      `}</style>
    </div>
  );
}
