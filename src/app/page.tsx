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
} from "@/components/landing";

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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  ai: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
  shield: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  image: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  chart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  users: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Describe Your Idea",
    desc: "Tell the AI what video you want to create — topic, style, and target audience. The AI understands context.",
  },
  {
    step: "2",
    title: "AI Creates Content",
    desc: "The platform generates scripts, thumbnails, descriptions, and tags — all optimized for YouTube.",
  },
  {
    step: "3",
    title: "Publish to YouTube",
    desc: "Your content is ready — upload to your channel and watch your views grow in real time.",
  },
];

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
    text: "The VPN works flawlessly, and team collaboration on the Studio plan is exactly what my team needed. Best platform for creators!",
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

/* -- Page (React Server Component) -------------------------------- */

export default function LandingPage() {
  return (
    <div style={{ background: "#ffffff", color: "#1d1d1f", minHeight: "100vh", fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif" }}>
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

      {/* ===== FEATURES ===== */}
      <section
        id="features"
        style={{ padding: "100px 24px", background: "#f5f5f7" }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 12px",
                color: "#1d1d1f",
              }}
            >
              Everything to grow your channel.
            </h2>
            <p
              style={{
                fontSize: 19,
                color: "#86868b",
                maxWidth: 480,
                margin: "0 auto",
                lineHeight: 1.5,
                fontWeight: 400,
              }}
            >
              Six powerful tools. One platform.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
            className="features-grid"
          >
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="tf-reveal tf-feature-card"
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: "36px 28px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(0,113,227,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  {FEATURE_ICONS[feature.icon]}
                </div>
                <h3
                  style={{
                    fontSize: 19,
                    fontWeight: 600,
                    color: "#1d1d1f",
                    margin: "0 0 8px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: "#86868b",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        id="how-it-works"
        style={{
          padding: "100px 24px",
          background: "#ffffff",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 12px",
                color: "#1d1d1f",
              }}
            >
              Three simple steps.
            </h2>
            <p
              style={{
                fontSize: 19,
                color: "#86868b",
                maxWidth: 420,
                margin: "0 auto",
                lineHeight: 1.5,
                fontWeight: 400,
              }}
            >
              From idea to publication in minutes.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
            className="how-it-works-grid"
          >
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={i}
                className="tf-reveal"
                style={{
                  textAlign: "center",
                  padding: "32px 24px",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 600,
                    color: "#0071e3",
                    marginBottom: 16,
                    lineHeight: 1,
                  }}
                >
                  {item.step}
                </div>
                <h3
                  style={{
                    fontSize: 19,
                    fontWeight: 600,
                    color: "#1d1d1f",
                    margin: "0 0 8px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: "#86868b",
                    lineHeight: 1.6,
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
      <section id="pricing" style={{ padding: "100px 24px", background: "#f5f5f7" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 12px",
                color: "#1d1d1f",
              }}
            >
              Simple, transparent pricing.
            </h2>
            <p
              style={{
                fontSize: 19,
                color: "#86868b",
                maxWidth: 420,
                margin: "0 auto",
                lineHeight: 1.5,
                fontWeight: 400,
              }}
            >
              Start free, scale when you are ready.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              maxWidth: 980,
              margin: "0 auto",
            }}
            className="pricing-grid"
          >
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className="tf-reveal tf-pricing-card"
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: "36px 28px",
                  border: plan.popular ? "2px solid #0071e3" : "1px solid #e5e5ea",
                  position: "relative",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {plan.popular && (
                  <span
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      background: "#0071e3",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 980,
                      letterSpacing: "0.02em",
                    }}
                  >
                    Popular
                  </span>
                )}
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 600,
                    color: "#1d1d1f",
                    marginBottom: 4,
                  }}
                >
                  {plan.name}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#86868b",
                    marginBottom: 24,
                  }}
                >
                  {plan.desc}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 2,
                    marginBottom: 28,
                  }}
                >
                  <span
                    style={{
                      fontSize: 40,
                      fontWeight: 600,
                      color: "#1d1d1f",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      style={{
                        fontSize: 17,
                        color: "#86868b",
                        fontWeight: 400,
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
                    margin: "0 0 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flex: 1,
                  }}
                >
                  {plan.features.map((feat, fi) => (
                    <li
                      key={fi}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 14,
                        color: "#1d1d1f",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0071e3"
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
                    width: "100%",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 17,
                    fontWeight: 400,
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    minHeight: 48,
                    ...(plan.popular
                      ? {
                          background: "#0071e3",
                          color: "#fff",
                          border: "none",
                        }
                      : {
                          background: "transparent",
                          color: "#0071e3",
                          border: "1px solid #0071e3",
                        }),
                  }}
                >
                  Choose {plan.name}
                </Link>
              </div>
            ))}
          </div>

          {/* Guarantee Badge */}
          <div
            className="tf-reveal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginTop: 48,
              padding: "20px 28px",
              borderRadius: 12,
              background: "#ffffff",
              border: "1px solid #e5e5ea",
              maxWidth: 420,
              marginLeft: "auto",
              marginRight: "auto",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0071e3"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1d1d1f",
                  marginBottom: 2,
                }}
              >
                14-Day Money-Back Guarantee
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#86868b",
                  lineHeight: 1.4,
                }}
              >
                Not satisfied? Full refund, no questions asked.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section
        style={{
          padding: "100px 24px",
          background: "#ffffff",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: 0,
                color: "#1d1d1f",
              }}
            >
              What creators are saying.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
            className="testimonials-grid"
          >
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="tf-reveal tf-feature-card"
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: "32px 28px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {[...Array(5)].map((_, si) => (
                    <svg
                      key={si}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="#0071e3"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 15,
                    color: "#1d1d1f",
                    lineHeight: 1.6,
                    margin: "0 0 20px",
                  }}
                >
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#f5f5f7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#86868b",
                    }}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1d1d1f",
                      }}
                    >
                      {testimonial.name}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#86868b",
                        marginTop: 1,
                      }}
                    >
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" style={{ padding: "100px 24px", background: "#f5f5f7" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 12px",
                color: "#1d1d1f",
              }}
            >
              Frequently asked questions.
            </h2>
            <p
              style={{
                fontSize: 19,
                color: "#86868b",
                maxWidth: 420,
                margin: "0 auto",
                lineHeight: 1.5,
                fontWeight: 400,
              }}
            >
              Everything you need to know.
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
          padding: "100px 24px 120px",
          textAlign: "center",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#1d1d1f",
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            Ready to get started?
          </h2>
          <p
            style={{
              fontSize: 19,
              color: "#86868b",
              margin: "0 0 36px",
              lineHeight: 1.5,
            }}
          >
            Join TubeForge and get all the tools you need to grow your channel.
          </p>
          <Link
            href="/register"
            className="tf-cta-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#0071e3",
              color: "#fff",
              fontSize: 17,
              fontWeight: 400,
              padding: "12px 28px",
              borderRadius: 980,
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              minHeight: 48,
            }}
          >
            Start Free
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          background: "#f5f5f7",
          padding: "56px 24px 32px",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 32,
              marginBottom: 40,
            }}
            className="footer-grid"
          >
            {[
              {
                title: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "VPN", href: "/vpn" },
                ],
              },
              {
                title: "Free Tools",
                links: [
                  { label: "Title Generator", href: "/free-tools/title-generator" },
                  { label: "Description Generator", href: "/free-tools/description-generator" },
                  { label: "Tag Generator", href: "/free-tools/tag-generator" },
                  { label: "Thumbnail Checker", href: "/free-tools/thumbnail-checker" },
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
                  { label: "vs InVideo", href: "/compare/tubeforge-vs-invideo" },
                  { label: "vs CapCut", href: "/compare/tubeforge-vs-capcut" },
                  { label: "vs Pictory", href: "/compare/tubeforge-vs-pictory" },
                  { label: "vs Synthesia", href: "/compare/tubeforge-vs-synthesia" },
                  { label: "vs TubeBuddy", href: "/compare/tubeforge-vs-tubebuddy" },
                  { label: "vs vidIQ", href: "/compare/tubeforge-vs-vidiq" },
                  { label: "vs VEED", href: "/compare/tubeforge-vs-veed" },
                  { label: "vs Opus Clip", href: "/compare/tubeforge-vs-opus-clip" },
                  { label: "vs Descript", href: "/compare/tubeforge-vs-descript" },
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
                ],
              },
            ].map((col, ci) => (
              <div key={ci}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1d1d1f",
                    marginBottom: 12,
                    letterSpacing: "0.01em",
                  }}
                >
                  {col.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
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
                        rel={isExternal ? "nofollow noopener noreferrer" : undefined}
                        style={{
                          textDecoration: "none",
                          color: "#86868b",
                          fontSize: 12,
                          transition: "color 0.3s ease",
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
              borderTop: "1px solid #d2d2d7",
              paddingTop: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 12, color: "#86868b" }}>
              {"\u00A9"} 2026 TubeForge. All rights reserved.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Social links */}
              <a
                href="https://youtube.com/@tubeforge"
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="YouTube"
                style={{ color: "#86868b", transition: "color 0.3s ease" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              </a>
              <a
                href="https://t.me/tubeforge"
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="Telegram"
                style={{ color: "#86868b", transition: "color 0.3s ease" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 0C5.37 0 0 5.37 0 12s5.37 12 11.99 12S24 18.63 24 12 18.61 0 11.99 0zm5.9 8.17l-1.93 9.12c-.15.67-.54.83-1.1.52l-3.02-2.23-1.46 1.4c-.16.16-.3.3-.61.3l.22-3.07 5.56-5.02c.24-.22-.05-.34-.38-.13L8.6 13.85l-2.97-.93c-.65-.2-.66-.65.13-.96l11.6-4.47c.54-.2 1.01.13.83.96l-.3-.28z"/></svg>
              </a>
              <a
                href="https://twitter.com/tubeforge"
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="Twitter"
                style={{ color: "#86868b", transition: "color 0.3s ease" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <span style={{ width: 1, height: 12, background: "#d2d2d7" }} />
              {/* Legal links */}
              <a
                href="/terms"
                style={{
                  textDecoration: "none",
                  color: "#86868b",
                  fontSize: 12,
                  transition: "color 0.3s ease",
                }}
              >
                Terms
              </a>
              <a
                href="/privacy"
                style={{
                  textDecoration: "none",
                  color: "#86868b",
                  fontSize: 12,
                  transition: "color 0.3s ease",
                }}
              >
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>

      <ClientCookieConsent />

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA />

      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        .tf-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(.4,0,.2,1), transform 0.8s cubic-bezier(.4,0,.2,1);
        }
        .tf-reveal.tf-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Feature card hover */
        .tf-feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.08) !important;
        }

        /* Pricing card hover */
        .tf-pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.08) !important;
        }

        /* CTA hover states */
        .tf-cta-primary:hover {
          background: #0077ED !important;
          transform: scale(1.02);
        }
        .tf-cta-secondary:hover {
          color: #0077ED !important;
        }

        /* Footer link hovers */
        footer a:hover {
          color: #1d1d1f !important;
        }

        /* Responsive grids */
        @media (max-width: 768px) {
          .features-grid,
          .how-it-works-grid,
          .pricing-grid,
          .testimonials-grid {
            grid-template-columns: 1fr !important;
          }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .sticky-mobile-cta { display: block !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid,
          .testimonials-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-dropdown { display: none !important; }
        }

        /* Focus styles */
        a:focus-visible, button:focus-visible {
          outline: 2px solid #0071e3;
          outline-offset: 2px;
          border-radius: 4px;
        }

        /* Selection */
        ::selection {
          background: rgba(0,113,227,0.15);
          color: #1d1d1f;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d2d2d7; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #86868b; }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .tf-reveal { opacity: 1; transform: none; transition: none; }
          * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
