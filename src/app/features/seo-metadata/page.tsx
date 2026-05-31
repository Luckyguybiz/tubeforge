import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "YouTube SEO Optimizer — AI-Powered Metadata Tool",
  description:
    "Optimize your YouTube titles, descriptions, and tags with Claude AI. Rank higher, get discovered, and earn more views.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "YouTube SEO Optimizer — AI-Powered Metadata Tool",
    description: "Optimize your YouTube titles, descriptions, and tags with Claude AI. Rank higher and get more views.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/seo-metadata",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/seo-metadata" },
  twitter: {
    card: "summary_large_image",
    title: "YouTube SEO Optimizer — AI-Powered Metadata Tool",
    description: "Optimize your YouTube titles, descriptions, and tags with Claude AI. Rank higher and get more views.",
  },
};

const FAQ_ITEMS = [
  { q: "What AI powers the SEO optimization?", a: "We use Claude AI for metadata generation, combined with YouTube's actual search data for keyword research." },
  { q: "Is the SEO metadata tool free?", a: "Yes! Basic optimization is free with 5 analyses per month. Pro offers unlimited." },
  { q: "How accurate are keyword suggestions?", a: "Based on real YouTube search volume data, updated daily. We show estimated monthly searches." },
  { q: "Can it optimize existing published videos?", a: "Absolutely. Paste any YouTube URL and get recommendations to improve existing SEO." },
  { q: "Does it work for any language?", a: "Yes! The AI generates optimized metadata in 12+ languages with language-specific keyword research." },
  { q: "How often should I re-optimize metadata?", a: "We recommend re-checking quarterly, or whenever there's a trend shift in your niche." },
];

const FEATURES = [
  { title: "Title Optimization", desc: "AI analyzes top-performing titles in your niche and generates click-worthy alternatives optimized for search." },
  { title: "SEO Score", desc: "Real-time SEO scoring for your metadata. See exactly what needs improvement before publishing." },
  { title: "Keyword Research", desc: "Discover high-volume, low-competition keywords specific to your video topic and niche." },
  { title: "Tag Generation", desc: "Automatically generate the perfect mix of broad and long-tail tags for maximum discoverability." },
  { title: "Description Writer", desc: "AI writes SEO-optimized descriptions with proper structure, timestamps, and CTAs." },
  { title: "Trend Analysis", desc: "See what's trending in your niche. Align your metadata with current search patterns." },
];

const STEPS = [
  { n: 1, title: "Enter Your Video Topic", desc: "Paste your video URL or describe the topic. The AI immediately starts analyzing." },
  { n: 2, title: "AI Generates Metadata", desc: "Get a polished title, full description, and relevant tags ready to paste into YouTube Studio." },
  { n: 3, title: "Apply & Publish", desc: "Review, tweak if needed, and apply directly to your YouTube video." },
];

const STATS = [
  { v: "+200%", l: "Search visibility" },
  { v: "Claude", l: "AI model" },
  { v: "< 60s", l: "Optimization time" },
  { v: "30+", l: "Tag suggestions" },
];

const HERO_IMG = "https://images.pexels.com/photos/7682340/pexels-photo-7682340.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>SEO · Claude AI</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Rank higher with AI-powered SEO
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              Let Claude AI analyze trends and optimize your title, description, and tags &mdash; all in one place. Maximize discoverability and get found.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Optimize your video SEO</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Creator reviewing search and metadata on a laptop" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Great content fails without great SEO</Headline>
            <Lead>
              YouTube&apos;s algorithm relies heavily on metadata. Our AI analyzes what&apos;s working in your niche and generates optimized metadata that ranks &mdash; so the right viewers actually find you.
            </Lead>
          </div>
        </Container>
      </Section>

      {/* Features */}
      <Section alt>
        <Container width="wide">
          <CenteredHeader eyebrow="Capabilities" headline="Everything you need" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 56 }}>
            {FEATURES.map((f) => (
              <Card key={f.title} style={{ background: "var(--bg-primary)" }}>
                <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg-primary)", margin: "0 0 8px" }}>{f.title}</h3>
                <Body style={{ fontSize: 15 }}>{f.desc}</Body>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section id="how-it-works">
        <Container width="default">
          <CenteredHeader eyebrow="Workflow" headline="From topic to publish in three steps" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40, marginTop: 56 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--bg-secondary)", border: "1px solid var(--border-default, rgba(128,128,128,0.18))", color: "var(--color-brand-500, #6366f1)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 600 }}>{s.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg-primary)", margin: 0 }}>{s.title}</h3>
                <Body style={{ fontSize: 15, maxWidth: 280 }}>{s.desc}</Body>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section alt tight>
        <Container width="default">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 24 }}>
            {STATS.map((s) => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg-primary)", lineHeight: 1 }}>{s.v}</div>
                <Caption style={{ display: "block", marginTop: 8 }}>{s.l}</Caption>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container width="default">
          <CenteredHeader eyebrow="FAQ" headline="Frequently asked questions" />
          <div style={{ marginTop: 48 }}>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section alt>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Boost your YouTube rankings today</Headline>
            <Lead style={{ maxWidth: 480 }}>Free SEO analysis powered by Claude AI. See results in days, not months.</Lead>
            <div style={{ marginTop: 6 }}><CTA href="/register">Start free</CTA></div>
          </div>
        </Container>
      </Section>

      <footer style={{ borderTop: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", padding: 32, textAlign: "center" }}>
        <Caption>{"©"} 2026 TubeForge. All rights reserved.</Caption>
      </footer>
    </div>
  );
}
