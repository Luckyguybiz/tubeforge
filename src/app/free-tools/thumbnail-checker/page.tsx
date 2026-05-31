import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ThumbnailCheckerTool } from "./ThumbnailCheckerTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free Thumbnail Checker — Text & Contrast Analysis",
  description:
    "Upload your YouTube thumbnail and get instant analysis of text readability, color contrast, brightness, and composition. Free tool, no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free Thumbnail Checker",
    description:
      "Analyze your YouTube thumbnails for readability, contrast, and composition. Free instant analysis — no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/thumbnail-checker",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free Thumbnail Checker" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/thumbnail-checker" },
  twitter: {
    card: "summary_large_image",
    title: "Free Thumbnail Checker",
    description: "Upload a thumbnail and get instant readability, contrast, and composition analysis. Free, no signup.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the thumbnail checker analyze my image?",
    a: "The tool uses client-side canvas analysis to evaluate your thumbnail. It checks brightness distribution, color contrast, saturation, edge density (composition complexity), and estimates face detection based on skin-tone pixel regions. No image is uploaded to any server.",
  },
  {
    q: "What is the ideal YouTube thumbnail size?",
    a: "YouTube recommends 1280x720 pixels (16:9 aspect ratio) with a minimum width of 640 pixels. The file should be under 2MB in JPG, PNG, or GIF format. Our checker will flag if your image deviates from these recommendations.",
  },
  {
    q: "What makes a good YouTube thumbnail?",
    a: "Great thumbnails have high contrast, readable text (even at small sizes), a clear focal point, expressive faces, and bright colors. Avoid clutter — keep text to 3-5 words maximum. Our tool scores your thumbnail on these key factors.",
  },
  {
    q: "Is my thumbnail uploaded to a server?",
    a: "No. All analysis happens entirely in your browser using the HTML5 Canvas API. Your image never leaves your device — the tool is 100% client-side and private.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free Thumbnail Checker",
  description: "Analyze YouTube thumbnails for text readability, contrast, and composition. Client-side analysis, no upload required.",
  url: "https://tubeforge.co/free-tools/thumbnail-checker",
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

export default function ThumbnailCheckerPage() {
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
            <Display as="h1" style={{ maxWidth: 720 }}>Thumbnail Checker</Display>
            <Lead style={{ maxWidth: 560 }}>Upload your thumbnail and get instant analysis of readability, contrast, and composition. 100% client-side — your image never leaves your browser.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><ThumbnailCheckerTool /></Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about the thumbnail checker" />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Create better thumbnails with AI</Headline>
            <Lead style={{ maxWidth: 480 }}>Sign up for TubeForge to access the AI thumbnail designer with A/B testing and generation.</Lead>
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
