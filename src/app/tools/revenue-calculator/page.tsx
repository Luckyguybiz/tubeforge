import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { MoneyCalcTool } from "./MoneyCalcTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Creator Revenue Calculator — Estimate Ad Earnings",
  description:
    "Estimate ad revenue for short-form video creators based on daily views and CPM. Daily, monthly, and yearly breakdowns. Free tool — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Creator Revenue Calculator — Estimate Ad Earnings",
    description:
      "How much can a short-form video creator earn? Estimate ad revenue based on views and CPM. Free calculator with daily, monthly, and yearly breakdowns.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/revenue-calculator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Creator Revenue Calculator" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/revenue-calculator" },
  twitter: {
    card: "summary_large_image",
    title: "Creator Revenue Calculator",
    description: "Estimate creator ad earnings. Calculate daily, monthly, and yearly revenue based on views and CPM. Free tool.",
    images: ["/api/og"],
  },
};

const FAQ_ITEMS = [
  {
    q: "How does the creator revenue calculator work?",
    a: "The calculator estimates ad earnings using the formula: Revenue = (Daily Views x CPM) / 1000. CPM (Cost Per Mille) is the amount advertisers pay per 1,000 ad impressions. We provide low, mid, and high CPM estimates since actual rates vary by niche, audience location, and season. This is a TubeForge calculator — estimates are illustrative and not from any specific platform.",
  },
  {
    q: "What is a typical CPM for short-form creators?",
    a: "Average CPM ranges from $1 to $5 for general content. Some niches earn much more: finance ($12-15), technology ($6-10), business ($8-12), and education ($5-8). CPM varies significantly by audience demographics, with US/UK viewers commanding the highest rates.",
  },
  {
    q: "How much do platforms pay per 1,000 views?",
    a: "Short-form video platforms typically pay creators $1-5 per 1,000 views via ad-share programs, though this varies widely. Most platforms take a 45% cut of ad revenue, so a $4 CPM means the creator earns roughly $2.20 per 1,000 views. Top niches like finance can earn $10+ per 1,000 views.",
  },
  {
    q: "Are these earnings estimates accurate?",
    a: "These are rough estimates based on industry averages. Actual earnings depend on many factors: niche, audience location, ad types enabled, viewer engagement, platform premium subscriptions, and seasonal fluctuations. Use these as a general guideline, not exact figures.",
  },
  {
    q: "How can I increase my video earnings?",
    a: "Focus on high-CPM niches, grow your audience in high-value markets (US, UK, Canada), enable all ad formats, create longer videos for mid-roll ads, diversify with sponsorships and memberships, and consistently publish content to grow your audience.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Creator Revenue Calculator",
  description: "Estimate creator ad earnings based on daily views and CPM. Calculate daily, monthly, and yearly revenue.",
  url: "https://tubeforge.co/tools/revenue-calculator",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  isPartOf: { "@type": "WebSite", name: "TubeForge", url: "https://tubeforge.co" },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tubeforge.co" },
    { "@type": "ListItem", position: 2, name: "Free Tools", item: "https://tubeforge.co/free-tools" },
    { "@type": "ListItem", position: 3, name: "Creator Revenue Calculator", item: "https://tubeforge.co/tools/revenue-calculator" },
  ],
};

export default function CreatorRevenueCalculatorPage() {
  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--fg-primary)", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="narrow">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
            <Link href="/free-tools" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-brand-500, #6366f1)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              All free tools
            </Link>
            <Eyebrow>Free tool · No signup</Eyebrow>
            <Display as="h1" style={{ maxWidth: 720 }}>Creator Revenue Calculator</Display>
            <Lead style={{ maxWidth: 560 }}>Estimate ad earnings for short-form video creators based on daily views and CPM. See daily, monthly, and yearly breakdowns.</Lead>
            <div role="note" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle, rgba(128,128,128,0.14))", padding: "12px 16px", borderRadius: 10, fontSize: 13, color: "var(--fg-secondary)", margin: "8px auto 0", maxWidth: 560, lineHeight: 1.5 }}>
              This is a TubeForge calculator. Estimates are illustrative based on industry averages and are not from or affiliated with any specific platform.
            </div>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><MoneyCalcTool /></Container>
      </Section>

      {/* Related tools */}
      <Section tight style={{ paddingTop: 0 }}>
        <Container width="narrow">
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-secondary)", letterSpacing: "0.01em", margin: "0 0 14px" }}>Related tools</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Title Generator", href: "/tools/ai-title-generator" },
              { label: "Description Generator", href: "/tools/ai-description-generator" },
              { label: "Tag Generator", href: "/tools/ai-tag-generator" },
              { label: "Thumbnail Size Guide", href: "/tools/thumbnail-size-guide" },
            ].map((t) => (
              <Link key={t.href} href={t.href} style={{ padding: "8px 16px", background: "var(--bg-secondary)", color: "var(--fg-primary)", fontSize: 14, fontWeight: 500, borderRadius: 999, textDecoration: "none", border: "1px solid var(--border-subtle, rgba(128,128,128,0.14))" }}>
                {t.label}
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Creator earnings and revenue estimates." />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Want more? Sign up for TubeForge.</Headline>
            <Lead style={{ maxWidth: 480 }}>Grow your channel with AI-powered tools for titles, descriptions, thumbnails, and more. Free plan available.</Lead>
            <div style={{ marginTop: 6 }}><CTA href="/register">Start free</CTA></div>
          </div>
        </Container>
      </Section>

      <footer style={{ borderTop: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", padding: 32, textAlign: "center" }}>
        <Caption>{"©"} 2026 TubeForge. All rights reserved.</Caption>
      </footer>
    </div>
  );
}
