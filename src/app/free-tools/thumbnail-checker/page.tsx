import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ThumbnailCheckerTool } from "./ThumbnailCheckerTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free YouTube Thumbnail Checker — Text & Contrast Analysis",
  description:
    "Upload your YouTube thumbnail and get instant analysis of text readability, color contrast, brightness, and composition. Free tool, no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free YouTube Thumbnail Checker",
    description:
      "Analyze your YouTube thumbnails for readability, contrast, and composition. Free instant analysis — no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/thumbnail-checker",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free YouTube Thumbnail Checker" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/thumbnail-checker" },
  twitter: {
    card: "summary_large_image",
    title: "Free YouTube Thumbnail Checker",
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
  name: "Free YouTube Thumbnail Checker",
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
    <div style={{ background: "#ffffff", color: "#1d1d1f", minHeight: "100vh" }}>
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
            Thumbnail Checker.
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
            Upload your thumbnail and get instant analysis of readability, contrast, and composition. 100% client-side — your image never leaves your browser.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <ThumbnailCheckerTool />
        </div>
      </section>

      {/* FAQ */}
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
            Everything about the thumbnail checker.
          </p>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center", background: "#ffffff" }}>
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
            Create better thumbnails with AI.
          </h2>
          <p style={{ fontSize: 19, color: "#86868b", margin: "0 0 32px", lineHeight: 1.5 }}>
            Sign up for TubeForge to access the AI thumbnail designer with A/B testing and generation.
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
    </div>
  );
}
