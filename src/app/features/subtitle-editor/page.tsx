import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "Subtitle Editor — Animated Captions & Auto-Transcription",
  description:
    "12+ animated subtitle styles including viral one-word mode. Auto-transcription, frame-by-frame timing, SRT export.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Subtitle Editor — Animated Captions & Auto-Transcription",
    description: "12+ animated subtitle styles including viral one-word mode. Auto-transcription, frame-by-frame timing, SRT export.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/subtitle-editor",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/subtitle-editor" },
  twitter: {
    card: "summary_large_image",
    title: "Subtitle Editor — Animated Captions & Auto-Transcription",
    description: "12+ animated subtitle styles including viral one-word mode. Auto-transcription, frame-by-frame timing, SRT export.",
  },
};

const FAQ_ITEMS = [
  { q: "What is one-word mode?", a: "One-word mode highlights each word individually as it's spoken — the viral style popular on TikTok and Shorts." },
  { q: "How accurate is auto-transcription?", a: "Our AI achieves 95-98% accuracy on clear audio. You can easily correct errors in the editor." },
  { q: "Can I import existing SRT files?", a: "Yes! Import SRT, VTT, or ASS files and apply our styles and animations." },
  { q: "Does it support right-to-left languages?", a: "Yes, we fully support RTL languages including Arabic, Hebrew, and Persian." },
  { q: "Can I burn subtitles into the video?", a: "Yes! Export with burned-in subtitles or as a separate SRT file." },
  { q: "Is the subtitle editor free?", a: "Auto-transcription up to 5 minutes is free. Pro offers unlimited duration and all style presets." },
];

const FEATURES = [
  { title: "12+ Text Styles", desc: "Bold karaoke, gradient glow, outline pop, bounce animation — every style optimized for engagement." },
  { title: "One-Word Mode", desc: "Highlight one word at a time — the viral subtitle style used by top creators on Shorts and TikTok." },
  { title: "Auto-Transcription", desc: "AI transcribes your audio and places subtitles automatically. Manual fine-tuning available." },
  { title: "Custom Styling", desc: "Full control over fonts, colors, sizes, shadows, backgrounds, and positions." },
  { title: "Frame-by-Frame", desc: "Precise timing control. Sync every word perfectly with your audio." },
  { title: "SRT/VTT Export", desc: "Export as SRT, VTT, or burned-in subtitles. Compatible with all platforms." },
];

const STEPS = [
  { n: 1, title: "Upload Video", desc: "Upload your video and let AI auto-transcribe, or import your own SRT file." },
  { n: 2, title: "Style & Animate", desc: "Choose a style preset, customize colors and fonts, set the animation mode." },
  { n: 3, title: "Export", desc: "Download as SRT file or burn subtitles directly into the video." },
];

const STATS = [
  { v: "+40%", l: "Engagement boost" },
  { v: "12+", l: "Text styles" },
  { v: "98%", l: "Transcription accuracy" },
  { v: "50+", l: "Languages" },
];

const HERO_IMG = "https://images.pexels.com/photos/7236806/pexels-photo-7236806.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>Styles · Animation</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Subtitles that make videos unforgettable
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              12+ animated text styles, frame-by-frame timing, and one-word highlight mode &mdash; create viral-style subtitles in minutes.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Open Subtitle Editor</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Editor adding captions to video footage" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Subtitles are no longer optional</Headline>
            <Lead>
              85% of social media videos are watched without sound. Our editor gives you the animated, eye-catching subtitle styles that go viral &mdash; and the precise timing to make every word land.
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
          <CenteredHeader eyebrow="Workflow" headline="From upload to export in three steps" />
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
            <Headline>Add viral subtitles to your videos</Headline>
            <Lead style={{ maxWidth: 480 }}>Auto-transcription plus 12 animated styles. Free to start.</Lead>
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
