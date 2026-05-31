import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ThumbnailSizeTool } from "./ThumbnailSizeTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Video Thumbnail Size Guide 2026 — Dimensions, Resolution & Tips",
  description:
    "video thumbnail size is 1280x720 pixels (16:9 aspect ratio). Upload your image to preview how it looks in YouTube search, feed, and mobile. Complete 2026 size guide included.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Video Thumbnail Size Guide 2026 — Dimensions, Resolution & Tips",
    description:
      "Video thumbnail dimensions: 1280x720px, 16:9 ratio, max 2MB. Upload your thumbnail to check dimensions and preview it in YouTube layouts.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/thumbnail-size-guide",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Video Thumbnail Size Guide 2026" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/thumbnail-size-guide" },
  twitter: {
    card: "summary_large_image",
    title: "Video Thumbnail Size Guide 2026",
    description: "video thumbnail: 1280x720px, 16:9, max 2MB. Free checker tool to preview your thumbnail in YouTube layouts.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "What size should a video thumbnail be?",
    a: "YouTube recommends 1280x720 pixels with a 16:9 aspect ratio. The minimum width is 640 pixels. The file must be under 2MB in JPG, PNG, GIF, or BMP format. This size works optimally across desktop, tablet, and mobile layouts.",
  },
  {
    q: "What aspect ratio is best for video thumbnails?",
    a: "16:9 is the standard and recommended aspect ratio. If your thumbnail is a different ratio, YouTube will add black bars or crop it. Always design at 1280x720 or higher resolution in 16:9 to ensure consistent display across all devices.",
  },
  {
    q: "How do I enable custom thumbnails on YouTube?",
    a: "You need a verified YouTube account. Go to YouTube Studio > Settings > Channel > Feature eligibility and verify your phone number. Once verified, you can upload custom thumbnails for all your videos.",
  },
  {
    q: "Does the thumbnail checker upload my image?",
    a: "No. All analysis happens entirely in your browser using the HTML5 Canvas API. Your image never leaves your device. The tool checks dimensions, file size, and aspect ratio locally and shows previews using CSS scaling.",
  },
  {
    q: "What makes a video thumbnail stand out?",
    a: "High-contrast colors, expressive faces, large readable text (3-5 words max), a clean focal point, and bright backgrounds. Avoid clutter and small details — thumbnails are often displayed at just 120px wide on mobile.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "YouTube Thumbnail Size Checker",
  description: "Check your video thumbnail dimensions, file size, and aspect ratio. Preview how it looks in YouTube search, feed, and mobile.",
  url: "https://tubeforge.co/tools/thumbnail-size-guide",
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

const HOWTO_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Create the Perfect YouTube Thumbnail",
  description: "Step-by-step guide to creating video thumbnails that get clicks.",
  step: [
    {
      "@type": "HowToStep",
      name: "Set the correct dimensions",
      text: "Create your thumbnail at 1280x720 pixels with a 16:9 aspect ratio.",
    },
    {
      "@type": "HowToStep",
      name: "Keep file size under 2MB",
      text: "Export your thumbnail as JPG or PNG, keeping the file size under 2MB for YouTube's upload limit.",
    },
    {
      "@type": "HowToStep",
      name: "Use high contrast",
      text: "Use bold colors and strong contrast so your thumbnail stands out in search results and the feed.",
    },
    {
      "@type": "HowToStep",
      name: "Add readable text",
      text: "Add 3-5 words of large, bold text that's readable even at 120px wide (mobile thumbnail size).",
    },
    {
      "@type": "HowToStep",
      name: "Test with the checker",
      text: "Upload your thumbnail to our free checker to preview how it looks across YouTube layouts.",
    },
  ],
};

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tubeforge.co" },
    { "@type": "ListItem", position: 2, name: "Free Tools", item: "https://tubeforge.co/free-tools" },
    { "@type": "ListItem", position: 3, name: "YouTube Thumbnail Size", item: "https://tubeforge.co/tools/thumbnail-size-guide" },
  ],
};

/* -- Spec table data ---------------------------------------------- */

const SPECS = [
  { label: "Recommended resolution", value: "1280 x 720 px" },
  { label: "Minimum width", value: "640 px" },
  { label: "Aspect ratio", value: "16:9" },
  { label: "Max file size", value: "2 MB" },
  { label: "Accepted formats", value: "JPG, PNG, GIF, BMP" },
  { label: "Color space", value: "sRGB" },
];

/* -- Page --------------------------------------------------------- */

export default function YouTubeThumbnailSizePage() {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_JSON_LD) }}
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
            <Display as="h1" style={{ maxWidth: 720 }}>Video Thumbnail Size Guide</Display>
            <Lead style={{ maxWidth: 560 }}>Everything you need to know about video thumbnail dimensions in 2026. Plus a free checker to preview how your thumbnail looks across layouts.</Lead>
          </div>
        </Container>
      </Section>

      {/* Specs Table */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)", paddingBottom: 0 }}>
        <Container width="narrow">
          <div style={{ background: "var(--bg-secondary)", borderRadius: 18, border: "1px solid var(--border-subtle, rgba(128,128,128,0.14))", overflow: "hidden" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border-subtle, rgba(128,128,128,0.14))" }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--fg-primary)", margin: 0 }}>
                YouTube Thumbnail Specifications
              </h2>
            </div>
            {SPECS.map((spec, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderBottom: i < SPECS.length - 1 ? "1px solid var(--border-subtle, rgba(128,128,128,0.14))" : "none" }}>
                <span style={{ fontSize: 15, color: "var(--fg-secondary)" }}>{spec.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-primary)" }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Content guide */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)", paddingBottom: 0 }}>
        <Container width="narrow">
          <Headline style={{ fontSize: "clamp(24px, 3.5vw, 32px)", marginBottom: 20 }}>Why thumbnail size matters</Headline>
          <div style={{ fontSize: 17, color: "var(--fg-secondary)", lineHeight: 1.8 }}>
            <p style={{ margin: "0 0 16px" }}>
              Your thumbnail is the first thing viewers see when browsing YouTube. It appears at different sizes depending on the context: large in suggested videos (around 360px wide), medium in search results (around 246px), and small on mobile (around 120px).
            </p>
            <p style={{ margin: "0 0 16px" }}>
              Uploading at the recommended <strong>1280x720 pixels</strong> ensures your thumbnail looks sharp at every size. If you upload a smaller image, YouTube will upscale it, making it blurry. If the aspect ratio is off, YouTube adds black letterbox bars.
            </p>
            <p style={{ margin: "0 0 16px" }}>
              Keep the file under <strong>2MB</strong> by exporting as JPG at 80-90% quality. PNG works well for graphics-heavy thumbnails but produces larger files. Always use <strong>sRGB color space</strong> to ensure colors look consistent across devices.
            </p>
          </div>
        </Container>
      </Section>

      {/* Interactive Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow">
          <Headline style={{ fontSize: "clamp(24px, 3.5vw, 32px)", marginBottom: 12 }}>Check your thumbnail</Headline>
          <Lead style={{ marginBottom: 24, maxWidth: 600 }}>Upload an image to check dimensions, file size, and aspect ratio. Preview how it looks in different YouTube layouts. 100% client-side.</Lead>
          <ThumbnailSizeTool />
        </Container>
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
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Video thumbnail dimensions and best practices." />
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
            <Lead style={{ maxWidth: 480 }}>AI thumbnail designer with A/B testing, generation, and analysis. Free plan available.</Lead>
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
