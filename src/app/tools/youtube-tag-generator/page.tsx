import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { TagGenTool } from "./TagGenTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free YouTube Tag & Hashtag Generator — Find Trending Tags | TubeForge",
  description:
    "Generate 20-30 relevant YouTube tags and 5-10 hashtags for any video topic. AI-powered tag generator with Copy All button. Free — no signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free YouTube Tag & Hashtag Generator — Find Trending Tags | TubeForge",
    description:
      "Get the perfect YouTube tags and hashtags for your videos with AI. 25+ optimized tags per generation — free, no login needed.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/tools/youtube-tag-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "YouTube Tag & Hashtag Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/tools/youtube-tag-generator" },
  twitter: {
    card: "summary_large_image",
    title: "Free YouTube Tag & Hashtag Generator | TubeForge",
    description: "Generate 25+ relevant YouTube tags and hashtags for any video topic. Free AI tool, no signup required.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the YouTube tag and hashtag generator work?",
    a: "Our AI analyzes your video topic and generates 20-30 relevant tags plus 5-10 hashtags. It creates a mix of broad (high-volume) and specific (long-tail) keywords optimized for YouTube search and discovery.",
  },
  {
    q: "Do YouTube tags still matter for SEO in 2026?",
    a: "Yes, tags remain a ranking factor in YouTube's algorithm. While titles and descriptions carry more weight, tags help YouTube understand your content context and suggest it alongside related videos. They're especially important for niche topics and trending searches.",
  },
  {
    q: "What's the difference between tags and hashtags on YouTube?",
    a: "Tags are hidden metadata that help YouTube categorize your video. Hashtags appear visibly above your title and in the description — viewers can click them to find related content. Both are important for discoverability, and our tool generates both.",
  },
  {
    q: "How many tags should I use per video?",
    a: "YouTube allows up to 500 characters of tags. We recommend using 10-15 highly relevant tags rather than stuffing all 30. Focus on tags that accurately describe your content. For hashtags, YouTube displays up to 3 above your title — choose your best ones.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "YouTube Tag & Hashtag Generator",
  description: "Free AI-powered YouTube tag and hashtag generator. Get 25+ relevant tags for any video topic.",
  url: "https://tubeforge.co/tools/youtube-tag-generator",
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
    { "@type": "ListItem", position: 3, name: "YouTube Tag Generator", item: "https://tubeforge.co/tools/youtube-tag-generator" },
  ],
};

/* -- Page --------------------------------------------------------- */

export default function YouTubeTagGeneratorPage() {
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
            YouTube Tag & Hashtag Generator.
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
            Enter your topic and get 25+ relevant tags and hashtags optimized for YouTube search. Free, no signup required.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <TagGenTool />
        </div>
      </section>

      {/* Related Tools */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#ffffff",
              marginBottom: 16,
            }}
          >
            Related tools
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Title Generator", href: "/tools/youtube-title-generator" },
              { label: "Description Generator", href: "/tools/youtube-description-generator" },
              { label: "Thumbnail Size Guide", href: "/tools/youtube-thumbnail-size" },
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
            Everything about YouTube tags and hashtags.
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
            Unlimited AI generations plus 14 more creator tools. Free plan available.
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
