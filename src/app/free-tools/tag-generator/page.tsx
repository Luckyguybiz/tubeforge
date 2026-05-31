import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { TagGeneratorTool } from "./TagGeneratorTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "AI Tag Generator — AI-Powered",
  description:
    "Generate 25 relevant, SEO-friendly YouTube tags for any video topic. Mix of broad and long-tail keywords for maximum discoverability. Free, no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Tag Generator — AI-Powered",
    description:
      "Get the perfect YouTube tags for your videos with AI. 25 optimized tags per generation — free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/tag-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "AI Tag Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/tag-generator" },
  twitter: {
    card: "summary_large_image",
    title: "AI Tag Generator — AI-Powered",
    description: "Generate 25 relevant YouTube tags for any video topic. Free AI tool, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the YouTube tag generator work?",
    a: "Our AI analyzes your video topic and generates 25 relevant tags using a mix of broad (high-volume) and specific (long-tail) keywords. It considers current trends, related topics, and YouTube SEO best practices.",
  },
  {
    q: "Do YouTube tags still matter for SEO?",
    a: "While tags are less important than titles and descriptions, they still help YouTube understand your content and suggest it alongside related videos. Proper tagging can improve your discoverability, especially for niche topics.",
  },
  {
    q: "How many tags should I use on YouTube?",
    a: "YouTube allows up to 500 characters of tags. Aim for 10-15 highly relevant tags. Using too many generic tags can actually hurt your ranking. Our generator provides 25 options so you can pick the most relevant ones.",
  },
  {
    q: "Can I use all the generated tags at once?",
    a: "We recommend reviewing the generated tags and selecting the 10-15 most relevant ones for your specific video. Use the 'Copy All' button to grab them all, then remove any that don't perfectly match your content.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Tag Generator",
  description: "AI-powered YouTube tag generator. Get 25 relevant, SEO-friendly tags for any video topic.",
  url: "https://tubeforge.co/free-tools/tag-generator",
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

export default function TagGeneratorPage() {
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
            <Display as="h1" style={{ maxWidth: 720 }}>AI Tag Generator</Display>
            <Lead style={{ maxWidth: 560 }}>Get 25 relevant, SEO-friendly tags for your video topic. Mix of broad and long-tail keywords. Free, no signup required.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><TagGeneratorTool /></Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about the tag generator." />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Want unlimited tag generations?</Headline>
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
