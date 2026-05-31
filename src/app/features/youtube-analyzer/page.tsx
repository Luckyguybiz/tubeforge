import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav, FaqAccordion } from "@/components/landing";
import { YouTubeAttribution } from "@/components/YouTubeAttribution";
import {
  Container, Section, Eyebrow, Display, Headline, Lead, Body, Caption, CenteredHeader, CTA, Card,
} from "@/components/ds";

export const metadata: Metadata = {
  title: "Video Inspector — YouTube Public Video Info Lookup",
  description:
    "Paste any YouTube URL to view public video info: title, channel, description, tags, view/like/comment counts, and download the thumbnail for reference.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Video Inspector — YouTube Public Video Info Lookup",
    description:
      "Paste any YouTube URL to view public video info: title, channel, description, tags, view/like/comment counts, and download the thumbnail for reference.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/features/youtube-analyzer",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/youtube-analyzer" },
  twitter: {
    card: "summary_large_image",
    title: "Video Inspector — YouTube Public Video Info Lookup",
    description:
      "Paste any YouTube URL to view public video info: title, channel, description, tags, view/like/comment counts, and download the thumbnail for reference.",
  },
};

const FAQ_ITEMS = [
  { q: "Can I look up any YouTube video?", a: "Yes — any public YouTube video. Paste the URL and we display the public info that the YouTube Data API returns for it." },
  { q: "Is Video Inspector free?", a: "Yes. 10 free lookups per month on the Free plan. Pro removes the cap." },
  { q: "What information is shown?", a: "Title, channel, publish date, duration, definition (HD/SD), captions flag, category, view count, like count, comment count, description, and tags. Plus the like-rate and comment-rate calculated as count over views." },
  { q: "Does Video Inspector score or rank videos?", a: "No. We do not generate any score, rating, recommendation, or comparison metric from the YouTube Data API. The page shows only the fields YouTube returns directly." },
  { q: "Can I download the thumbnail?", a: "Yes — the maxres thumbnail URL is shown and can be downloaded for reference or inspiration." },
  { q: "Where does the data come from?", a: "Directly from the YouTube Data API v3 in real time on each request. We do not store or aggregate the response." },
];

const FEATURES = [
  { title: "Title & Channel", desc: "Video title, channel name, and a link to the channel — straight from the public listing." },
  { title: "Public Counts", desc: "Views, likes, and comments. Like-rate and comment-rate calculated as count over views." },
  { title: "Description & Tags", desc: "Full description text, tag list, plus simple structure flags for timestamps, links, hashtags, and CTAs." },
  { title: "Format & Metadata", desc: "Publish date, duration, definition (HD/SD), captions, and category — every field YouTube returns in the snippet." },
  { title: "Thumbnail Download", desc: "Get the maxres thumbnail URL to download for reference. Inspect what works in your niche." },
  { title: "Real-Time Lookup", desc: "Each lookup queries the YouTube Data API live. Nothing cached, nothing aggregated, nothing stored long-term." },
];

const STEPS = [
  { n: 1, title: "Paste YouTube URL", desc: "Copy any public YouTube video URL into the inspector to get started." },
  { n: 2, title: "See Public Info", desc: "Title, channel, stats, description, tags, and thumbnail — direct from the YouTube Data API." },
  { n: 3, title: "Save What Helps", desc: "Download the thumbnail, copy tags, or jot down ideas. Nothing about the video is stored on our side." },
];

const STATS = [
  { v: "10", l: "Free lookups / month" },
  { v: "$0", l: "Credit card to start" },
  { v: "12+", l: "Public fields shown" },
  { v: "Live", l: "YouTube Data API" },
];

const HERO_IMG = "https://images.pexels.com/photos/7681091/pexels-photo-7681091.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--fg-primary)" }}>
      <LandingNav />

      {/* Hero */}
      <Section style={{ paddingTop: "clamp(56px, 9vw, 96px)", paddingBottom: 0 }}>
        <Container width="default">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
            <Eyebrow>Lookup · Public info</Eyebrow>
            <Display as="h1" style={{ maxWidth: 880 }}>
              Look up any YouTube video in seconds
            </Display>
            <Lead style={{ maxWidth: 600 }}>
              Paste a YouTube URL and see the public info &mdash; title, channel, stats, description, tags. No scores, no AI guesses, just what YouTube returns.
            </Lead>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              <CTA href="/register">Try Video Inspector</CTA>
              <CTA href="#how-it-works" variant="secondary">See how it works</CTA>
            </div>
          </div>
        </Container>
        <Container width="wide" style={{ marginTop: "clamp(40px, 7vw, 72px)" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", border: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", boxShadow: "var(--shadow-xl)" }}>
            <Image src={HERO_IMG} alt="Creator reviewing channel analytics on screen" fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} priority />
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section tight>
        <Container width="narrow">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <Headline>Quick public info, no fluff</Headline>
            <Lead>
              See exactly what YouTube exposes for any public video &mdash; title, description structure, tags, and public counts. We do not score, rank, or compare videos. Just the facts, in real time.
            </Lead>
          </div>
        </Container>
      </Section>

      {/* Features */}
      <Section alt>
        <Container width="wide">
          <CenteredHeader eyebrow="What you see" headline="Direct YouTube Data API fields, nothing more" />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}><YouTubeAttribution /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 40 }}>
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
          <CenteredHeader eyebrow="Workflow" headline="From URL to insight in three steps" />
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
            <Headline>Try Video Inspector</Headline>
            <Lead style={{ maxWidth: 480 }}>Free for 10 lookups per month. No credit card required.</Lead>
            <div style={{ marginTop: 6 }}><CTA href="/register">Get started &mdash; free</CTA></div>
          </div>
        </Container>
      </Section>

      <footer style={{ borderTop: "1px solid var(--border-subtle, rgba(128,128,128,0.12))", padding: 32, textAlign: "center" }}>
        <Caption>{"©"} 2026 TubeForge. All rights reserved.</Caption>
      </footer>
    </div>
  );
}
