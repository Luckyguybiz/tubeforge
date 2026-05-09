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
import BrandOrbShowcaseMount from "@/components/landing/BrandOrbShowcaseMount";

/* Lazy-load heavy below-fold client component to avoid blocking hero LCP */
const ProductDemo = lazy(() =>
  import("@/components/landing/ProductDemo").then((m) => ({ default: m.ProductDemo })),
);

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "TubeForge — AI Thumbnails That Beat Your Niche",
  description:
    "AI analyses what's working in your YouTube niche, then generates thumbnails in that style. Lift CTR from your first upload.",
  openGraph: {
    title: "TubeForge — AI Thumbnails That Beat Your Niche",
    description:
      "AI analyses what's working in your niche, then generates thumbnails in that style. Designed to lift CTR from the first upload.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "TubeForge — AI Thumbnails That Beat Your Niche" }],
  },
  alternates: { canonical: "https://tubeforge.co" },
  twitter: {
    card: "summary_large_image",
    title: "TubeForge — AI Thumbnails That Beat Your Niche",
    description: "AI analyses your niche, generates thumbnails that lift CTR. 3 free per month, no credit card.",
    images: ["/api/og"],
  },
};

/* -- Data ---------------------------------------------------------- */

const KEY_FEATURES = [
  {
    icon: "thumbnail",
    title: "Niche-aware AI",
    desc: "AI reads top-performing thumbnails in your niche and generates new ones in that exact style — not generic stock-photo collages.",
    href: "/ai-thumbnails",
    cta: "Generate one",
  },
  {
    icon: "video",
    title: "Canvas editor built in",
    desc: "Refine the AI output, swap elements, layer text, or start from scratch in a Figma-style canvas — all inside the same tool.",
    href: "/ai-thumbnails",
    cta: "Open editor",
  },
  {
    icon: "tools",
    title: "A/B test before you upload",
    desc: "Generate variants, preview them at YouTube sizes (sidebar, mobile, full), and pick the one your viewers will actually click.",
    href: "/ai-thumbnails",
    cta: "See preview",
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
    title: "Pick a niche, describe your video",
    desc: "Choose your niche from the picker or paste a YouTube URL. Add a one-line description of the video — that's all the AI needs.",
  },
  {
    step: "2",
    title: "AI reads your niche, generates 3 variants",
    desc: "AI pulls the visual patterns from top-performing thumbnails in your niche right now and composes 3 thumbnails that match — colours, text density, face placement, all niche-typical.",
  },
  {
    step: "3",
    title: "Refine in the canvas, download, ship",
    desc: "Open any variant in the built-in canvas editor to tweak text or swap an element. Download in YouTube sizes (1280×720) and upload to your channel.",
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
    name: "Cass Wolfe",
    role: "Tech YouTuber, 240K subs",
    text: "It's the first AI thumbnail tool that actually understands my niche. I used to redo the same thumbnail three times in Canva to get the right look \u2014 now I get a working version in under a minute.",
    avatar: "C",
  },
  {
    name: "Marcus Reyes",
    role: "Vlogger, 89K subs",
    text: "What surprised me is the consistency. Every thumbnail it generates already feels like part of my channel \u2014 same warmth, same crop. I stopped paying my designer last month.",
    avatar: "M",
  },
  {
    name: "Yuna Park",
    role: "Music Education, 1.2M subs",
    text: "The niche analysis nailed exactly what's working in piano-tutorial thumbnails right now. I went from designing thumbnails for 30 minutes to picking from three variants in 30 seconds.",
    avatar: "Y",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Try it before you commit",
    features: [
      "3 thumbnails / month",
      "Niche-aware AI",
      "Built-in canvas editor",
      "1080p downloads",
      "Free YouTube tools",
    ],
    popular: false,
    href: "/ai-thumbnails",
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For active creators",
    features: [
      "100 thumbnails / month",
      "A/B testing & multi-size preview",
      "Higher-quality AI model",
      "Style library across niches",
      "Priority generation queue",
      "All Free tools included",
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
      "Unlimited thumbnails",
      "Team up to 10 members",
      "Brand kit (locked colours / fonts / logos)",
      "Commercial license",
      "API access",
      "Dedicated support",
    ],
    popular: false,
    href: "/billing?plan=STUDIO",
  },
];

const FAQ_ITEMS = [
  {
    q: "What makes TubeForge different from a generic AI image generator?",
    a: "TubeForge is built specifically for YouTube thumbnails. AI reads the top-performing thumbnails in your niche and generates new ones in that exact style \u2014 bold text overlays, niche-typical compositions, the lighting that's working right now. A generic image generator gives you stock-photo collages; we give you thumbnails creators in your niche actually click on.",
  },
  {
    q: "Is TubeForge really free?",
    a: "Yes. The Free plan gives you 3 thumbnails per month, niche-aware AI, the built-in canvas editor, and 1080p downloads. No credit card required.",
  },
  {
    q: "How does the niche analysis work?",
    a: "When you describe your video \u2014 or paste a YouTube URL \u2014 AI pulls the visual patterns from top thumbnails in that niche right now: dominant colours, face placement, text density, background style. The generator then composes a thumbnail using those patterns combined with your prompt.",
  },
  {
    q: "Can I edit the AI's output?",
    a: "Yes. Every generation opens directly in our canvas editor \u2014 swap elements, layer text, change the composition, or start from scratch. The AI is a starting point, not a constraint.",
  },
  {
    q: "How many thumbnails do I get per month?",
    a: "Free: 3/month. Pro ($12/mo): 100/month with A/B testing and our higher-quality AI model. Studio ($30/mo): unlimited, plus brand kit, team seats, and commercial license.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes \u2014 cancel anytime from your account settings. Access to paid features remains until the end of your billing period.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Our servers are located in the EU and all data is encrypted in transit and at rest. We comply with GDPR and CCPA.",
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
      <section style={{ padding: "72px 24px 56px", background: BG_PRIMARY, borderTop: `1px solid ${BORDER_SUBTLE}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          {/* Animated brand eye orb — iridescent eyeball that tracks the
              cursor across the page. Square container so the canvas
              aspect matches the sphere; floor glow stays bounded
              inside the canvas. */}
          <div
            aria-hidden
            style={{
              width: 96,
              height: 96,
              margin: "0 auto 32px",
              padding: 0,
            }}
          >
            <BrandOrbShowcaseMount />
          </div>
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
              Built for thumbnails that click.
            </h2>
            <p style={{ fontSize: 18, color: TEXT_MUTED, maxWidth: 520, margin: "0 auto", lineHeight: 1.5, fontWeight: 400 }}>
              Three pieces of one tool, designed around a single goal: a thumbnail that wins the impression.
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
              Idea to thumbnail in three steps.
            </h2>
            <p style={{ fontSize: 18, color: TEXT_MUTED, maxWidth: 460, margin: "0 auto", lineHeight: 1.5, fontWeight: 400 }}>
              Under a minute, every time. No design skills required.
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
            Your next thumbnail is one prompt away.
          </h2>
          <p style={{ fontSize: 18, color: TEXT_MUTED, margin: "0 0 36px", lineHeight: 1.5 }}>
            3 free thumbnails per month. No credit card. Niche-aware AI.
          </p>
          <Link href="/ai-thumbnails" className="tf-cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT, color: "#fff", fontSize: 17, fontWeight: 500, padding: "12px 28px", borderRadius: 12, textDecoration: "none", border: "none", cursor: "pointer", transition: "all 0.3s ease", minHeight: 48, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}>
            Generate your first thumbnail
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: BG_PRIMARY, padding: "56px 24px 32px", borderTop: `1px solid ${BORDER_SUBTLE}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 32, marginBottom: 40 }} className="footer-grid">
            {[
              { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "/pricing" }, { label: "AI Thumbnails", href: "/ai-thumbnails" }, { label: "All Tools", href: "/free-tools" }] },
              { title: "Free Tools", links: [{ label: "All Free Tools", href: "/free-tools" }, { label: "Title Generator", href: "/free-tools/title-generator" }, { label: "Description Generator", href: "/free-tools/description-generator" }, { label: "Tag Generator", href: "/free-tools/tag-generator" }, { label: "Thumbnail Checker", href: "/free-tools/thumbnail-checker" }] },
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
                <svg width="28" height="20" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27.42 3.13a3.51 3.51 0 0 0-2.47-2.5C22.8 0 14 0 14 0S5.2 0 3.05.63A3.51 3.51 0 0 0 .58 3.13 36.83 36.83 0 0 0 0 10a36.83 36.83 0 0 0 .58 6.87 3.51 3.51 0 0 0 2.47 2.5C5.2 20 14 20 14 20s8.8 0 10.95-.63a3.51 3.51 0 0 0 2.47-2.5A36.83 36.83 0 0 0 28 10a36.83 36.83 0 0 0-.58-6.87Z" fill="#FF0000"/><path d="M11.2 14.29 18.5 10 11.2 5.71v8.58Z" fill="#fff"/></svg>
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
