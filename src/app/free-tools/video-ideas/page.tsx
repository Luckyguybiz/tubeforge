import type { Metadata } from "next";
import { LandingNav } from "@/components/landing";
import Link from "next/link";
import { VideoIdeasTool } from "./VideoIdeasTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free YouTube Video Ideas Generator — Get Trending Topics",
  description:
    "Generate 50+ YouTube video ideas categorized by trending, evergreen, Shorts, and series concepts. AI-powered for any niche. Free, no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free YouTube Video Ideas Generator",
    description:
      "Get 50+ video ideas for your YouTube channel — trending, evergreen, Shorts, and series concepts. AI-powered, free.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/video-ideas",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free YouTube Video Ideas Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/video-ideas" },
  twitter: {
    card: "summary_large_image",
    title: "Free YouTube Video Ideas Generator",
    description: "Generate 50+ YouTube video ideas categorized by type. AI-powered, free, no signup required.",
    images: ["/api/og"],
  },
};

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free YouTube Video Ideas Generator",
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

/* -- Page --------------------------------------------------------- */

export default function VideoIdeasPage() {
  return (
    <div style={{ background: "#0a0a0a", color: "#ffffff", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
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
            Video Ideas Generator.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Choose your niche and get 50+ video ideas categorized by trending, evergreen, Shorts, and series concepts.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <VideoIdeasTool />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center", background: "#111111" }}>
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
            Turn ideas into videos.
          </h2>
          <p style={{ fontSize: 19, color: "rgba(255,255,255,0.5)", margin: "0 0 32px", lineHeight: 1.5 }}>
            Sign up for TubeForge to generate scripts, thumbnails, and publish — all from one platform.
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
