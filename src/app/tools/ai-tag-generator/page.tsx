import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { TagGenTool } from "./TagGenTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "AI Tag & Hashtag Generator — Find Trending Tags",
  description:
    "Generate 20-30 relevant YouTube tags and 5-10 hashtags for any video topic. AI-powered tag generator with Copy All button. Free — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Tag & Hashtag Generator — Find Trending Tags",
    description:
      "Get the perfect YouTube tags and hashtags for your videos with AI. 25+ optimized tags per generation — free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/ai-tag-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "AI Tag & Hashtag Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/ai-tag-generator" },
  twitter: {
    card: "summary_large_image",
    title: "AI Tag & Hashtag Generator",
    description: "Generate 25+ relevant YouTube tags and hashtags for any video topic. Free AI tool, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the YouTube tag and hashtag generator work?",
    a: "Our AI analyzes your video topic and generates 20-30 relevant tags plus 5-10 hashtags. It creates a mix of broad (high-volume) and specific (long-tail) keywords optimized for YouTube search and discovery.",
  },
  {
    q: "Do YouTube tags still matter for SEO in 2026?",
    a: "Yes, tags remain a ranking factor in YouTube's algorithm. While titles and descriptions carry more weight, tags help YouTube understand your content context and suggest it alongside related videos. They're especially important for niche topics and trending searches.",
  },
  {
    q: "What's the difference between tags and hashtags on YouTube?",
    a: "Tags are hidden metadata that help YouTube categorize your video. Hashtags appear visibly above your title and in the description — viewers can click them to find related content. Both are important for discoverability, and our tool generates both.",
  },
  {
    q: "How many tags should I use per video?",
    a: "YouTube allows up to 500 characters of tags. We recommend using 10-15 highly relevant tags rather than stuffing all 30. Focus on tags that accurately describe your content. For hashtags, YouTube displays up to 3 above your title — choose your best ones.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Tag & Hashtag Generator",
  description: "Free AI-powered YouTube tag and hashtag generator. Get 25+ relevant tags for any video topic.",
  url: "https://tubeforge.co/tools/ai-tag-generator",
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
    { "@type": "ListItem", position: 3, name: "AI Tag Generator", item: "https://tubeforge.co/tools/ai-tag-generator" },
  ],
};

/* -- Page --------------------------------------------------------- */

export default function YouTubeTagGeneratorPage() {
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
            <Display as="h1" style={{ maxWidth: 720 }}>AI Tag & Hashtag Generator</Display>
            <Lead style={{ maxWidth: 560 }}>Enter your topic and get 25+ relevant tags and hashtags optimized for YouTube search. Free, no signup required.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><TagGenTool /></Container>
      </Section>

      {/* Related tools */}
      <Section tight style={{ paddingTop: 0 }}>
        <Container width="narrow">
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-secondary)", letterSpacing: "0.01em", margin: "0 0 14px" }}>Related tools</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Title Generator", href: "/tools/ai-title-generator" },
              { label: "Description Generator", href: "/tools/ai-description-generator" },
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
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about YouTube tags and hashtags" />
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
