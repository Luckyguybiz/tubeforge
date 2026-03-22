import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ThumbnailSizeTool } from "./ThumbnailSizeTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "YouTube Thumbnail Size Guide 2026 — Dimensions, Resolution & Tips",
  description:
    "YouTube thumbnail size is 1280x720 pixels (16:9 aspect ratio). Upload your image to preview how it looks in YouTube search, feed, and mobile. Complete 2026 size guide included.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "YouTube Thumbnail Size Guide 2026 — Dimensions, Resolution & Tips",
    description:
      "YouTube thumbnail dimensions: 1280x720px, 16:9 ratio, max 2MB. Upload your thumbnail to check dimensions and preview it in YouTube layouts.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/youtube-thumbnail-size",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "YouTube Thumbnail Size Guide 2026" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/youtube-thumbnail-size" },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Thumbnail Size Guide 2026",
    description: "YouTube thumbnail: 1280x720px, 16:9, max 2MB. Free checker tool to preview your thumbnail in YouTube layouts.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "What size should a YouTube thumbnail be?",
    a: "YouTube recommends 1280x720 pixels with a 16:9 aspect ratio. The minimum width is 640 pixels. The file must be under 2MB in JPG, PNG, GIF, or BMP format. This size works optimally across desktop, tablet, and mobile layouts.",
  },
  {
    q: "What aspect ratio is best for YouTube thumbnails?",
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
    q: "What makes a YouTube thumbnail stand out?",
    a: "High-contrast colors, expressive faces, large readable text (3-5 words max), a clean focal point, and bright backgrounds. Avoid clutter and small details — thumbnails are often displayed at just 120px wide on mobile.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "YouTube Thumbnail Size Checker",
  description: "Check your YouTube thumbnail dimensions, file size, and aspect ratio. Preview how it looks in YouTube search, feed, and mobile.",
  url: "https://tubeforge.co/tools/youtube-thumbnail-size",
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
  description: "Step-by-step guide to creating YouTube thumbnails that get clicks.",
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
    { "@type": "ListItem", position: 3, name: "YouTube Thumbnail Size", item: "https://tubeforge.co/tools/youtube-thumbnail-size" },
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
    <div style={{ background: "#0a0a0a", color: "#ffffff", minHeight: "100vh" }}>
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
      <section style={{ paddingTop: 120, textAlign: "center", padding: "120px 24px 48px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Link
            href="/free-tools"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#6366f1",
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
              color: "#ffffff",
            }}
          >
            YouTube Thumbnail Size Guide.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Everything you need to know about YouTube thumbnail dimensions in 2026. Plus a free checker to preview how your thumbnail looks across layouts.
          </p>
        </div>
      </section>

      {/* Specs Table */}
      <section style={{ padding: "0 24px 60px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              background: "#0a0a0a",
              borderRadius: 18,
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 28px",
                background: "#111111",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                YouTube Thumbnail Specifications
              </h2>
            </div>
            {SPECS.map((spec, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 28px",
                  borderBottom: i < SPECS.length - 1 ? "1px solid #f0f0f2" : "none",
                }}
              >
                <span style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>{spec.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content guide */}
      <section style={{ padding: "0 24px 60px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 32px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: 20,
              lineHeight: 1.2,
            }}
          >
            Why thumbnail size matters
          </h2>
          <div style={{ fontSize: 17, color: "#424245", lineHeight: 1.8 }}>
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
        </div>
      </section>

      {/* Interactive Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 32px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            Check your thumbnail
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", marginBottom: 24, lineHeight: 1.5 }}>
            Upload an image to check dimensions, file size, and aspect ratio. Preview how it looks in different YouTube layouts. 100% client-side.
          </p>
          <ThumbnailSizeTool />
        </div>
      </section>

      {/* Related Tools */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            Related tools
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Title Generator", href: "/tools/youtube-title-generator" },
              { label: "Description Generator", href: "/tools/youtube-description-generator" },
              { label: "Tag Generator", href: "/tools/youtube-tag-generator" },
              { label: "Money Calculator", href: "/tools/youtube-money-calculator" },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: "8px 16px",
                  background: "#111111",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 980,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: "0 0 12px",
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            Frequently asked questions.
          </h2>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              margin: "0 auto 48px",
              maxWidth: 420,
              lineHeight: 1.5,
            }}
          >
            YouTube thumbnail dimensions and best practices.
          </p>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center", background: "#0a0a0a" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            Want more? Sign up for TubeForge.
          </h2>
          <p style={{ fontSize: 19, color: "rgba(255,255,255,0.5)", margin: "0 0 32px", lineHeight: 1.5 }}>
            AI thumbnail designer with A/B testing, generation, and analysis. Free plan available.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#6366f1",
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
      <footer style={{ background: "#111111", borderTop: "1px solid rgba(255,255,255,0.06)", padding: 24, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{"\u00A9"} 2026 TubeForge. All rights reserved.</span>
      </footer>
    </div>
  );
}
