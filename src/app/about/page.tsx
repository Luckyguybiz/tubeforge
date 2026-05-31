import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about TubeForge, the AI-powered platform for YouTube creators. Our mission, team, and vision.",
  openGraph: {
    title: "About — TubeForge",
    description: "Learn about TubeForge, the AI-powered platform helping YouTube creators produce professional content.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "About TubeForge" }],
  },
  alternates: { canonical: "https://tubeforge.co/about" },
  twitter: {
    card: "summary_large_image",
    title: "About — TubeForge",
    description: "Learn about TubeForge, the AI-powered platform for YouTube creators.",
    images: ["/api/og"],
  },
};

const HERO_IMG = "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1600";

const PILLARS = [
  { title: "AI that does the heavy lifting", desc: "Generate video, voiceovers, thumbnails, and metadata with state-of-the-art models — no camera or crew required." },
  { title: "Publish without the busywork", desc: "Connect your channel, drop videos into the calendar, and let TubeForge handle scheduling and upload status." },
  { title: "Tools that respect your time", desc: "A dozen free creator tools — titles, tags, descriptions, and more — ready the moment inspiration strikes." },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>About TubeForge</Eyebrow>
            <Display as="h1" style={{ maxWidth: 820 }}>Built so creators can focus on creating</Display>
            <Lead style={{ maxWidth: 600 }}>
              TubeForge is an AI studio for YouTube creators &mdash; generate, optimize, and publish video content faster than ever, without a studio or a team.
            </Lead>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Creators collaborating on video content" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Mission */}
      <Section tight>
        <Container width="narrow">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Headline>Our mission</Headline>
            <Body>
              TubeForge is an AI-powered platform designed for YouTube creators. We help you generate, optimize, and publish video content faster than ever before.
            </Body>
            <Body>
              Our tools leverage state-of-the-art artificial intelligence to assist with video generation, AI voiceovers, thumbnail creation, and SEO optimization &mdash; so you can focus on what matters most: creating content your audience loves.
            </Body>
          </div>
        </Container>
      </Section>

      {/* What we build */}
      <Section alt>
        <Container width="wide">
          <CenteredHeader eyebrow="What we build" headline="One studio, end to end" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 48 }}>
            {PILLARS.map((p) => (
              <Card key={p.title} style={{ background: "var(--bg-primary)" }}>
                <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg-primary)", margin: "0 0 8px" }}>{p.title}</h3>
                <Body style={{ fontSize: 15 }}>{p.desc}</Body>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Contact */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Headline>Get in touch</Headline>
            <Lead style={{ maxWidth: 480 }}>Questions or feedback? We read every message.</Lead>
            <a href="mailto:support@tubeforge.co" style={{ color: "var(--color-brand-500, #6366f1)", fontSize: 17, fontWeight: 500, textDecoration: "none" }}>
              support@tubeforge.co
            </a>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section alt>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Headline>Start creating with TubeForge</Headline>
            <Lead style={{ maxWidth: 480 }}>Free to start. No credit card required.</Lead>
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
