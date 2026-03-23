import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Thumbnail Editor — Design Viral YouTube Thumbnails",
  description: "Full-featured canvas editor with DALL-E 3 AI generation. Create scroll-stopping YouTube thumbnails with templates and A/B testing.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI Thumbnail Editor — Design Viral YouTube Thumbnails",
    description: "Full-featured canvas editor with DALL-E 3 AI generation. Create scroll-stopping YouTube thumbnails with templates and A/B testing.",
    type: "website",
    url: "https://tubeforge.co/features/cover-editor",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://tubeforge.co/features/cover-editor" },
  twitter: {
    card: "summary_large_image",
    title: "AI Thumbnail Editor — Design Viral YouTube Thumbnails",
    description: "Full-featured canvas editor with DALL-E 3 AI generation. Create scroll-stopping YouTube thumbnails with templates and A/B testing.",
  },
};

const FAQ_ITEMS = [
  { q: "Is this like Canva but for YouTube?", a: "Yes! It's a full canvas editor specifically optimized for YouTube thumbnails, with AI generation and A/B testing." },
  { q: "What AI model generates the thumbnails?", a: "We use DALL-E 3, one of the most capable image generation models available." },
  { q: "Can I upload my own images and fonts?", a: "Absolutely. Upload photos, logos, custom fonts, and overlay them on any template or AI-generated background." },
  { q: "What's the export resolution?", a: "We export at 1280×720 pixels (YouTube's recommended spec) with optional higher resolutions." },
  { q: "How does A/B testing work?", a: "Upload multiple variants. We rotate them on your video and track CTR performance to find the winner." },
  { q: "Is the cover editor free?", a: "Basic editing is free with 5 AI generations/month. Pro unlocks unlimited templates and A/B testing." }
];

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ padding: "120px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 980, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 20, fontSize: 12, color: "#f97316", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316" }} />
            Canvas · DALL-E 3
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Design Thumbnails That{" "}
            <span style={{ background: "linear-gradient(135deg, #f97316, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Get Clicks</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
            A full-featured canvas editor with AI generation. Create scroll-stopping thumbnails with professional tools, templates, and DALL-E 3 integration.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f97316", color: "#fff", fontSize: 15, fontWeight: 500, padding: "12px 24px", borderRadius: 980, textDecoration: "none" }}>
              Open Cover Editor
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
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>Your Thumbnail Is Your Video's First Impression</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Studies show 90% of top-performing YouTube videos have custom thumbnails. Our Canva-style editor with AI gives you professional results in minutes.</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px", color: "#fff" }}>Everything you need</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "0 0 40px" }}>AI Thumbnail & Cover Editor</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Canvas Editor</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Drag-and-drop editor with layers, text, shapes, filters, and effects. Everything you need, nothing you don't.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>AI Generation</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Generate entire thumbnails from a text description using DALL-E 3. Get multiple variations instantly.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Template Library</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>500+ professionally designed templates organized by niche. Gaming, tech, vlogs, education, and more.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Smart Text</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Auto-sized, outlined, and shadowed text that pops. 100+ fonts optimized for YouTube thumbnails.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Background Remove</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>One-click background removal. Replace with gradients, solid colors, or AI-generated scenes.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>A/B Testing</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Generate multiple thumbnail variants and test which one performs better with real viewer data.</p>
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f97316", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>1</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Choose Your Starting Point</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Start from a blank canvas, pick a template, or generate with AI. Upload your own images or use our stock library.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f97316", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>2</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Design & Customize</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Add text, shapes, effects, and filters. Use the AI to enhance, remove backgrounds, or generate new elements.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f97316", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>3</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Export & Test</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Download in YouTube-optimized resolution. Set up A/B tests to find the highest-performing variant.</p>
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
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f97316", marginBottom: 2 }}>+85% CTR</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>CTR Improvement</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f97316", marginBottom: 2 }}>3 Min Avg</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Design Speed</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f97316", marginBottom: 2 }}>500+</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Templates</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f97316", marginBottom: 2 }}>100/mo</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>AI Generations</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f97316", marginBottom: 2 }}>1280×720</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Export Quality</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f97316", marginBottom: 2 }}>4.9/5</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Creator Rating</div>
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
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 12px" }}>Design Your Next Viral Thumbnail</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", lineHeight: 1.6 }}>Professional editor + AI generation. Free to start, no credit card required.</p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f97316", color: "#fff", fontSize: 16, fontWeight: 500, padding: "12px 28px", borderRadius: 980, textDecoration: "none" }}>
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
