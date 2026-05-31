import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "AI Image Generator — DALL-E 3 Powered",
  description:
    "Generate high-quality images with DALL-E 3 in seconds. 30+ style presets, a built-in prompt assistant, and 4K upscaling — no design skills required.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Image Generator — DALL-E 3 Powered",
    description: "Generate high-quality images with DALL-E 3 in seconds. 30+ style presets, prompt assistant, and 4K upscaling.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/ai-image-generator",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/ai-image-generator" },
  twitter: {
    card: "summary_large_image",
    title: "AI Image Generator — DALL-E 3 Powered",
    description: "Generate high-quality images with DALL-E 3 in seconds. 30+ style presets, prompt assistant, and 4K upscaling.",
  },
};

const FAQ_ITEMS = [
  { q: "What AI model is used?", a: "OpenAI's DALL-E 3, capable of understanding complex prompts and creating highly detailed images." },
  { q: "Can I use images commercially?", a: "Yes! All images on paid plans come with full commercial rights." },
  { q: "What resolution are the images?", a: "Base is 1024×1024. You can upscale to 2K or 4K." },
  { q: "How many images can I generate?", a: "Free: 5/month. Pro: 100/month. Studio: unlimited." },
  { q: "Can I edit generated images?", a: "Yes! Inpainting, background change, and element addition are all available." },
  { q: "Do I need complex prompts?", a: "No! The prompt assistant helps you create effective prompts in plain language." },
];

const FEATURES = [
  { title: "DALL-E 3 Powered", desc: "The latest and most capable image generation model. Photorealistic, artistic, or stylized — whatever your brief calls for." },
  { title: "Style Presets", desc: "30+ curated styles: photorealistic, anime, digital art, watercolor, 3D render, vintage, and more." },
  { title: "Prompt Generator", desc: "Don't know what to write? Our AI prompt assistant helps you describe exactly what you want in plain language." },
  { title: "Variations", desc: "Generate 4 variations at once. Pick the best one or remix with new prompts until it's perfect." },
  { title: "Upscale & Edit", desc: "Upscale to 4K. Edit specific areas with inpainting, swap backgrounds, and add new elements." },
  { title: "Instant Generation", desc: "Images generated in 5–10 seconds. No waiting, no queues, no hardware required." },
];

const STEPS = [
  { n: 1, title: "Describe or Choose Style", desc: "Write a text prompt or use our assistant. Then select a style preset to match your vision." },
  { n: 2, title: "Generate Variations", desc: "AI creates 4 unique images based on your prompt, ready to compare side by side." },
  { n: 3, title: "Refine & Download", desc: "Pick your favorite, upscale it, and download in any format ready for your channel." },
];

const STATS = [
  { v: "~8s", l: "Generation speed" },
  { v: "DALL-E 3", l: "AI model" },
  { v: "30+", l: "Style presets" },
  { v: "4K", l: "Export quality" },
];

const HERO_IMG = "https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>AI Images · DALL-E 3</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Generate stunning images from a sentence
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              Create any image you can imagine &mdash; thumbnails, backgrounds, illustrations. Powered by DALL-E 3 with 30+ style presets and a built-in prompt assistant.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Generate images free</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Designer creating visuals on a creative workstation" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Professional images without professional skills</Headline>
            <Lead>
              Stock photos are generic. Hiring designers is expensive and slow. AI image generation gives you unique, on-brand visuals in seconds &mdash; no camera, no studio, no design degree.
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
          <CenteredHeader eyebrow="Workflow" headline="From prompt to download in three steps" />
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
            <Headline>Create any image you can imagine</Headline>
            <Lead style={{ maxWidth: 480 }}>DALL-E 3 powered image generation. Get 5 free generations to start.</Lead>
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
