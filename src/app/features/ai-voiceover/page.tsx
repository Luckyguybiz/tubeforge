import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Voiceover Generator — 50+ Voices, 30+ Languages",
  description: "Create professional voiceovers instantly with 50+ AI narrators. Multilingual support, studio-quality output.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Voiceover Generator — 50+ Voices, 30+ Languages",
    description: "Create professional voiceovers instantly with 50+ AI narrators. Multilingual support, studio-quality output.",
    type: "website",
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
  { q: "Can I clone my own voice?", a: "Voice cloning is coming soon! Currently we offer 50+ pre-built AI voices." }
];

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ padding: "120px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 980, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 20, fontSize: 12, color: "#10b981", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            50+ Voices · AI
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Professional Voiceovers in{" "}
            <span style={{ background: "linear-gradient(135deg, #10b981, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>50+ Voices</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Generate natural-sounding voiceovers in seconds. Choose from 50+ AI narrators across 30+ languages.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#10b981", color: "#fff", fontSize: 15, fontWeight: 500, padding: "12px 24px", borderRadius: 980, textDecoration: "none" }}>
              Try Voiceover Free
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
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>Quality Voiceover Without the Recording Studio</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Professional voiceover artists are expensive and slow. AI voiceovers give you broadcast-quality narration instantly.</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px", color: "#fff" }}>Everything you need</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "0 0 40px" }}>AI Voiceover Generator</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>50+ AI Voices</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Male, female, young, old, authoritative, friendly — find the perfect voice for your content.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>30+ Languages</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Generate voiceovers in English, Spanish, French, German, Japanese, Korean, and 25+ more.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Instant Generation</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Type your script, click generate. Get broadcast-quality audio in under 10 seconds.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Emotion & Tone</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Adjust speaking style: excited, calm, professional, casual, dramatic, or whispered.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>SSML Support</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Fine-tune pronunciation, pauses, emphasis, and speed with advanced SSML markup.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Audio Export</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Export as MP3, WAV, or OGG. Perfect quality for any platform or editing software.</p>
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#10b981", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>1</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Write Your Script</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Type or paste your narration text. The AI handles punctuation and pacing.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#10b981", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>2</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Choose Voice & Style</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Pick from 50+ voices, set the language, and adjust emotion/tone.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#10b981", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>3</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Generate & Download</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Click generate and download your voiceover for videos or podcasts.</p>
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
                <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginBottom: 2 }}>50+</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Voice Library</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginBottom: 2 }}>30+</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Languages</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginBottom: 2 }}>‹ 10 Sec</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Speed</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginBottom: 2 }}>Studio Grade</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Quality</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginBottom: 2 }}>95% Savings</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>vs Voice Actor</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginBottom: 2 }}>Unlimited</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Iterations</div>
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
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 12px" }}>Give Your Videos a Professional Voice</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", lineHeight: 1.6 }}>50+ AI narrators. 30+ languages. Generate your first voiceover free.</p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#10b981", color: "#fff", fontSize: 16, fontWeight: 500, padding: "12px 28px", borderRadius: 980, textDecoration: "none" }}>
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
