import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { TitleGenTool } from "./TitleGenTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free AI Title Generator — Create Viral Video Titles",
  description:
    "Generate 10 viral, click-worthy video title ideas for any topic. Choose from educational, entertainment, tutorial, or listicle styles. Free AI tool — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free AI Title Generator — Create Viral Video Titles",
    description:
      "Generate 10 viral video titles instantly with AI. Choose your style — educational, entertainment, tutorial, or listicle. Free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/ai-title-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "AI Title Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/ai-title-generator" },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Title Generator — Create Viral Video Titles",
    description: "Generate 10 viral video title ideas for any topic. Free AI tool, no signup required.",
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
  name: "AI Title Generator",
  description: "Free AI-powered YouTube title generator with style selection. Create 10 viral title variations for any video topic.",
  url: "https://tubeforge.co/tools/ai-title-generator",
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
    { "@type": "ListItem", position: 3, name: "AI Title Generator", item: "https://tubeforge.co/tools/ai-title-generator" },
  ],
};

/* -- Page --------------------------------------------------------- */

export default function YouTubeTitleGeneratorPage() {
  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--fg-primary)", minHeight: "100vh" }}>
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
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="narrow">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
            <Link href="/free-tools" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-brand-500, #6366f1)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              All free tools
            </Link>
            <Eyebrow>Free tool · No signup</Eyebrow>
            <Display as="h1" style={{ maxWidth: 720 }}>AI Title Generator</Display>
            <Lead style={{ maxWidth: 560 }}>Enter your topic, pick a style, and get 10 viral title ideas powered by AI. Free, no signup required.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><TitleGenTool /></Container>
      </Section>

      {/* Related tools */}
      <Section tight style={{ paddingTop: 0 }}>
        <Container width="narrow">
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-secondary)", letterSpacing: "0.01em", margin: "0 0 14px" }}>Related tools</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Description Generator", href: "/tools/ai-description-generator" },
              { label: "Tag Generator", href: "/tools/ai-tag-generator" },
              { label: "Thumbnail Size Guide", href: "/tools/thumbnail-size-guide" },
              { label: "Money Calculator", href: "/tools/revenue-calculator" },
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
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about the title generator" />
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
            <Lead style={{ maxWidth: 480 }}>Unlimited AI generations plus 14 more creator tools. Free plan available.</Lead>
            <div style={{ marginTop: 6 }}><CTA href="/register">Start free</CTA></div>
          </div>
        </Container>
      </Section>

      <footer style={{ borderTop: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", padding: 32, textAlign: "center" }}>
        <Caption>{"\u00A9"} 2026 TubeForge. All rights reserved.</Caption>
      </footer>
    </div>
  );
}
