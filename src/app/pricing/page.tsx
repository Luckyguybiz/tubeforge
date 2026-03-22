import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav, FaqAccordion } from "@/components/landing";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "TubeForge Pricing — Free, Pro & Studio Plans",
  description:
    "Choose the right TubeForge plan for your YouTube channel. Free plan with core features, Pro for active creators, Studio for teams. 14-day money-back guarantee.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "TubeForge Pricing — Free, Pro & Studio Plans",
    description:
      "Simple, transparent pricing for YouTube creators. Start free, upgrade when ready.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/pricing",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "TubeForge Pricing" }],
  },
  alternates: { canonical: "https://tubeforge.co/pricing" },
  twitter: {
    card: "summary_large_image",
    title: "TubeForge Pricing — Free, Pro & Studio Plans",
    description: "Simple, transparent pricing for YouTube creators.",
    images: ["/api/og"],
  },
};

/* -- Data ---------------------------------------------------------- */

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

const PRICING_FAQ = [
  {
    q: "Can I try TubeForge for free?",
    a: "Yes! The Free plan includes 3 video analyses per day, a basic AI editor, thumbnail generation, and SEO optimization. No credit card required.",
  },
  {
    q: "What happens when I upgrade to Pro?",
    a: "You unlock unlimited video analyses, all AI tools, VPN for YouTube, unlimited thumbnails, A/B testing, 50 GB storage, and priority support. Your existing data and projects are preserved.",
  },
  {
    q: "Can I switch between plans?",
    a: "Yes. You can upgrade or downgrade your plan at any time from your account settings. When upgrading, you pay the prorated difference. When downgrading, the change takes effect at the end of your billing period.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Absolutely. All paid plans come with a 14-day money-back guarantee. If you are not satisfied, contact us for a full refund — no questions asked.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes. Annual billing gives you 2 months free compared to monthly billing. You can switch to annual billing from your account settings.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) as well as Apple Pay and Google Pay via Stripe.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, cancel anytime from your account settings. Your paid features remain active until the end of your current billing period.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const PRICING_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "TubeForge Pricing",
  description: "Pricing plans for TubeForge — AI Studio for YouTube Creators",
  url: "https://tubeforge.co/pricing",
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "TubeForge",
    applicationCategory: "MultimediaApplication",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "Get started with the platform",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "12",
        priceCurrency: "USD",
        billingIncrement: 1,
        unitCode: "MON",
        description: "For active creators",
      },
      {
        "@type": "Offer",
        name: "Studio",
        price: "30",
        priceCurrency: "USD",
        billingIncrement: 1,
        unitCode: "MON",
        description: "For teams and agencies",
      },
    ],
  },
};

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tubeforge.co" },
    { "@type": "ListItem", position: 2, name: "Pricing" },
  ],
};

/* -- Page --------------------------------------------------------- */

export default function PricingPage() {
  return (
    <div
      style={{
        background: "#0a0a0a",
        color: "#ffffff",
        minHeight: "100vh",
        fontFamily:
          "var(--font-sans), -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />

      <LandingNav />

      {/* Hero */}
      <section style={{ padding: "120px 24px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: "0 0 16px",
              color: "#ffffff",
            }}
          >
            Simple, transparent pricing.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Start free, scale when you are ready. No hidden fees.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "0 24px 80px" }}>
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
              className="tf-pricing-card"
              style={{
                background: "#0a0a0a",
                borderRadius: 18,
                padding: "36px 28px",
                border: plan.popular ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.06)",
                position: "relative",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
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
                    background: "#6366f1",
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
                  color: "#ffffff",
                  marginBottom: 4,
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
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
                    color: "#ffffff",
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
                      color: "rgba(255,255,255,0.5)",
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
                      color: "#ffffff",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6366f1"
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
                        background: "#6366f1",
                        color: "#fff",
                        border: "none",
                      }
                    : {
                        background: "transparent",
                        color: "#6366f1",
                        border: "1px solid #6366f1",
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginTop: 48,
            padding: "20px 28px",
            borderRadius: 12,
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.06)",
            maxWidth: 420,
            marginLeft: "auto",
            marginRight: "auto",
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
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
                color: "#ffffff",
                marginBottom: 2,
              }}
            >
              14-Day Money-Back Guarantee
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.4,
              }}
            >
              Not satisfied? Full refund, no questions asked.
            </div>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section style={{ padding: "80px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 12px",
                color: "#ffffff",
              }}
            >
              Pricing FAQ
            </h2>
            <p
              style={{
                fontSize: 19,
                color: "rgba(255,255,255,0.5)",
                maxWidth: 420,
                margin: "0 auto",
                lineHeight: 1.5,
                fontWeight: 400,
              }}
            >
              Common questions about our plans.
            </p>
          </div>
          <FaqAccordion items={PRICING_FAQ} />
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 24px 100px",
          textAlign: "center",
          background: "#0a0a0a",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            Ready to get started?
          </h2>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              margin: "0 0 36px",
              lineHeight: 1.5,
            }}
          >
            Join thousands of YouTube creators using TubeForge.
          </p>
          <Link
            href="/register"
            className="tf-cta-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#6366f1",
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

      {/* Footer */}
      <footer style={{ background: "#111111", padding: "32px 24px" }}>
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            textAlign: "center",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {"\u00A9"} 2026 TubeForge. All rights reserved.
        </div>
      </footer>

      <style>{`
        .tf-pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.4) !important;
        }
        .tf-cta-primary:hover {
          background: #818cf8 !important;
          transform: scale(1.02);
        }
        .tf-cta-secondary:hover {
          color: #818cf8 !important;
        }
        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
