import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { TitleGenTool } from "./TitleGenTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free AI YouTube Title Generator — Create Viral Titles | TubeForge",
  description:
    "Generate 10 viral, click-worthy YouTube title ideas for any topic. Choose from educational, entertainment, tutorial, or listicle styles. Free AI tool — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free AI YouTube Title Generator — Create Viral Titles | TubeForge",
    description:
      "Generate 10 viral YouTube titles instantly with AI. Choose your style — educational, entertainment, tutorial, or listicle. Free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/youtube-title-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "AI YouTube Title Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/youtube-title-generator" },
  twitter: {
    card: "summary_large_image",
    title: "Free AI YouTube Title Generator — Create Viral Titles | TubeForge",
    description: "Generate 10 viral YouTube title ideas for any topic. Free AI tool, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the AI YouTube title generator work?",
    a: "Our AI analyzes your topic and selected style to generate 10 unique, high-CTR title variations. It uses proven patterns like numbers, power words, curiosity gaps, and emotional triggers based on millions of top-performing YouTube titles.",
  },
  {
    q: "What title styles are available?",
    a: "You can choose from four styles: Educational (informative, how-to), Entertainment (fun, clickable), Tutorial (step-by-step, practical), and Listicle (numbered lists, compilations). Each style uses different engagement patterns optimized for that content type.",
  },
  {
    q: "How long should a YouTube title be?",
    a: "YouTube displays up to 70 characters on desktop and about 50 on mobile. Aim for 50-60 characters to ensure your full title is visible everywhere. Our generator creates titles within this optimal range.",
  },
  {
    q: "Can I use these titles for free?",
    a: "Yes, you get 3 free generations per day without an account. Create a free TubeForge account for unlimited generations and access to 14+ additional creator tools including description, tag, and thumbnail generators.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI YouTube Title Generator",
  description: "Free AI-powered YouTube title generator with style selection. Create 10 viral title variations for any video topic.",
  url: "https://tubeforge.co/tools/youtube-title-generator",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  isPartOf: {
    "@type": "WebSite",
    name: "TubeForge",
    url: "https://tubeforge.co",
  },
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

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tubeforge.co" },
    { "@type": "ListItem", position: 2, name: "Free Tools", item: "https://tubeforge.co/free-tools" },
    { "@type": "ListItem", position: 3, name: "YouTube Title Generator", item: "https://tubeforge.co/tools/youtube-title-generator" },
  ],
};

/* -- Page --------------------------------------------------------- */

export default function YouTubeTitleGeneratorPage() {
  return (
    <div style={{ background: "#ffffff", color: "#1d1d1f", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />
      <LandingNav />

      {/* Hero */}
      <section style={{ paddingTop: 120, textAlign: "center", padding: "120px 24px 48px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Link
            href="/free-tools"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#0071e3",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              marginBottom: 24,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Free Tools
          </Link>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
              margin: "0 0 16px",
              color: "#1d1d1f",
            }}
          >
            AI YouTube Title Generator.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "#86868b",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Enter your topic, pick a style, and get 10 viral title ideas powered by AI. Free, no signup required.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <TitleGenTool />
        </div>
      </section>

      {/* Related Tools */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#1d1d1f",
              marginBottom: 16,
            }}
          >
            Related tools
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Description Generator", href: "/tools/youtube-description-generator" },
              { label: "Tag Generator", href: "/tools/youtube-tag-generator" },
              { label: "Thumbnail Size Guide", href: "/tools/youtube-thumbnail-size" },
              { label: "Money Calculator", href: "/tools/youtube-money-calculator" },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: "8px 16px",
                  background: "#f5f5f7",
                  color: "#1d1d1f",
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 980,
                  textDecoration: "none",
                  border: "1px solid #e5e5ea",
                  transition: "all 0.2s ease",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "#f5f5f7" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: "0 0 12px",
              color: "#1d1d1f",
              textAlign: "center",
            }}
          >
            Frequently asked questions.
          </h2>
          <p
            style={{
              fontSize: 19,
              color: "#86868b",
              textAlign: "center",
              margin: "0 auto 48px",
              maxWidth: 420,
              lineHeight: 1.5,
            }}
          >
            Everything about the title generator.
          </p>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center", background: "#ffffff" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#1d1d1f",
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            Want more? Sign up for TubeForge.
          </h2>
          <p style={{ fontSize: 19, color: "#86868b", margin: "0 0 32px", lineHeight: 1.5 }}>
            Unlimited AI generations plus 14 more creator tools. Free plan available.
          </p>
          <Link
            href="/register"
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
              transition: "all 0.3s ease",
              minHeight: 48,
            }}
          >
            Start Free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#f5f5f7", borderTop: "1px solid #e5e5ea", padding: 24, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#86868b" }}>{"\u00A9"} 2026 TubeForge. All rights reserved.</span>
      </footer>
    </div>
  );
}
