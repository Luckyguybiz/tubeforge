import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";

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

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ padding: "80px 24px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 980, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 20, fontSize: 12, color: "#3b82f6", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
            Lookup · Public info
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Look up any YouTube video{" "}
            <span style={{ background: "linear-gradient(135deg, #3b82f6, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>in seconds</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Paste a YouTube URL and see the public info — title, channel, stats, description, tags. No scores, no AI guesses — just what YouTube returns.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#3b82f6", color: "#fff", fontSize: 15, fontWeight: 500, padding: "12px 24px", borderRadius: 980, textDecoration: "none" }}>
              Try Video Inspector
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
            <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", fontSize: 15, fontWeight: 500, padding: "12px 24px", borderRadius: 980, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Problem / mission */}
      <section style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>Quick public info, no fluff</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>
            See exactly what YouTube exposes for any public video — title, description structure, tags, public counts. We do not score, rank, or compare videos.
          </p>
        </div>
      </section>

      {/* What you get */}
      <section style={{ padding: "60px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px", color: "#fff" }}>What you see</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "0 0 40px" }}>Direct YouTube Data API fields, nothing more</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Title & channel</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Video title, channel name, and a link to the channel — straight from the public listing.</p>
            </div>
            <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Public counts</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Views, likes, comments. Like-rate and comment-rate calculated as count ÷ views.</p>
            </div>
            <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Description & tags</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Full description text, tag list, plus simple structure flags (timestamps, links, hashtags, CTA detected).</p>
            </div>
            <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Format & metadata</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Publish date, duration, definition (HD/SD), captions, category — every field YouTube returns in the snippet.</p>
            </div>
            <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Thumbnail download</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Get the maxres thumbnail URL to download for reference. Inspect what works in your niche.</p>
            </div>
            <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Real-time</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Each lookup queries the YouTube Data API live. Nothing cached, nothing aggregated, nothing stored long-term.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 40px", color: "#fff" }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#3b82f6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>1</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Paste YouTube URL</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Copy any public YouTube video URL into the inspector.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#3b82f6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>2</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>See public info</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Title, channel, stats, description, tags, thumbnail — direct from the YouTube Data API.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#3b82f6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>3</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Save what helps</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Download the thumbnail, copy tags, or jot down ideas. Nothing about the video is stored on our side.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "60px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 32px", color: "#fff" }}>Common questions</h2>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px", color: "#fff" }}>Try Video Inspector</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", margin: "0 0 28px" }}>Free for 10 lookups per month. No credit card.</p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#3b82f6", color: "#fff", fontSize: 16, fontWeight: 500, padding: "14px 28px", borderRadius: 980, textDecoration: "none" }}>
            Get started — free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
