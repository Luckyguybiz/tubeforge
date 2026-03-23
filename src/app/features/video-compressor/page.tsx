import type { Metadata } from "next";
import { LandingNav, FaqAccordion } from "@/components/landing";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Video Compressor — Reduce Size Without Quality Loss",
  description: "Compress videos up to 90% smaller with no visible quality loss. Browser-based, private, free.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free Video Compressor — Reduce Size Without Quality Loss",
    description: "Compress videos up to 90% smaller with no visible quality loss. Browser-based, private, free.",
    type: "website",
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
  { q: "Is there a watermark?", a: "No watermarks on any plan, including free." }
];

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ padding: "120px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 980, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 20, fontSize: 12, color: "#8b5cf6", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />
            Compress · Free
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Compress Videos Without{" "}
            <span style={{ background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Losing Quality</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Reduce file sizes by up to 90% while maintaining visual quality. Browser-based, free, private.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#8b5cf6", color: "#fff", fontSize: 15, fontWeight: 500, padding: "12px 24px", borderRadius: 980, textDecoration: "none" }}>
              Compress Video Free
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
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>Large Files, Slow Uploads, Storage Limits</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>YouTube upload limits, Discord caps, email attachments. Our smart compressor reduces file size dramatically while preserving quality.</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px", color: "#fff" }}>Everything you need</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "0 0 40px" }}>Video Compressor</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Smart Compression</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>AI finds the optimal bitrate for maximum compression with minimal quality loss.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Target Size</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Set an exact file size target and the compressor optimizes to hit it.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Resolution Control</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Downscale from 4K to 1080p, 720p, or any custom resolution.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Format Conversion</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Convert between MP4, WebM, MOV, and AVI with optimized encoding.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Browser Processing</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Your video is compressed locally in your browser. Complete privacy.</p>
              </div>
              <div style={{ borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Quality Preview</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Side-by-side comparison before and after compression.</p>
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#8b5cf6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>1</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Upload Video</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Drag and drop any video file. Supports MP4, MOV, AVI, WebM, and more.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#8b5cf6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>2</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Choose Settings</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Set target file size, resolution, or use AI auto-optimization.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#8b5cf6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>3</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Download</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>Download your compressed video. Smaller file, same quality.</p>
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
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8b5cf6", marginBottom: 2 }}>Up to 90%</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Compression</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8b5cf6", marginBottom: 2 }}>Lossless Look</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Quality</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8b5cf6", marginBottom: 2 }}>100% Local</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Privacy</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8b5cf6", marginBottom: 2 }}>‹ 1 Min</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Speed</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8b5cf6", marginBottom: 2 }}>10+</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Formats</div>
              </div>
              <div style={{ textAlign: "center", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8b5cf6", marginBottom: 2 }}>Free</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Price</div>
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
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 12px" }}>Shrink Any Video Instantly</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", lineHeight: 1.6 }}>Free, private, browser-based compression. No signup required.</p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#8b5cf6", color: "#fff", fontSize: 16, fontWeight: 500, padding: "12px 28px", borderRadius: 980, textDecoration: "none" }}>
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
