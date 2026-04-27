import Link from 'next/link';
import YouTubePlayBadgeMount from './YouTubePlayBadgeMount';

/**
 * LandingHero — Server Component (no 'use client')
 *
 * Renders the hero heading immediately without JavaScript hydration delays.
 * CSS-only animations via @keyframes replace the old useState/useEffect
 * approach that held the LCP element at opacity:0 for 150ms+ after hydration.
 *
 * Layout: two-column on desktop (text left, interactive 3D play badge
 * right). On mobile the badge stacks above the text. The 3D bundle is
 * lazy-loaded client-side so it never blocks the H1 LCP.
 */
export function LandingHero() {
  return (
    <section
      id="landing-hero"
      className="landing-hero-section"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        background: '#0a0a0a',
        overflow: 'hidden',
      }}
    >
      <div className="hero-grid">
        {/* TEXT COLUMN */}
        <div className="hero-text-col">
          {/* Badge */}
          <div
            className="hero-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 980,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              marginBottom: 24,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#818cf8', letterSpacing: '0.01em' }}>AI Thumbnail Generator</span>
          </div>

          {/* Headline — LCP element */}
          <h1
            style={{
              fontSize: 'clamp(28px, 6.4vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              margin: '0 0 20px',
              color: '#ffffff',
            }}
          >
            AI Thumbnails
            <br />
            That Beat Your Niche
          </h1>

          {/* Subtitle */}
          <p
            className="hero-subtitle"
            style={{
              fontSize: 'clamp(15px, 4vw, 18px)',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.5,
              maxWidth: 540,
              margin: '0 0 32px',
              fontWeight: 400,
            }}
          >
            GPT-4o analyses what&rsquo;s working in your niche, then generates thumbnails in that style. No more guessing — designed to lift CTR from the first upload.
          </p>

          {/* CTA */}
          <div
            className="hero-cta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/thumbnails"
              className="tf-cta-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#6366f1',
                color: '#fff',
                fontSize: 17,
                fontWeight: 500,
                padding: '12px 28px',
                borderRadius: 12,
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minHeight: 48,
                boxShadow: '0 0 30px rgba(99,102,241,0.4)',
              }}
            >
              Generate your first thumbnail
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
            <a
              href="#how-it-works"
              className="tf-cta-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'rgba(255,255,255,0.5)',
                fontSize: 17,
                fontWeight: 400,
                padding: '12px 28px',
                borderRadius: 12,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minHeight: 48,
                background: 'transparent',
                border: 'none',
              }}
            >
              See how it works
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
            </a>
          </div>

          {/* Trust signals */}
          <div
            className="hero-trust"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              marginTop: 40,
              flexWrap: 'wrap',
            }}
          >
            {['3 free thumbnails / mo', 'No credit card', 'Niche-aware AI'].map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3D BADGE COLUMN — interactive YouTube play button hung from a rope.
            Lazy-loaded so the 3D bundle never blocks LCP. Hint text is for
            first-time visitors who might miss that it's draggable. */}
        <div className="hero-badge-col" aria-hidden>
          <YouTubePlayBadgeMount />
          <div className="hero-badge-hint">drag me</div>
        </div>
      </div>

      {/* CSS-only hero animations + responsive grid */}
      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 32px;
          align-items: center;
          width: 100%;
          max-width: 1200px;
        }
        .hero-text-col { text-align: left; }
        .hero-badge-col {
          position: relative;
          height: 480px;
          width: 100%;
        }
        .hero-badge-hint {
          position: absolute;
          bottom: 12px;
          right: 12px;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          pointer-events: none;
          animation: hintPulse 2.4s ease-in-out infinite;
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hintPulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.75; }
        }
        .hero-badge {
          animation: heroFadeUp 0.6s cubic-bezier(.4,0,.2,1) 0.1s both;
        }
        .hero-subtitle {
          animation: heroFadeUp 0.7s cubic-bezier(.4,0,.2,1) 0.25s both;
        }
        .hero-cta {
          animation: heroFadeUp 0.7s cubic-bezier(.4,0,.2,1) 0.4s both;
        }
        .hero-trust {
          animation: heroFadeUp 0.8s cubic-bezier(.4,0,.2,1) 0.55s both;
        }
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 0;
          }
          .hero-text-col {
            text-align: center;
            order: 2;
          }
          .hero-text-col .hero-cta,
          .hero-text-col .hero-trust {
            justify-content: center;
          }
          .hero-text-col p { margin-left: auto; margin-right: auto; }
          .hero-badge-col {
            order: 1;
            height: 380px;
            margin-bottom: 16px;
          }
        }
        @media (max-width: 768px) {
          .landing-hero-section {
            padding: 100px 16px 56px !important;
          }
          .hero-badge-col {
            height: 340px;
          }
        }
        @media (max-width: 480px) {
          .landing-hero-section {
            padding: 88px 16px 40px !important;
          }
          .hero-badge-col {
            height: 300px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-badge, .hero-subtitle, .hero-cta, .hero-trust, .hero-badge-hint {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}
