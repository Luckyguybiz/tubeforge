import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Video Translator — Voice Cloning & Lip Sync",
  description: "Translate videos to 30+ languages with AI voice cloning and automatic lip-sync.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Video Translator — Voice Cloning & Lip Sync",
    description: "Translate videos to 30+ languages with AI voice cloning and automatic lip-sync.",
    type: "website",
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
  { q: "Do I need to provide a script?", a: "No! AI auto-transcribes and translates. Optionally review before translation." }
];

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ padding: "120px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 980, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 20, fontSize: 12, color: "#0ea5e9", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9" }} />
            Voice Clone · 30+ Languages
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Translate Your Videos to{" "}
            <span style={{ background: "linear-gradient(135deg, #0ea5e9, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>30+ Languages</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
            AI clones your voice and speaks in any language. Reach a global audience without re-recording.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0ea5e9", color: "#fff", fontSize: 15, fontWeight: 500, padding: "12px 24px", borderRadius: 980, textDecoration: "none" }}>
              Translate a Video
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
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>Your Content Deserves a Global Audience</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>80% of YouTube viewers speak a language other than English. Translating your videos multiplies your audience overnight.</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px", color: "#fff" }}>Everything you need</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "0 0 40px" }}>AI Video Translator</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>30+ Languages</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Translate to English, Spanish, French, German, Portuguese, Japanese, Korean, Hindi, Arabic, and more.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Voice Cloning</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>AI clones your unique voice and speaks in the target language. Viewers hear YOU.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Lip Sync</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>AI adjusts lip movements to match the translated audio for a natural result.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Full Video Output</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Complete translated video — audio, subtitles, and lip-sync all included.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Multi-Language Batch</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Translate one video into multiple languages simultaneously.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Fast Processing</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>A 10-minute video translates in under 5 minutes.</p>
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0ea5e9", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>1</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Upload Your Video</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Upload any video with speech. AI transcribes and analyzes your voice.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0ea5e9", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>2</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Choose Languages</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Select one or multiple target languages. AI clones your voice for each.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0ea5e9", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>3</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Download & Publish</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Get translated videos with voice cloning and lip-sync. Ready for YouTube.</p>
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
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9", marginBottom: 2 }}>30+</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Languages</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9", marginBottom: 2 }}>95%</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Voice Match</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9", marginBottom: 2 }}>10x</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Audience Reach</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9", marginBottom: 2 }}>Included</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Lip Sync</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9", marginBottom: 2 }}>‹ 5 Min</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Speed</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9", marginBottom: 2 }}>Simultaneous</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Batch Translation</div>
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
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 12px" }}>Go Global With Your Content</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", lineHeight: 1.6 }}>AI voice cloning + translation + lip-sync. Try your first translation free.</p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0ea5e9", color: "#fff", fontSize: 16, fontWeight: 500, padding: "12px 28px", borderRadius: 980, textDecoration: "none" }}>
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
