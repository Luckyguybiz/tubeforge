import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { CharacterCounterTool } from "./CharacterCounterTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "YouTube Character Counter — Title, Description & Tag Limits | TubeForge",
  description:
    "Free YouTube character counter for titles (100), descriptions (5000), and tags (500). Real-time counting with color indicators and optimal length tips. No signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "YouTube Character Counter — Title, Description & Tag Limits | TubeForge",
    description:
      "Check your YouTube title, description, and tag character counts in real time. Color-coded indicators show when you hit optimal length.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/character-counter",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "YouTube Character Counter" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/character-counter" },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Character Counter | TubeForge",
    description: "Real-time character counter for YouTube titles (100), descriptions (5000), and tags (500). Free, no signup.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "What is the YouTube title character limit?",
    a: "YouTube allows up to 100 characters for video titles. However, titles are truncated at around 70 characters in search results and suggested videos. For optimal CTR, aim for 40-70 characters.",
  },
  {
    q: "What is the YouTube description character limit?",
    a: "YouTube allows up to 5,000 characters for video descriptions. Only the first 2-3 lines (roughly 200 characters) are shown above the fold. Include your most important keywords and information in those first 200 characters.",
  },
  {
    q: "What is the YouTube tags character limit?",
    a: "YouTube allows up to 500 characters total for all tags combined. This is the total character count, not the number of tags. Use a mix of broad and specific long-tail keyword tags for best SEO results.",
  },
  {
    q: "How does the color indicator work?",
    a: "The counter uses four color states: blue means your text is shorter than optimal, green means optimal length, orange means it is getting long but still within limits, and red means you have exceeded the maximum character limit.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "YouTube Character Counter",
  description: "Free real-time character counter for YouTube titles (100 chars), descriptions (5000 chars), and tags (500 chars) with color-coded length indicators.",
  url: "https://tubeforge.co/free-tools/character-counter",
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

export default function CharacterCounterPage() {
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
            Character Counter.
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
            Check your YouTube title, description, and tag character counts in real time. Color-coded indicators show when you hit optimal length.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <CharacterCounterTool />
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
            YouTube character limits explained.
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
            Optimize your entire channel.
          </h2>
          <p style={{ fontSize: 19, color: "#86868b", margin: "0 0 32px", lineHeight: 1.5 }}>
            Sign up for TubeForge to access AI-powered title, description, and tag generators.
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
