import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "AI Video Generation — Create Videos from Text Prompts",
  description:
    "Transform ideas into cinematic videos with Runway ML Gen-3 Alpha. No camera, no crew — describe your scene and AI brings it to life in minutes.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Video Generation — Create Videos from Text Prompts",
    description: "Transform ideas into cinematic videos with AI. No camera, no crew.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/video-generation",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/video-generation" },
  twitter: {
    card: "summary_large_image",
    title: "AI Video Generation — Create Videos from Text Prompts",
    description: "Transform ideas into cinematic videos with AI. No camera, no crew.",
  },
};

const FAQ_ITEMS = [
  { q: "What AI model powers video generation?", a: "We use Runway ML Gen-3 Alpha, one of the most advanced text-to-video AI models available." },
  { q: "What resolution are the generated videos?", a: "Videos are generated in HD (1080p) by default, with 4K export available on Pro and Studio plans." },
  { q: "How long can generated videos be?", a: "Individual clips are 4-16 seconds. Combine multiple clips in the multi-scene editor for longer videos." },
  { q: "Can I use generated videos commercially?", a: "Yes! All content generated on paid plans comes with full commercial rights for YouTube and business use." },
  { q: "Do I need video editing experience?", a: "Not at all. The AI handles all the heavy lifting. Just describe what you want in plain language." },
  { q: "Can I animate existing images?", a: "Yes! Upload any image and the AI will animate it — perfect for turning thumbnails into video content." },
];

const FEATURES = [
  { title: "Text-to-Video AI", desc: "Describe your scene in natural language and watch AI transform it into stunning footage with Runway ML Gen-3 Alpha." },
  { title: "Scene Control", desc: "Fine-tune camera angles, lighting, movement, and composition. Direct your AI scenes like a professional filmmaker." },
  { title: "Style Presets", desc: "Cinematic, anime, documentary, commercial, and 20+ visual styles to match your brand and vision." },
  { title: "Multi-Scene Editing", desc: "Combine multiple AI scenes into a cohesive video with automatic transitions and scene matching." },
  { title: "Image-to-Video", desc: "Upload any image and animate it with AI — turn thumbnails, photos, or artwork into moving content." },
  { title: "Instant Render", desc: "Get your video in seconds, not hours. Cloud rendering means no waiting and no hardware requirements." },
];

const STEPS = [
  { n: 1, title: "Describe Your Vision", desc: "Write a prompt describing the video you want. Be as detailed or creative as you like." },
  { n: 2, title: "Customize & Generate", desc: "Choose your style, aspect ratio, and duration. The AI generates multiple options to pick from." },
  { n: 3, title: "Edit & Export", desc: "Fine-tune the result, combine scenes, add audio, and export in any format ready for YouTube." },
];

const STATS = [
  { v: "50×", l: "Faster production" },
  { v: "$0", l: "Equipment cost" },
  { v: "Gen-3", l: "Runway AI model" },
  { v: "4K", l: "Export quality" },
];

const HERO_IMG = "https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>AI Video · Runway ML</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Create cinematic videos from a sentence
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              Transform your ideas into cinematic video with Runway ML Gen-3 Alpha. No camera, no crew &mdash; just your imagination and AI.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Generate your first video</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Creator producing video content with AI" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Video production shouldn&apos;t require a studio</Headline>
            <Lead>
              Traditional video demands expensive equipment, editing mastery, and hours of post-production. With AI generation, you describe what you want and it comes to life in minutes.
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
          <CenteredHeader eyebrow="Workflow" headline="From idea to export in three steps" />
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
            <Headline>Start creating AI videos today</Headline>
            <Lead style={{ maxWidth: 480 }}>Join 10,000+ creators already producing stunning content with AI. Free to start.</Lead>
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
