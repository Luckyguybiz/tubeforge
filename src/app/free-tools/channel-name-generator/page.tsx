import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ChannelNameGeneratorTool } from "./ChannelNameGeneratorTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free YouTube Channel Name Generator — AI-Powered Ideas",
  description:
    "Generate 20 creative, brandable YouTube channel name ideas for any niche using AI. Free channel name generator — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free YouTube Channel Name Generator — AI-Powered",
    description:
      "Get 20 unique channel name ideas for your YouTube niche. AI-powered, free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/channel-name-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free YouTube Channel Name Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/channel-name-generator" },
  twitter: {
    card: "summary_large_image",
    title: "Free YouTube Channel Name Generator",
    description: "Generate 20 creative YouTube channel name ideas for any niche. Free AI tool, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the channel name generator work?",
    a: "Our AI analyzes your niche and style preference to generate 20 unique, brandable channel name ideas. It considers memorability, uniqueness, relevance to your topic, and available naming patterns used by successful creators.",
  },
  {
    q: "Is the channel name generator free?",
    a: "Yes, you get 3 free generations per day without signing up. Create a free TubeForge account for unlimited generations and access to additional AI tools.",
  },
  {
    q: "What makes a good YouTube channel name?",
    a: "A great channel name is short (1-3 words), easy to spell and pronounce, memorable, relevant to your niche, and unique enough to search for. Avoid numbers and special characters. Our AI considers all of these factors.",
  },
  {
    q: "Should I use my real name for my YouTube channel?",
    a: "Using your real name works well for personal brands and vlogs, but a creative brand name is better for topic-focused channels. Our generator offers both personal name-based and brandable style options.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free YouTube Channel Name Generator",
  description: "AI-powered YouTube channel name generator. Get 20 creative, brandable name ideas for any niche.",
  url: "https://tubeforge.co/free-tools/channel-name-generator",
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

export default function ChannelNameGeneratorPage() {
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
            Channel Name Generator.
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
            Enter your niche and style preference to get 20 creative, brandable YouTube channel name ideas powered by AI.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <ChannelNameGeneratorTool />
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
            Everything about the channel name generator.
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
            Want unlimited name generations?
          </h2>
          <p style={{ fontSize: 19, color: "rgba(255,255,255,0.5)", margin: "0 0 32px", lineHeight: 1.5 }}>
            Sign up for TubeForge to get unlimited AI generations plus 14 more creator tools.
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
