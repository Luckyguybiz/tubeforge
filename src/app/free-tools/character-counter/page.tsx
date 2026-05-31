import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { CharacterCounterTool } from "./CharacterCounterTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Video Title Character Counter — Title, Description & Tag Limits",
  description:
    "Free character counter for titles (100), descriptions (5000), and tags (500). Real-time counting with color indicators and optimal length tips. No signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Video Title Character Counter — Title, Description & Tag Limits",
    description:
      "Check your YouTube title, description, and tag character counts in real time. Color-coded indicators show when you hit optimal length.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/character-counter",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Video Title Character Counter" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/character-counter" },
  twitter: {
    card: "summary_large_image",
    title: "Video Title Character Counter",
    description: "Real-time character counter for YouTube titles (100), descriptions (5000), and tags (500). Free, no signup.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "What is the YouTube title character limit?",
    a: "YouTube allows up to 100 characters for video titles. However, titles are truncated at around 70 characters in search results and suggested videos. For optimal CTR, aim for 40-70 characters.",
  },
  {
    q: "What is the YouTube description character limit?",
    a: "YouTube allows up to 5,000 characters for video descriptions. Only the first 2-3 lines (roughly 200 characters) are shown above the fold. Include your most important keywords and information in those first 200 characters.",
  },
  {
    q: "What is the YouTube tags character limit?",
    a: "YouTube allows up to 500 characters total for all tags combined. This is the total character count, not the number of tags. Use a mix of broad and specific long-tail keyword tags for best SEO results.",
  },
  {
    q: "How does the color indicator work?",
    a: "The counter uses four color states: blue means your text is shorter than optimal, green means optimal length, orange means it is getting long but still within limits, and red means you have exceeded the maximum character limit.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Video Title Character Counter",
  description: "Free real-time character counter for YouTube titles (100 chars), descriptions (5000 chars), and tags (500 chars) with color-coded length indicators.",
  url: "https://tubeforge.co/free-tools/character-counter",
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

export default function CharacterCounterPage() {
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
            <Display as="h1" style={{ maxWidth: 720 }}>Character Counter</Display>
            <Lead style={{ maxWidth: 560 }}>Check your YouTube title, description, and tag character counts in real time. Color-coded indicators show when you hit optimal length.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><CharacterCounterTool /></Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="YouTube character limits explained" />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Optimize your entire channel</Headline>
            <Lead style={{ maxWidth: 480 }}>Sign up for TubeForge to access AI-powered title, description, and tag generators.</Lead>
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
