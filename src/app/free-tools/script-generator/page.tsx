import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";
import { ScriptGeneratorTool } from "./ScriptGeneratorTool";
import { Container, Section, Eyebrow, Display, Headline, Lead, Caption, CenteredHeader, CTA } from "@/components/ds";

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "Free AI Script Generator — Write Video Scripts Fast",
  description:
    "Generate full YouTube video scripts with AI. Choose your format (tutorial, review, vlog, listicle) and duration — get a complete script with hook, body, CTA, and outro. Free, no signup.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free AI Script Generator",
    description:
      "Write complete YouTube video scripts in seconds. Choose format and duration — AI generates hook, intro, body, CTA, and outro.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/free-tools/script-generator",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Free AI Script Generator" }],
  },
  alternates: { canonical: "https://tubeforge.co/free-tools/script-generator" },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Script Generator",
    description: "Generate full YouTube video scripts with AI. Hook, body, CTA, and outro in seconds. Free tool, no signup.",
    images: ["/api/og"],
  },
};

/* -- FAQ ---------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "How does the AI YouTube script generator work?",
    a: "Enter your video topic, choose a format (tutorial, review, vlog, or listicle), and select a target duration. Our AI generates a complete script with a hook, introduction, structured body sections, a call to action, and an outro.",
  },
  {
    q: "What video formats can the script generator create?",
    a: "The generator supports four popular YouTube formats: tutorials (step-by-step guides), reviews (product or service evaluations), vlogs (personal storytelling), and listicles (numbered lists like 'Top 10' videos). Each format follows proven structures for that content type.",
  },
  {
    q: "Can I edit the generated script?",
    a: "Absolutely. The generated script is a starting point that you should customize with your personal voice, specific examples, and unique insights. Use the copy button to grab the script, then refine it in your preferred text editor.",
  },
  {
    q: "How long should a YouTube video script be?",
    a: "A general rule is about 150 words per minute of video. A 10-minute video needs roughly 1,500 words. Our generator adjusts script length based on your selected duration to give you the right amount of content.",
  },
  {
    q: "Is the script generator free to use?",
    a: "Yes, you get 3 free script generations per day without signing up. Create a free TubeForge account for unlimited generations and access to additional AI tools like title, description, and tag generators.",
  },
];

/* -- JSON-LD ------------------------------------------------------ */

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free AI Script Generator",
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

export default function ScriptGeneratorPage() {
  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--fg-primary)", minHeight: "100vh" }}>
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
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="narrow">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
            <Link href="/free-tools" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-brand-500, #6366f1)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              All free tools
            </Link>
            <Eyebrow>Free tool · No signup</Eyebrow>
            <Display as="h1" style={{ maxWidth: 720 }}>AI Script Generator</Display>
            <Lead style={{ maxWidth: 560 }}>Enter your topic, choose a format and duration, and get a complete video script with hook, intro, body, CTA, and outro.</Lead>
          </div>
        </Container>
      </Section>

      {/* Tool */}
      <Section tight style={{ paddingTop: "clamp(32px, 5vw, 44px)" }}>
        <Container width="narrow"><ScriptGeneratorTool /></Container>
      </Section>

      {/* FAQ */}
      <Section alt>
        <Container width="narrow">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" lead="Everything about the script generator" />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* Tips */}
      <Section>
        <Container width="narrow">
          <CenteredHeader headline="Script writing tips" lead="How to make your scripts more engaging." />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 48 }}>
            {[
              { title: "Hook in the first 5 seconds", desc: "Start with a bold statement, surprising fact, or direct question that makes viewers want to keep watching." },
              { title: "Use pattern interrupts", desc: "Change the visual, tone, or topic every 30-60 seconds to maintain viewer attention throughout the video." },
              { title: "Write for speaking, not reading", desc: "Use short sentences, contractions, and conversational language. Read your script aloud to check flow." },
              { title: "End with a clear CTA", desc: "Tell viewers exactly what to do next — subscribe, comment, watch another video, or visit a link." },
            ].map((tip) => (
              <div key={tip.title} style={{ padding: "20px 24px", background: "var(--bg-secondary)", borderRadius: 14, border: "1px solid var(--border-subtle, rgba(128,128,128,0.14))" }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--fg-primary)", margin: "0 0 6px" }}>{tip.title}</h3>
                <p style={{ fontSize: 15, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.6 }}>{tip.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Want unlimited script generations?</Headline>
            <Lead style={{ maxWidth: 480 }}>Sign up for TubeForge to get unlimited AI generations plus 14 more creator tools.</Lead>
            <div style={{ marginTop: 6 }}><CTA href="/register">Start free</CTA></div>
          </div>
        </Container>
      </Section>

      <footer style={{ borderTop: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", padding: 32, textAlign: "center" }}>
        <Caption>{"\u00A9"} 2026 TubeForge. All rights reserved.</Caption>
      </footer>
    </div>
  );
}
