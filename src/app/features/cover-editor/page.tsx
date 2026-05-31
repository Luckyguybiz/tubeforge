import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "AI Thumbnail Editor — Design Viral YouTube Thumbnails",
  description:
    "Full-featured canvas editor with DALL-E 3 AI generation. Create scroll-stopping YouTube thumbnails with templates and A/B testing.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Thumbnail Editor — Design Viral YouTube Thumbnails",
    description: "Full-featured canvas editor with DALL-E 3 AI generation. Create scroll-stopping YouTube thumbnails with templates and A/B testing.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/cover-editor",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/cover-editor" },
  twitter: {
    card: "summary_large_image",
    title: "AI Thumbnail Editor — Design Viral YouTube Thumbnails",
    description: "Full-featured canvas editor with DALL-E 3 AI generation. Create scroll-stopping YouTube thumbnails with templates and A/B testing.",
  },
};

const FAQ_ITEMS = [
  { q: "Is this like Canva but for YouTube?", a: "Yes! It's a full canvas editor specifically optimized for YouTube thumbnails, with AI generation and A/B testing." },
  { q: "What AI model generates the thumbnails?", a: "We use DALL-E 3, one of the most capable image generation models available." },
  { q: "Can I upload my own images and fonts?", a: "Absolutely. Upload photos, logos, custom fonts, and overlay them on any template or AI-generated background." },
  { q: "What's the export resolution?", a: "We export at 1280×720 pixels (YouTube's recommended spec) with optional higher resolutions." },
  { q: "How does A/B testing work?", a: "Upload multiple variants. We rotate them on your video and track CTR performance to find the winner." },
  { q: "Is the cover editor free?", a: "Basic editing is free with 5 AI generations/month. Pro unlocks unlimited templates and A/B testing." },
];

const FEATURES = [
  { title: "Canvas Editor", desc: "Drag-and-drop editor with layers, text, shapes, filters, and effects. Everything you need, nothing you don't." },
  { title: "AI Generation", desc: "Generate entire thumbnails from a text description using DALL-E 3. Get multiple variations instantly." },
  { title: "Template Library", desc: "500+ professionally designed templates organized by niche. Gaming, tech, vlogs, education, and more." },
  { title: "Smart Text", desc: "Auto-sized, outlined, and shadowed text that pops. 100+ fonts optimized for YouTube thumbnails." },
  { title: "Background Remove", desc: "One-click background removal. Replace with gradients, solid colors, or AI-generated scenes." },
  { title: "A/B Testing", desc: "Generate multiple thumbnail variants and test which one performs better with real viewer data." },
];

const STEPS = [
  { n: 1, title: "Choose Your Starting Point", desc: "Start from a blank canvas, pick a template, or generate with AI. Upload your own images or use our stock library." },
  { n: 2, title: "Design & Customize", desc: "Add text, shapes, effects, and filters. Use the AI to enhance, remove backgrounds, or generate new elements." },
  { n: 3, title: "Export & Test", desc: "Download in YouTube-optimized resolution. Set up A/B tests to find the highest-performing variant." },
];

const STATS = [
  { v: "+85%", l: "CTR improvement" },
  { v: "3 min", l: "Avg design speed" },
  { v: "500+", l: "Templates" },
  { v: "1280×720", l: "Export quality" },
];

const HERO_IMG = "https://images.pexels.com/photos/3194519/pexels-photo-3194519.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>Canvas · DALL-E 3</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Design thumbnails that get clicks
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              A full-featured canvas editor with AI generation. Create scroll-stopping thumbnails with professional tools, templates, and DALL-E 3 integration.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Open the cover editor</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Designer working on graphic layouts" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Your thumbnail is your video&apos;s first impression</Headline>
            <Lead>
              Studies show 90% of top-performing YouTube videos have custom thumbnails. Our Canva-style editor with AI gives you professional results in minutes.
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
          <CenteredHeader eyebrow="Workflow" headline="From blank canvas to viral thumbnail in three steps" />
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
            <Headline>Design your next viral thumbnail</Headline>
            <Lead style={{ maxWidth: 480 }}>Professional editor and AI generation. Free to start, no credit card required.</Lead>
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
