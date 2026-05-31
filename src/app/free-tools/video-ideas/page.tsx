import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { VideoIdeasTool } from "./VideoIdeasTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free AI Video Ideas Generator — Get Trending Topics",
  description:
    "Generate 50+ YouTube video ideas categorized by trending, evergreen, Shorts, and series concepts. AI-powered for any niche. Free, no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free AI Video Ideas Generator",
    description:
      "Get 50+ video ideas for your YouTube channel — trending, evergreen, Shorts, and series concepts. AI-powered, free.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/video-ideas",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free AI Video Ideas Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/video-ideas" },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Video Ideas Generator",
    description: "Generate 50+ YouTube video ideas categorized by type. AI-powered, free, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the YouTube video ideas generator work?",
    a: "Select your niche or enter a custom topic, and our AI generates 50+ video ideas categorized into trending topics, evergreen content, Shorts ideas, and series concepts. Each idea is tailored to your specific niche and current audience interests.",
  },
  {
    q: "What types of video ideas does the generator provide?",
    a: "The generator produces four categories: trending topics (timely content that capitalizes on current interest), evergreen content (videos that stay relevant long-term), Shorts ideas (quick vertical video concepts), and series concepts (multi-part content to build audience retention).",
  },
  {
    q: "How do I choose which video ideas to pursue?",
    a: "Focus on ideas that match your expertise and audience interests. Prioritize a mix of trending topics for quick growth and evergreen content for sustained views. Check YouTube search suggestions to validate demand before committing to a topic.",
  },
  {
    q: "Can I generate ideas for any YouTube niche?",
    a: "Yes, the generator works for any niche including gaming, tech, cooking, fitness, finance, education, beauty, travel, and more. You can also enter a custom topic if your niche is not listed in the preset options.",
  },
  {
    q: "Is the video ideas generator free?",
    a: "Yes, you get 3 free generations per day without signing up. Create a free TubeForge account for unlimited generations and access to additional AI tools for titles, descriptions, scripts, and thumbnails.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free AI Video Ideas Generator",
  description: "AI-powered YouTube video ideas generator. Get 50+ ideas categorized by trending, evergreen, Shorts, and series concepts for any niche.",
  url: "https://tubeforge.co/free-tools/video-ideas",
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

export default function VideoIdeasPage() {
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
            <Display as="h1" style={{ maxWidth: 720 }}>Video Ideas Generator</Display>
            <Lead style={{ maxWidth: 560 }}>Choose your niche and get 50+ video ideas categorized by trending, evergreen, Shorts, and series concepts.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><VideoIdeasTool /></Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about the video ideas generator" />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Turn ideas into videos</Headline>
            <Lead style={{ maxWidth: 480 }}>Sign up for TubeForge to generate scripts, thumbnails, and publish — all from one platform.</Lead>
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
