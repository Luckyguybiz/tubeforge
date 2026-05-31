import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ShortsDimensionsTool } from "./ShortsDimensionsTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Vertical Video (Shorts) Dimensions Guide 2026 — Resolution, Length",
  description:
    "Complete YouTube Shorts dimensions guide: 1080x1920 pixels, 9:16 aspect ratio, max 60 seconds. Upload an image to preview how it looks as a Short. Free tool.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Vertical Video (Shorts) Dimensions Guide 2026",
    description:
      "Everything you need to know about YouTube Shorts dimensions: resolution, aspect ratio, file size, and length. Interactive preview tool included.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/shorts-dimensions",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "YouTube Shorts Dimensions Guide 2026" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/shorts-dimensions" },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Shorts Dimensions Guide 2026",
    description: "1080x1920, 9:16 aspect ratio, max 60 seconds. Full guide + interactive preview tool.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "What is the ideal resolution for YouTube Shorts?",
    a: "The ideal resolution is 1080x1920 pixels (Full HD vertical). YouTube supports up to 4K (2160x3840) for Shorts, but 1080x1920 is the recommended standard for the best balance of quality and file size.",
  },
  {
    q: "What aspect ratio do YouTube Shorts use?",
    a: "YouTube Shorts use a 9:16 vertical aspect ratio. This is the standard portrait orientation used by most smartphones. Videos with different aspect ratios may be cropped or letterboxed.",
  },
  {
    q: "What is the maximum length for YouTube Shorts?",
    a: "YouTube Shorts can be up to 60 seconds long. There is no minimum length, but Shorts under 15 seconds tend to get more loop plays. The sweet spot for engagement is typically 15-30 seconds.",
  },
  {
    q: "What file formats does YouTube accept for Shorts?",
    a: "YouTube accepts MP4, MOV, AVI, WMV, FLV, 3GPP, and WebM formats for Shorts. MP4 with H.264 encoding is recommended for the best compatibility and upload speed.",
  },
  {
    q: "What is the maximum file size for YouTube Shorts?",
    a: "YouTube allows uploads up to 256 GB or 12 hours, whichever is less. For Shorts (max 60 seconds), typical file sizes range from 20-100 MB depending on resolution and bitrate.",
  },
  {
    q: "Can I upload horizontal videos as Shorts?",
    a: "Technically yes, but horizontal (16:9) videos will appear with large black bars above and below, significantly reducing the viewable area. Always shoot or export in 9:16 vertical format for the best Shorts experience.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

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
  name: "How to Create YouTube Shorts with the Correct Dimensions",
  description: "Step-by-step guide to creating YouTube Shorts with the correct 1080x1920 resolution and 9:16 aspect ratio.",
  step: [
    {
      "@type": "HowToStep",
      name: "Set your camera or export settings to 9:16",
      text: "Open your camera app or video editor and set the aspect ratio to 9:16 (vertical/portrait mode). Most smartphones shoot in this ratio natively.",
    },
    {
      "@type": "HowToStep",
      name: "Set resolution to 1080x1920",
      text: "In your camera or editing software, set the export resolution to 1080x1920 pixels (Full HD vertical). This is the recommended resolution for YouTube Shorts.",
    },
    {
      "@type": "HowToStep",
      name: "Keep your video under 60 seconds",
      text: "YouTube Shorts must be 60 seconds or less. For best engagement, aim for 15-30 seconds. Include a hook in the first 2 seconds.",
    },
    {
      "@type": "HowToStep",
      name: "Export as MP4 with H.264 encoding",
      text: "Export your video as MP4 with H.264 encoding for the best compatibility. Use a bitrate of 8-12 Mbps for 1080p.",
    },
    {
      "@type": "HowToStep",
      name: "Upload to YouTube with #Shorts in the title or description",
      text: "Upload your vertical video to YouTube and include #Shorts in the title or description to ensure it is recognized as a Short.",
    },
  ],
};

/* -- Specs Data --------------------------------------------------- */

const SPECS = [
  { label: "Resolution", value: "1080 x 1920 px", note: "Full HD vertical" },
  { label: "Aspect ratio", value: "9:16", note: "Portrait / vertical" },
  { label: "Max duration", value: "60 seconds", note: "15-30s recommended" },
  { label: "Min duration", value: "No minimum", note: "But 3s+ for visibility" },
  { label: "Frame rate", value: "24-60 fps", note: "30 fps standard" },
  { label: "File format", value: "MP4 (H.264)", note: "Also MOV, WebM" },
  { label: "Max file size", value: "256 GB", note: "Typically 20-100 MB" },
  { label: "Safe zone", value: "Top/bottom 15%", note: "Avoid text/logos here" },
];

/* -- Page --------------------------------------------------------- */

export default function ShortsDimensionsPage() {
  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--fg-primary)", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_JSON_LD) }}
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
            <Display as="h1" style={{ maxWidth: 720 }}>YouTube Shorts Dimensions</Display>
            <Lead style={{ maxWidth: 560 }}>Complete 2026 guide to YouTube Shorts size, resolution, aspect ratio, and length. Plus an interactive preview tool.</Lead>
          </div>
        </Container>
      </Section>

      {/* Specs */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)", paddingBottom: 0 }}>
        <Container width="narrow">
          <div className="shorts-specs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {SPECS.map((spec) => (
              <div key={spec.label} style={{ background: "var(--bg-secondary)", borderRadius: 14, padding: 20, border: "1px solid var(--border-subtle, rgba(128,128,128,0.14))" }}>
                <div style={{ fontSize: 13, color: "var(--fg-secondary)", marginBottom: 4 }}>{spec.label}</div>
                <div style={{ fontSize: 21, fontWeight: 600, color: "var(--fg-primary)", marginBottom: 2 }}>{spec.value}</div>
                <div style={{ fontSize: 13, color: "var(--fg-tertiary, var(--fg-secondary))" }}>{spec.note}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><ShortsDimensionsTool /></Container>
      </Section>

      {/* How to create */}
      <Section>
        <Container width="narrow">
          <CenteredHeader headline="How to create Shorts with correct dimensions" lead="Five simple steps to get it right." />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 48 }}>
            {[
              { step: 1, title: "Set camera to 9:16", desc: "Use portrait mode on your phone or set your video editor to 9:16 vertical aspect ratio." },
              { step: 2, title: "Set resolution to 1080x1920", desc: "Full HD vertical is the recommended resolution. Higher is supported but increases file size without visible benefit on mobile." },
              { step: 3, title: "Keep it under 60 seconds", desc: "Shorts must be 60 seconds or less. For best engagement, aim for 15-30 seconds with a hook in the first 2 seconds." },
              { step: 4, title: "Export as MP4 (H.264)", desc: "Use H.264 encoding at 8-12 Mbps bitrate for the best quality-to-size ratio." },
              { step: 5, title: "Add #Shorts to title or description", desc: "Include #Shorts in your video title or description so YouTube recognizes it as a Short." },
            ].map((item) => (
              <div key={item.step} style={{ display: "flex", gap: 16, padding: "20px 24px", background: "var(--bg-secondary)", borderRadius: 14, border: "1px solid var(--border-subtle, rgba(128,128,128,0.14))" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99,102,241,0.12)", color: "var(--color-brand-500, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, flexShrink: 0 }}>{item.step}</div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--fg-primary)", margin: "0 0 4px" }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about YouTube Shorts dimensions" />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Create Shorts with TubeForge</Headline>
            <Lead style={{ maxWidth: 480 }}>AI-powered video editor with automatic Shorts formatting, captions, and publishing.</Lead>
            <div style={{ marginTop: 6 }}><CTA href="/register">Start free</CTA></div>
          </div>
        </Container>
      </Section>

      <footer style={{ borderTop: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", padding: 32, textAlign: "center" }}>
        <Caption>{"\u00A9"} 2026 TubeForge. All rights reserved.</Caption>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .shorts-specs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
