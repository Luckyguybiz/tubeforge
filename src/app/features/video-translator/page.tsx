import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "AI Video Translator — Voice Cloning & Lip Sync",
  description:
    "Translate videos to 30+ languages with AI voice cloning and automatic lip-sync. Reach a global audience without re-recording a single line.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Video Translator — Voice Cloning & Lip Sync",
    description: "Translate videos to 30+ languages with AI voice cloning and automatic lip-sync.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/video-translator",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/video-translator" },
  twitter: {
    card: "summary_large_image",
    title: "AI Video Translator — Voice Cloning & Lip Sync",
    description: "Translate videos to 30+ languages with AI voice cloning and automatic lip-sync.",
  },
};

const FAQ_ITEMS = [
  { q: "How does voice cloning work?", a: "AI analyzes your voice characteristics and recreates them in the target language." },
  { q: "Is lip-sync automatic?", a: "Yes! AI adjusts lip movements to match translated audio. Works best on front-facing video." },
  { q: "What languages are supported?", a: "English, Spanish, French, German, Portuguese, Italian, Russian, Japanese, Korean, Chinese, Hindi, Arabic, Turkish, and 15+ more." },
  { q: "Can I translate to multiple languages at once?", a: "Yes! Select multiple targets and process simultaneously." },
  { q: "How long does translation take?", a: "A 10-minute video typically processes in under 5 minutes per language." },
  { q: "Do I need to provide a script?", a: "No! AI auto-transcribes and translates. Optionally review before translation." },
];

const FEATURES = [
  { title: "30+ Languages", desc: "Translate to English, Spanish, French, German, Portuguese, Japanese, Korean, Hindi, Arabic, and more." },
  { title: "Voice Cloning", desc: "AI clones your unique voice and speaks in the target language. Your viewers hear you, not a stranger." },
  { title: "Lip Sync", desc: "AI adjusts lip movements to match the translated audio for a natural, believable result." },
  { title: "Full Video Output", desc: "Complete translated video — audio, subtitles, and lip-sync all included and ready to publish." },
  { title: "Multi-Language Batch", desc: "Translate one video into multiple languages simultaneously, with no extra effort." },
  { title: "Fast Processing", desc: "A 10-minute video translates in under 5 minutes. Cloud-powered, no waiting around." },
];

const STEPS = [
  { n: 1, title: "Upload Your Video", desc: "Upload any video with speech. AI transcribes and analyzes your voice." },
  { n: 2, title: "Choose Languages", desc: "Select one or multiple target languages. AI clones your voice for each." },
  { n: 3, title: "Download & Publish", desc: "Get translated videos with voice cloning and lip-sync, ready for YouTube." },
];

const STATS = [
  { v: "30+", l: "Languages" },
  { v: "95%", l: "Voice match" },
  { v: "10×", l: "Audience reach" },
  { v: "5 min", l: "Per translation" },
];

const HERO_IMG = "https://images.pexels.com/photos/4172290/pexels-photo-4172290.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>Voice Clone · 30+ Languages</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Translate your videos to 30+ languages
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              AI clones your voice and speaks in any language. Reach a global audience without re-recording a single line.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Translate a video</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Global creators collaborating across languages" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Your content deserves a global audience</Headline>
            <Lead>
              80% of YouTube viewers speak a language other than English. Translating your videos multiplies your audience overnight &mdash; no re-recording, no second crew.
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
          <CenteredHeader eyebrow="Workflow" headline="From upload to publish in three steps" />
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
            <Headline>Go global with your content</Headline>
            <Lead style={{ maxWidth: 480 }}>AI voice cloning, translation, and lip-sync in one pass. Try your first translation free.</Lead>
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
