import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav } from "@/components/landing";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free YouTube Tools — Title Generator, SEO, Analytics | TubeForge",
  description:
    "9 free AI-powered YouTube tools: title generator, description generator, tag generator, script writer, channel name generator, character counter, video ideas, thumbnail checker, and Shorts guide. No signup required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free YouTube Tools — Title Generator, SEO, Analytics | TubeForge",
    description:
      "9 free AI-powered YouTube tools. Generate titles, descriptions, tags, scripts, channel names, video ideas, and more — no login required.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free YouTube Tools by TubeForge" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools" },
  twitter: {
    card: "summary_large_image",
    title: "Free YouTube Tools — Title Generator, SEO, Analytics | TubeForge",
    description: "9 free AI tools for YouTube creators. Generate titles, descriptions, tags, scripts, channel names, video ideas, and more.",
    images: ["/api/og"],
  },
};

/* -- Data ---------------------------------------------------------- */

const TOOLS = [
  {
    title: "YouTube Title Generator",
    description: "Generate 10 click-worthy, SEO-optimized title variations for any video topic using AI.",
    href: "/free-tools/title-generator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    title: "YouTube Description Generator",
    description: "Create SEO-optimized video descriptions with timestamps, hashtags, and links sections.",
    href: "/free-tools/description-generator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: "YouTube Tag Generator",
    description: "Get 25 relevant, SEO-friendly tags mixing broad and long-tail keywords for maximum reach.",
    href: "/free-tools/tag-generator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    title: "Thumbnail Text Checker",
    description: "Upload a thumbnail and get instant analysis of text readability, contrast, and composition.",
    href: "/free-tools/thumbnail-checker",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    title: "Channel Name Generator",
    description: "Get 20 creative, brandable YouTube channel name ideas for any niche using AI.",
    href: "/free-tools/channel-name-generator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: "YouTube Script Generator",
    description: "Generate complete video scripts with hook, intro, body, CTA, and outro for any topic and format.",
    href: "/free-tools/script-generator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    title: "YouTube Character Counter",
    description: "Real-time character counter for titles (100), descriptions (5000), and tags (500) with color indicators.",
    href: "/free-tools/character-counter",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    title: "Video Ideas Generator",
    description: "Get 50+ video ideas categorized by trending, evergreen, Shorts, and series concepts.",
    href: "/free-tools/video-ideas",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="9" y1="18" x2="15" y2="18" />
        <line x1="10" y1="22" x2="14" y2="22" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </svg>
    ),
  },
  {
    title: "Shorts Dimensions Guide",
    description: "Complete 2026 guide to YouTube Shorts size, resolution, aspect ratio, and length with interactive preview.",
    href: "/free-tools/shorts-dimensions",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    ),
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Free YouTube Tools",
  description: "9 free AI-powered tools for YouTube creators — title generator, description generator, tag generator, thumbnail checker, channel name generator, script writer, character counter, video ideas, and Shorts dimensions guide.",
  url: "https://tubeforge.co/free-tools",
  isPartOf: {
    "@type": "WebSite",
    name: "TubeForge",
    url: "https://tubeforge.co",
  },
};

/* -- Page --------------------------------------------------------- */

export default function FreeToolsPage() {
  return (
    <div style={{ background: "#0a0a0a", color: "#ffffff", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingNav />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: "center", padding: "120px 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(99,102,241,0.1)",
              color: "#6366f1",
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 980,
              marginBottom: 24,
            }}
          >
            100% Free
          </div>
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
            Free YouTube Tools.
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
            9 AI-powered tools to help you create better titles, descriptions, tags, scripts, channel names, and more. No signup required.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section style={{ padding: "0 24px 100px" }}>
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
          className="free-tools-grid"
        >
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{
                background: "#0a0a0a",
                borderRadius: 18,
                padding: "36px 28px",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(99,102,241,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {tool.icon}
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 21,
                    fontWeight: 600,
                    color: "#ffffff",
                    margin: "0 0 8px",
                  }}
                >
                  {tool.title}
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {tool.description}
                </p>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: "#6366f1",
                  fontSize: 15,
                  fontWeight: 500,
                  marginTop: "auto",
                }}
              >
                Try it free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 24px 100px",
          textAlign: "center",
          background: "#111111",
        }}
      >
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
            Want unlimited access?
          </h2>
          <p
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,0.5)",
              margin: "0 0 32px",
              lineHeight: 1.5,
            }}
          >
            Sign up for TubeForge to unlock unlimited generations, advanced AI tools, and more.
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
              cursor: "pointer",
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
      <footer style={{ background: "#111111", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          {"\u00A9"} 2026 TubeForge. All rights reserved.
        </span>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .free-tools-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .free-tools-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
