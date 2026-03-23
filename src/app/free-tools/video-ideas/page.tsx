import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
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
    <div style={{ background: "#0a0a0a", color: "#ffffff", minHeight: "100vh" }}>
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
            Everything about the video ideas generator.
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
