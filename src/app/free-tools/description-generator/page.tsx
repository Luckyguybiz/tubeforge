import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { DescriptionGeneratorTool } from "./DescriptionGeneratorTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "AI Description Generator — AI-Powered",
  description:
    "Generate SEO-optimized YouTube descriptions with timestamps, hashtags, and links. Free AI-powered description generator — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Description Generator — AI-Powered",
    description:
      "Create perfect YouTube descriptions in seconds with AI. Includes timestamps, hashtags, and links — free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/description-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "AI Description Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/description-generator" },
  twitter: {
    card: "summary_large_image",
    title: "AI Description Generator — AI-Powered",
    description: "Generate SEO-optimized YouTube descriptions with timestamps and hashtags. Free, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the YouTube description generator work?",
    a: "Enter your video title and optional keywords, and our AI creates a complete, SEO-optimized description including an engaging hook, detailed body, timestamp placeholders, links section, and relevant hashtags.",
  },
  {
    q: "Why are YouTube descriptions important for SEO?",
    a: "YouTube descriptions help the algorithm understand your video content and rank it for relevant searches. A well-optimized description with keywords can significantly increase your video's discoverability and click-through rate.",
  },
  {
    q: "How long should a YouTube description be?",
    a: "YouTube allows up to 5,000 characters. For best results, aim for at least 200-300 words. Include your main keywords naturally, add timestamps for longer videos, and include relevant links and hashtags.",
  },
  {
    q: "Can I customize the generated description?",
    a: "Yes, the generated description is a strong starting point. Use the copy button to grab it, then personalize it with your specific timestamps, links, and additional details that are unique to your video.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Description Generator",
  description: "AI-powered YouTube description generator. Create SEO-optimized descriptions with timestamps, hashtags, and links.",
  url: "https://tubeforge.co/free-tools/description-generator",
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

/* -- Page --------------------------------------------------------- */

export default function DescriptionGeneratorPage() {
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
            <Display as="h1" style={{ maxWidth: 720 }}>AI Description Generator</Display>
            <Lead style={{ maxWidth: 560 }}>Generate SEO-optimized descriptions with timestamps, hashtags, and links. Free, no signup required.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><DescriptionGeneratorTool /></Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about the description generator" />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Want unlimited descriptions?</Headline>
            <Lead style={{ maxWidth: 480 }}>Sign up for TubeForge to get unlimited AI generations plus 14 more creator tools.</Lead>
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
