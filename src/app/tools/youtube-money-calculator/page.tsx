import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { MoneyCalcTool } from "./MoneyCalcTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "YouTube Money Calculator — Estimate Channel Earnings | TubeForge",
  description:
    "Estimate YouTube channel earnings based on daily views and CPM. Calculate daily, monthly, and yearly revenue. Free tool with animated results — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "YouTube Money Calculator — Estimate Channel Earnings | TubeForge",
    description:
      "How much money can you make on YouTube? Estimate earnings based on views and CPM. Free calculator with daily, monthly, and yearly breakdowns.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/youtube-money-calculator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "YouTube Money Calculator" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/youtube-money-calculator" },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Money Calculator | TubeForge",
    description: "Estimate YouTube channel earnings. Calculate daily, monthly, and yearly revenue based on views and CPM. Free tool.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the YouTube money calculator work?",
    a: "The calculator estimates your earnings using the formula: Revenue = (Daily Views x CPM) / 1000. CPM (Cost Per Mille) is the amount advertisers pay per 1,000 ad impressions. We provide low, mid, and high CPM estimates since actual rates vary by niche, audience location, and season.",
  },
  {
    q: "What is a good CPM on YouTube?",
    a: "Average YouTube CPM ranges from $1 to $5 for most channels. However, some niches earn much more: finance ($12-15), technology ($6-10), business ($8-12), and education ($5-8). CPM varies significantly by audience demographics, with US/UK viewers commanding the highest rates.",
  },
  {
    q: "How much does YouTube pay per 1,000 views?",
    a: "YouTube typically pays creators $1-5 per 1,000 views through AdSense, but this varies widely. YouTube takes a 45% cut of ad revenue, so a $4 CPM means the creator earns about $2.20 per 1,000 views. Top niches like finance can earn $10+ per 1,000 views.",
  },
  {
    q: "Are these earnings estimates accurate?",
    a: "These are rough estimates based on industry averages. Actual earnings depend on many factors: your niche, audience location, ad types enabled, viewer engagement, YouTube Premium revenue, and seasonal fluctuations. Use these as a general guideline, not exact figures.",
  },
  {
    q: "How can I increase my YouTube earnings?",
    a: "Focus on high-CPM niches, grow your audience in high-value markets (US, UK, Canada), enable all ad formats, create longer videos for mid-roll ads, diversify with sponsorships and memberships, and consistently publish content to grow your subscriber base.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "YouTube Money Calculator",
  description: "Estimate YouTube channel earnings based on daily views and CPM. Calculate daily, monthly, and yearly revenue.",
  url: "https://tubeforge.co/tools/youtube-money-calculator",
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
    { "@type": "ListItem", position: 3, name: "YouTube Money Calculator", item: "https://tubeforge.co/tools/youtube-money-calculator" },
  ],
};

/* -- Page --------------------------------------------------------- */

export default function YouTubeMoneyCalculatorPage() {
  return (
    <div style={{ background: "#0a0a0a", color: "#ffffff", minHeight: "100vh" }}>
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
              color: "#6366f1",
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
              color: "#ffffff",
            }}
          >
            YouTube Money Calculator.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Estimate how much a YouTube channel earns based on daily views and CPM. See daily, monthly, and yearly breakdowns.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <MoneyCalcTool />
        </div>
      </section>

      {/* Related Tools */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            Related tools
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Title Generator", href: "/tools/youtube-title-generator" },
              { label: "Description Generator", href: "/tools/youtube-description-generator" },
              { label: "Tag Generator", href: "/tools/youtube-tag-generator" },
              { label: "Thumbnail Size Guide", href: "/tools/youtube-thumbnail-size" },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: "8px 16px",
                  background: "#111111",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 980,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.06)",
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
      <section style={{ padding: "80px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: "0 0 12px",
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            Frequently asked questions.
          </h2>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              margin: "0 auto 48px",
              maxWidth: 420,
              lineHeight: 1.5,
            }}
          >
            YouTube earnings and revenue estimates.
          </p>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center", background: "#0a0a0a" }}>
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
            Want more? Sign up for TubeForge.
          </h2>
          <p style={{ fontSize: 19, color: "rgba(255,255,255,0.5)", margin: "0 0 32px", lineHeight: 1.5 }}>
            Grow your channel with AI-powered tools for titles, descriptions, thumbnails, and more. Free plan available.
          </p>
          <Link
            href="/register"
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
      <footer style={{ background: "#111111", borderTop: "1px solid rgba(255,255,255,0.06)", padding: 24, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{"\u00A9"} 2026 TubeForge. All rights reserved.</span>
      </footer>
    </div>
  );
}
