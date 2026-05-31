import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { TitleGeneratorTool } from "./TitleGeneratorTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "AI Title Generator — AI-Powered",
  description:
    "Generate 10 click-worthy, SEO-optimized YouTube title ideas for any topic in seconds. Free AI-powered title generator — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Title Generator — AI-Powered",
    description:
      "Generate catchy YouTube titles instantly with AI. 10 optimized variations per topic — free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/title-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "AI Title Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/title-generator" },
  twitter: {
    card: "summary_large_image",
    title: "AI Title Generator — AI-Powered",
    description: "Generate 10 catchy YouTube title ideas for any topic. Free AI tool, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the YouTube title generator work?",
    a: "Our AI analyzes your topic or keyword and generates 10 unique title variations using proven engagement patterns like numbers, power words, curiosity gaps, and how-to formats. The AI is trained on millions of high-performing YouTube titles.",
  },
  {
    q: "Is the title generator really free?",
    a: "Yes, you get 3 free title generations per day without signing up. Create a free TubeForge account for unlimited generations and access to additional AI tools.",
  },
  {
    q: "What makes a good YouTube title?",
    a: "A great YouTube title is under 60 characters, includes your main keyword, creates curiosity or promises value, and uses emotional triggers. Our AI considers all of these factors when generating titles.",
  },
  {
    q: "Can I edit the generated titles?",
    a: "Absolutely. The generated titles are starting points — feel free to mix, match, and customize them. Use the copy button to grab any title, then refine it to match your style and voice.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Title Generator",
  description: "AI-powered YouTube title generator. Create 10 click-worthy title variations for any video topic.",
  url: "https://tubeforge.co/free-tools/title-generator",
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

export default function TitleGeneratorPage() {
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
            <Display as="h1" style={{ maxWidth: 720 }}>AI Title Generator</Display>
            <Lead style={{ maxWidth: 560 }}>Enter your topic and get 10 click-worthy, SEO-optimized title ideas powered by AI. Free, no signup required.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><TitleGeneratorTool /></Container>
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
            <Headline>Want unlimited title generations?</Headline>
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
