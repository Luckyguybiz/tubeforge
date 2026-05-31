import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "AI Voiceover Generator — 50+ Voices, 30+ Languages",
  description:
    "Create professional voiceovers instantly with 50+ AI narrators. Multilingual support, studio-quality output — no recording studio required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Voiceover Generator — 50+ Voices, 30+ Languages",
    description: "Create professional voiceovers instantly with 50+ AI narrators. Multilingual support, studio-quality output.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/ai-voiceover",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/ai-voiceover" },
  twitter: {
    card: "summary_large_image",
    title: "AI Voiceover Generator — 50+ Voices, 30+ Languages",
    description: "Create professional voiceovers instantly with 50+ AI narrators. Multilingual support, studio-quality output.",
  },
};

const FAQ_ITEMS = [
  { q: "Do the AI voices sound natural?", a: "Yes! We use the latest neural TTS technology. Most listeners cannot distinguish from real narrators." },
  { q: "Can I use voiceovers in monetized YouTube videos?", a: "Absolutely. All AI-generated voiceovers come with full commercial usage rights on paid plans." },
  { q: "How many languages are supported?", a: "We support 30+ languages including English, Spanish, French, German, Portuguese, Japanese, Korean, Chinese, and more." },
  { q: "Can I preview voices before generating?", a: "Yes! Every voice has a sample preview. Listen before you commit." },
  { q: "Is there a character limit?", a: "Free: 1,000 characters per generation. Pro: 10,000. Studio: 50,000." },
  { q: "Can I clone my own voice?", a: "Voice cloning is coming soon! Currently we offer 50+ pre-built AI voices." },
];

const FEATURES = [
  { title: "50+ AI Voices", desc: "Male, female, young, old, authoritative, friendly — find the perfect voice for your content." },
  { title: "30+ Languages", desc: "Generate voiceovers in English, Spanish, French, German, Japanese, Korean, and 25+ more." },
  { title: "Instant Generation", desc: "Type your script, click generate. Get broadcast-quality audio in under 10 seconds." },
  { title: "Emotion & Tone", desc: "Adjust speaking style: excited, calm, professional, casual, dramatic, or whispered." },
  { title: "SSML Support", desc: "Fine-tune pronunciation, pauses, emphasis, and speed with advanced SSML markup." },
  { title: "Audio Export", desc: "Export as MP3, WAV, or OGG. Perfect quality for any platform or editing software." },
];

const STEPS = [
  { n: 1, title: "Write Your Script", desc: "Type or paste your narration text. The AI handles punctuation and pacing." },
  { n: 2, title: "Choose Voice & Style", desc: "Pick from 50+ voices, set the language, and adjust emotion and tone." },
  { n: 3, title: "Generate & Download", desc: "Click generate and download your voiceover for videos or podcasts." },
];

const STATS = [
  { v: "50+", l: "Voice library" },
  { v: "30+", l: "Languages" },
  { v: "10s", l: "Generation speed" },
  { v: "95%", l: "Savings vs voice actor" },
];

const HERO_IMG = "https://images.pexels.com/photos/6953876/pexels-photo-6953876.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>AI Voiceover · 50+ Voices</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Professional voiceovers in seconds
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              Generate natural-sounding narration with 50+ AI voices across 30+ languages. No recording studio, no voice actor &mdash; just your script and AI.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Try voiceover free</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Creator recording audio with a studio microphone" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Quality voiceover without the recording studio</Headline>
            <Lead>
              Professional voiceover artists are expensive and slow. AI voiceovers give you broadcast-quality narration instantly &mdash; in any language, in any tone, on your schedule.
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
          <CenteredHeader eyebrow="Workflow" headline="From script to audio in three steps" />
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
            <Headline>Give your videos a professional voice</Headline>
            <Lead style={{ maxWidth: 480 }}>50+ AI narrators. 30+ languages. Generate your first voiceover free.</Lead>
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
