import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Subtitle Editor — Animated Captions & Auto-Transcription",
  description: "12+ animated subtitle styles including viral one-word mode. Auto-transcription, frame-by-frame timing, SRT export.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Subtitle Editor — Animated Captions & Auto-Transcription",
    description: "12+ animated subtitle styles including viral one-word mode. Auto-transcription, frame-by-frame timing, SRT export.",
    type: "website",
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
  { q: "Is the subtitle editor free?", a: "Auto-transcription up to 5 minutes is free. Pro offers unlimited duration and all style presets." }
];

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ padding: "120px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 980, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 20, fontSize: 12, color: "#eab308", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#eab308" }} />
            Styles · Animation
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Subtitles That Make Videos{" "}
            <span style={{ background: "linear-gradient(135deg, #eab308, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Unforgettable</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
            12+ animated text styles, frame-by-frame timing, one-word highlight mode. Create viral-style subtitles.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eab308", color: "#fff", fontSize: 15, fontWeight: 500, padding: "12px 24px", borderRadius: 980, textDecoration: "none" }}>
              Open Subtitle Editor
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
            <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", fontSize: 15, fontWeight: 500, padding: "12px 24px", borderRadius: 980, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>Subtitles Are No Longer Optional</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>85% of social media videos are watched without sound. Our editor gives you the animated, eye-catching subtitle styles that go viral.</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px", color: "#fff" }}>Everything you need</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "0 0 40px" }}>Subtitle Editor</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>12+ Text Styles</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Bold karaoke, gradient glow, outline pop, bounce animation — every style optimized for engagement.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>One-Word Mode</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Highlight one word at a time — the viral subtitle style used by top creators on Shorts and TikTok.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Auto-Transcription</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>AI transcribes your audio and places subtitles automatically. Manual fine-tuning available.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Custom Styling</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Full control over fonts, colors, sizes, shadows, backgrounds, and positions.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Frame-by-Frame</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Precise timing control. Sync every word perfectly with your audio.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>SRT/VTT Export</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Export as SRT, VTT, or burned-in subtitles. Compatible with all platforms.</p>
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eab308", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>1</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Upload Video</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Upload your video and let AI auto-transcribe, or import your own SRT file.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eab308", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>2</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Style & Animate</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Choose a style preset, customize colors and fonts, set the animation mode.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eab308", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>3</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Export</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Download as SRT file or burn subtitles directly into the video.</p>
              </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "60px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 32px", color: "#fff" }}>Results that speak</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#eab308", marginBottom: 2 }}>+40%</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Engagement Boost</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#eab308", marginBottom: 2 }}>12+</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Text Styles</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#eab308", marginBottom: 2 }}>98%</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Auto-Transcription</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#eab308", marginBottom: 2 }}>50+</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Languages</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#eab308", marginBottom: 2 }}>4 Formats</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Export Options</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#eab308", marginBottom: 2 }}>Included</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Viral One-Word</div>
              </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 32px", color: "#fff" }}>Frequently asked questions</h2>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center", background: "#111111" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 12px" }}>Add Viral Subtitles to Your Videos</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", lineHeight: 1.6 }}>Auto-transcription + 12 animated styles. Start free.</p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eab308", color: "#fff", fontSize: 16, fontWeight: 500, padding: "12px 28px", borderRadius: 980, textDecoration: "none" }}>
            Start Free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>
      </section>

      <footer style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.06)", padding: 24, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>&copy; 2026 TubeForge. All rights reserved.</span>
      </footer>
    </div>
  );
}
