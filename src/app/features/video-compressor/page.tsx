import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "Free Video Compressor — Reduce Size Without Quality Loss",
  description:
    "Compress videos up to 90% smaller with no visible quality loss. Browser-based, private, free.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free Video Compressor — Reduce Size Without Quality Loss",
    description: "Compress videos up to 90% smaller with no visible quality loss. Browser-based, private, free.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/video-compressor",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/video-compressor" },
  twitter: {
    card: "summary_large_image",
    title: "Free Video Compressor — Reduce Size Without Quality Loss",
    description: "Compress videos up to 90% smaller with no visible quality loss. Browser-based, private, free.",
  },
};

const FAQ_ITEMS = [
  { q: "Will compression reduce quality?", a: "Our AI compression maintains visual quality indistinguishable from the original at typical viewing sizes." },
  { q: "Is it processed in my browser?", a: "Yes! Your video never leaves your device for basic edits." },
  { q: "What's the maximum file size?", a: "Free: 500MB. Pro: 2GB. Studio: 5GB per file." },
  { q: "Can I set a target file size?", a: "Yes! Enter your target (e.g., 25MB for Discord) and the AI optimizes to match." },
  { q: "Does it support 4K?", a: "Yes! Compress 4K videos or downscale for additional savings." },
  { q: "Is there a watermark?", a: "No watermarks on any plan, including free." },
];

const FEATURES = [
  { title: "Smart Compression", desc: "AI finds the optimal bitrate for maximum compression with minimal quality loss." },
  { title: "Target Size", desc: "Set an exact file size target and the compressor optimizes to hit it." },
  { title: "Resolution Control", desc: "Downscale from 4K to 1080p, 720p, or any custom resolution." },
  { title: "Format Conversion", desc: "Convert between MP4, WebM, MOV, and AVI with optimized encoding." },
  { title: "Browser Processing", desc: "Your video is compressed locally in your browser. Complete privacy." },
  { title: "Quality Preview", desc: "Side-by-side comparison before and after compression." },
];

const STEPS = [
  { n: 1, title: "Upload Video", desc: "Drag and drop any video file. Supports MP4, MOV, AVI, WebM, and more." },
  { n: 2, title: "Choose Settings", desc: "Set target file size, resolution, or use AI auto-optimization." },
  { n: 3, title: "Download", desc: "Download your compressed video. Smaller file, same quality." },
];

const STATS = [
  { v: "90%", l: "Smaller files" },
  { v: "100%", l: "Local privacy" },
  { v: "4K", l: "Resolution support" },
  { v: "10+", l: "Formats" },
];

const HERO_IMG = "https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>Compress · Free</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Compress videos without losing quality
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              Reduce file sizes by up to 90% while maintaining visual quality. Browser-based, free, private.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Compress video free</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Creator working with video files on a computer" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Large files, slow uploads, storage limits</Headline>
            <Lead>
              YouTube upload limits, Discord caps, email attachments. Our smart compressor reduces file size dramatically while preserving quality.
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
          <CenteredHeader eyebrow="Workflow" headline="From upload to download in three steps" />
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
            <Headline>Shrink any video instantly</Headline>
            <Lead style={{ maxWidth: 480 }}>Free, private, browser-based compression. No signup required.</Lead>
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
