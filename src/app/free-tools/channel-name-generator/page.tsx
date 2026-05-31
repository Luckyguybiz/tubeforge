import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ChannelNameGeneratorTool } from "./ChannelNameGeneratorTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free Creator Name Generator — AI-Powered Ideas",
  description:
    "Generate 20 creative, brandable YouTube channel name ideas for any niche using AI. Free channel name generator — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free Creator Name Generator — AI-Powered",
    description:
      "Get 20 unique channel name ideas for your YouTube niche. AI-powered, free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/channel-name-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free Creator Name Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/channel-name-generator" },
  twitter: {
    card: "summary_large_image",
    title: "Free Creator Name Generator",
    description: "Generate 20 creative YouTube channel name ideas for any niche. Free AI tool, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the channel name generator work?",
    a: "Our AI analyzes your niche and style preference to generate 20 unique, brandable channel name ideas. It considers memorability, uniqueness, relevance to your topic, and available naming patterns used by successful creators.",
  },
  {
    q: "Is the channel name generator free?",
    a: "Yes, you get 3 free generations per day without signing up. Create a free TubeForge account for unlimited generations and access to additional AI tools.",
  },
  {
    q: "What makes a good YouTube channel name?",
    a: "A great channel name is short (1-3 words), easy to spell and pronounce, memorable, relevant to your niche, and unique enough to search for. Avoid numbers and special characters. Our AI considers all of these factors.",
  },
  {
    q: "Should I use my real name for my YouTube channel?",
    a: "Using your real name works well for personal brands and vlogs, but a creative brand name is better for topic-focused channels. Our generator offers both personal name-based and brandable style options.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free Creator Name Generator",
  description: "AI-powered YouTube channel name generator. Get 20 creative, brandable name ideas for any niche.",
  url: "https://tubeforge.co/free-tools/channel-name-generator",
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

export default function ChannelNameGeneratorPage() {
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
            <Display as="h1" style={{ maxWidth: 720 }}>Channel Name Generator</Display>
            <Lead style={{ maxWidth: 560 }}>Enter your niche and style preference to get 20 creative, brandable YouTube channel name ideas powered by AI.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><ChannelNameGeneratorTool /></Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about the channel name generator" />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Want unlimited name generations?</Headline>
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
