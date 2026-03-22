import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ShortsDimensionsTool } from "./ShortsDimensionsTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "YouTube Shorts Size & Dimensions Guide 2026 — Resolution, Length | TubeForge",
  description:
    "Complete YouTube Shorts dimensions guide: 1080x1920 pixels, 9:16 aspect ratio, max 60 seconds. Upload an image to preview how it looks as a Short. Free tool.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "YouTube Shorts Size & Dimensions Guide 2026 | TubeForge",
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
    title: "YouTube Shorts Dimensions Guide 2026 | TubeForge",
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
    <div style={{ background: "#ffffff", color: "#1d1d1f", minHeight: "100vh" }}>
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
      <section style={{ paddingTop: 120, textAlign: "center", padding: "120px 24px 48px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Link
            href="/free-tools"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#0071e3",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              marginBottom: 24,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Free Tools
          </Link>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
              margin: "0 0 16px",
              color: "#1d1d1f",
            }}
          >
            YouTube Shorts Dimensions.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "#86868b",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Complete 2026 guide to YouTube Shorts size, resolution, aspect ratio, and length. Plus an interactive preview tool.
          </p>
        </div>
      </section>

      {/* Specs Grid */}
      <section style={{ padding: "0 24px 60px" }}>
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
          className="shorts-specs-grid"
        >
          {SPECS.map((spec) => (
            <div
              key={spec.label}
              style={{
                background: "#fafafa",
                borderRadius: 14,
                padding: "20px",
                border: "1px solid #e5e5ea",
              }}
            >
              <div style={{ fontSize: 13, color: "#86868b", marginBottom: 4 }}>
                {spec.label}
              </div>
              <div style={{ fontSize: 21, fontWeight: 600, color: "#1d1d1f", marginBottom: 2 }}>
                {spec.value}
              </div>
              <div style={{ fontSize: 13, color: "#aeaeb2" }}>
                {spec.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Preview Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <ShortsDimensionsTool />
        </div>
      </section>

      {/* How to Create Section */}
      <section style={{ padding: "80px 24px", background: "#f5f5f7" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: "0 0 12px",
              color: "#1d1d1f",
              textAlign: "center",
            }}
          >
            How to create Shorts with correct dimensions.
          </h2>
          <p
            style={{
              fontSize: 19,
              color: "#86868b",
              textAlign: "center",
              margin: "0 auto 48px",
              maxWidth: 420,
              lineHeight: 1.5,
            }}
          >
            Five simple steps to get it right.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { step: 1, title: "Set camera to 9:16", desc: "Use portrait mode on your phone or set your video editor to 9:16 vertical aspect ratio." },
              { step: 2, title: "Set resolution to 1080x1920", desc: "Full HD vertical is the recommended resolution. Higher is supported but increases file size without visible benefit on mobile." },
              { step: 3, title: "Keep it under 60 seconds", desc: "Shorts must be 60 seconds or less. For best engagement, aim for 15-30 seconds with a hook in the first 2 seconds." },
              { step: 4, title: "Export as MP4 (H.264)", desc: "Use H.264 encoding at 8-12 Mbps bitrate for the best quality-to-size ratio." },
              { step: 5, title: "Add #Shorts to title or description", desc: "Include #Shorts in your video title or description so YouTube recognizes it as a Short." },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "20px 24px",
                  background: "#ffffff",
                  borderRadius: 14,
                  border: "1px solid #e5e5ea",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(0,113,227,0.08)",
                    color: "#0071e3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1d1d1f", margin: "0 0 4px" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 15, color: "#86868b", margin: 0, lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: "0 0 12px",
              color: "#1d1d1f",
              textAlign: "center",
            }}
          >
            Frequently asked questions.
          </h2>
          <p
            style={{
              fontSize: 19,
              color: "#86868b",
              textAlign: "center",
              margin: "0 auto 48px",
              maxWidth: 420,
              lineHeight: 1.5,
            }}
          >
            Everything about YouTube Shorts dimensions.
          </p>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center", background: "#f5f5f7" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#1d1d1f",
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            Create Shorts with TubeForge.
          </h2>
          <p style={{ fontSize: 19, color: "#86868b", margin: "0 0 32px", lineHeight: 1.5 }}>
            AI-powered video editor with automatic Shorts formatting, captions, and publishing.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#0071e3",
              color: "#fff",
              fontSize: 17,
              fontWeight: 400,
              padding: "12px 28px",
              borderRadius: 980,
              textDecoration: "none",
              border: "none",
              transition: "all 0.3s ease",
              minHeight: 48,
            }}
          >
            Start Free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#f5f5f7", borderTop: "1px solid #e5e5ea", padding: 24, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#86868b" }}>{"\u00A9"} 2026 TubeForge. All rights reserved.</span>
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
