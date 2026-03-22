import type { Metadata } from "next";
import { LandingNav } from "@/components/landing";
import Link from "next/link";
import { ScriptGeneratorTool } from "./ScriptGeneratorTool";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free AI YouTube Script Generator — Write Video Scripts Fast | TubeForge",
  description:
    "Generate full YouTube video scripts with AI. Choose your format (tutorial, review, vlog, listicle) and duration — get a complete script with hook, body, CTA, and outro. Free, no signup.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free AI YouTube Script Generator | TubeForge",
    description:
      "Write complete YouTube video scripts in seconds. Choose format and duration — AI generates hook, intro, body, CTA, and outro.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/script-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free AI YouTube Script Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/script-generator" },
  twitter: {
    card: "summary_large_image",
    title: "Free AI YouTube Script Generator | TubeForge",
    description: "Generate full YouTube video scripts with AI. Hook, body, CTA, and outro in seconds. Free tool, no signup.",
    images: ["/api/og"],
  },
};

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free AI YouTube Script Generator",
  description: "AI-powered YouTube script generator. Create complete video scripts with hook, intro, body, CTA, and outro for any topic and format.",
  url: "https://tubeforge.co/free-tools/script-generator",
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

export default function ScriptGeneratorPage() {
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
            YouTube Script Generator.
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
            Enter your topic, choose a format and duration, and get a complete video script with hook, intro, body, CTA, and outro.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <ScriptGeneratorTool />
        </div>
      </section>

      {/* Tips Section */}
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
            Script writing tips.
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
            How to make your scripts more engaging.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { title: "Hook in the first 5 seconds", desc: "Start with a bold statement, surprising fact, or direct question that makes viewers want to keep watching." },
              { title: "Use pattern interrupts", desc: "Change the visual, tone, or topic every 30-60 seconds to maintain viewer attention throughout the video." },
              { title: "Write for speaking, not reading", desc: "Use short sentences, contractions, and conversational language. Read your script aloud to check flow." },
              { title: "End with a clear CTA", desc: "Tell viewers exactly what to do next — subscribe, comment, watch another video, or visit a link." },
            ].map((tip) => (
              <div
                key={tip.title}
                style={{
                  padding: "20px 24px",
                  background: "#0a0a0a",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "#ffffff", margin: "0 0 6px" }}>
                  {tip.title}
                </h3>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
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
            Want unlimited script generations?
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
