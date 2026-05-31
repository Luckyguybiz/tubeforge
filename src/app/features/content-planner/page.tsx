import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "Content Planner — Calendar, Ideas & Scheduling",
  description:
    "Plan, schedule, and organize your content with a visual calendar, ideas bank, templates, and cross-platform scheduling. Never miss a publish date.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Content Planner — Calendar, Ideas & Scheduling",
    description: "Plan, schedule, and organize content with a visual calendar, ideas bank, and multi-platform support.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/content-planner",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/content-planner" },
  twitter: {
    card: "summary_large_image",
    title: "Content Planner — Calendar, Ideas & Scheduling",
    description: "Plan, schedule, and organize content with a visual calendar, ideas bank, and multi-platform support.",
  },
};

const FAQ_ITEMS = [
  { q: "Is the Content Planner free?", a: "Basic planning with calendar and ideas bank is free. Pro adds templates and team collaboration." },
  { q: "Can I plan for multiple platforms?", a: "Yes! Plan for YouTube, Shorts, TikTok, Instagram, and more in one calendar." },
  { q: "Can my team use it?", a: "Studio plan supports up to 10 team members with role-based access." },
  { q: "Does it integrate with YouTube?", a: "Yes! Connect your channel to schedule and auto-publish." },
  { q: "Can I import existing plans?", a: "Yes, import from CSV, Google Sheets, or Notion." },
  { q: "Does AI suggest ideas?", a: "Yes! Based on your niche, past performance, and trends." },
];

const FEATURES = [
  { title: "Visual Calendar", desc: "Drag-and-drop content calendar. See your entire month at a glance, color-coded by platform." },
  { title: "Ideas Bank", desc: "Save, organize, and rate content ideas. AI suggests fresh ideas based on trends." },
  { title: "Templates", desc: "Reusable templates for thumbnails, titles, descriptions, and scripts to move faster." },
  { title: "Production Pipeline", desc: "Track every video from idea to script to film to edit to publish, and spot bottlenecks." },
  { title: "Analytics Integration", desc: "See which planned content performed best and optimize your future schedules." },
  { title: "Multi-Platform", desc: "Plan for YouTube, Shorts, TikTok, Instagram, and more in one unified calendar." },
];

const STEPS = [
  { n: 1, title: "Set Your Schedule", desc: "Define publishing frequency and preferred days. Your calendar fills with ready-to-use slots." },
  { n: 2, title: "Fill Your Pipeline", desc: "Add ideas from your bank, assign them to slots, and track production progress." },
  { n: 3, title: "Execute & Publish", desc: "Follow your plan, mark each step complete, and use scheduling to auto-publish." },
];

const STATS = [
  { v: "3×", l: "More consistency" },
  { v: "5 hrs", l: "Saved per week" },
  { v: "100+", l: "Templates" },
  { v: "5+", l: "Platforms" },
];

const HERO_IMG = "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>Planning · Calendar</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Plan your content like a pro creator
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              Visual calendar, ideas bank, templates, and cross-platform scheduling &mdash; so you never miss a publish date again.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Start planning free</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Creator planning content on a calendar at a desk" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Consistency is the hardest part</Headline>
            <Lead>
              Most creators fail because of inconsistency, not bad content. A clear plan turns scattered ideas into a steady publishing rhythm, making it effortless to show up week after week.
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
          <CenteredHeader eyebrow="Workflow" headline="From schedule to publish in three steps" />
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
            <Headline>Plan, create, publish &mdash; repeat</Headline>
            <Lead style={{ maxWidth: 480 }}>Your entire content workflow in one place. Free to start.</Lead>
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
