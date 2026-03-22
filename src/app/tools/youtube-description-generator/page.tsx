import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { DescGenTool } from "./DescGenTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free AI YouTube Description Generator — SEO-Optimized",
  description:
    "Generate SEO-optimized YouTube descriptions with timestamps, hashtags, and CTAs. AI-powered, free — no signup required. Boost your video rankings today.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free AI YouTube Description Generator — SEO-Optimized",
    description:
      "Create perfect YouTube descriptions in seconds with AI. Includes timestamps, hashtags, and CTA sections — free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/youtube-description-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "AI YouTube Description Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/youtube-description-generator" },
  twitter: {
    card: "summary_large_image",
    title: "Free AI YouTube Description Generator — SEO-Optimized",
    description: "Generate SEO-optimized YouTube descriptions with timestamps and hashtags. Free, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the YouTube description generator work?",
    a: "Enter your video title and optional keywords, and our AI creates a complete, SEO-optimized description including an engaging hook, detailed body, timestamp placeholders, links section, relevant hashtags, and a call to action.",
  },
  {
    q: "Why are YouTube descriptions important for SEO?",
    a: "YouTube descriptions help the algorithm understand your video content and rank it for relevant searches. A well-optimized description with keywords can significantly increase your video's discoverability, click-through rate, and watch time.",
  },
  {
    q: "How long should a YouTube description be?",
    a: "YouTube allows up to 5,000 characters. For best results, aim for at least 200-300 words. Include your main keywords naturally in the first 2-3 sentences (visible above the fold), add timestamps for longer videos, and include relevant links and hashtags.",
  },
  {
    q: "What should I include in a YouTube description?",
    a: "A great description includes: an attention-grabbing first sentence, a summary of the video content with keywords, timestamps for easy navigation, links to related content and social media, a call to action (subscribe, like), and 3-5 relevant hashtags.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI YouTube Description Generator",
  description: "Free AI-powered YouTube description generator. Create SEO-optimized descriptions with timestamps, hashtags, and CTAs.",
  url: "https://tubeforge.co/tools/youtube-description-generator",
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

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tubeforge.co" },
    { "@type": "ListItem", position: 2, name: "Free Tools", item: "https://tubeforge.co/free-tools" },
    { "@type": "ListItem", position: 3, name: "YouTube Description Generator", item: "https://tubeforge.co/tools/youtube-description-generator" },
  ],
};

/* -- Page --------------------------------------------------------- */

export default function YouTubeDescriptionGeneratorPage() {
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
            YouTube Description Generator.
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
            Enter your video title and keywords to get a complete, SEO-optimized description with timestamps, hashtags, and a CTA. Free, no signup required.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <DescGenTool />
        </div>
      </section>

      {/* Related Tools */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#1d1d1f",
              marginBottom: 16,
            }}
          >
            Related tools
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Title Generator", href: "/tools/youtube-title-generator" },
              { label: "Tag Generator", href: "/tools/youtube-tag-generator" },
              { label: "Thumbnail Size Guide", href: "/tools/youtube-thumbnail-size" },
              { label: "Money Calculator", href: "/tools/youtube-money-calculator" },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: "8px 16px",
                  background: "#f5f5f7",
                  color: "#1d1d1f",
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 980,
                  textDecoration: "none",
                  border: "1px solid #e5e5ea",
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
            Everything about the description generator.
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
            Want more? Sign up for TubeForge.
          </h2>
          <p style={{ fontSize: 19, color: "#86868b", margin: "0 0 32px", lineHeight: 1.5 }}>
            Unlimited AI generations plus 14 more creator tools. Free plan available.
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
