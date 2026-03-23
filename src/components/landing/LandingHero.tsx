import Link from 'next/link';

/**
 * LandingHero — Server Component (no 'use client')
 *
 * Renders the hero heading immediately without JavaScript hydration delays.
 * CSS-only animations via @keyframes replace the old useState/useEffect
 * approach that held the LCP element at opacity:0 for 150ms+ after hydration.
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
        padding: '160px 24px 100px',
        background: '#0a0a0a',
      }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#818cf8', letterSpacing: '0.01em' }}>AI-Powered Creator Platform</span>
        </div>

        {/* Headline — LCP element, renders immediately at full opacity */}
        <h1
          style={{
            fontSize: 'clamp(28px, 7vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            margin: '0 0 20px',
            color: '#ffffff',
          }}
        >
          Create YouTube Videos
          <br />
          That Go Viral
        </h1>

        {/* Subtitle */}
        <p
          className="hero-subtitle"
          style={{
            fontSize: 'clamp(15px, 4vw, 18px)',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.5,
            maxWidth: 540,
            margin: '0 auto 40px',
            fontWeight: 400,
          }}
        >
          AI-powered tools for thumbnails, video editing, SEO optimization, and more. Everything you need in one platform.
        </p>

        {/* CTA */}
        <div
          className="hero-cta"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/register"
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
            Start Free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
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
            See How It Works
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </a>
        </div>

        {/* Trust signals */}
        <div
          className="hero-trust"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            marginTop: 48,
            flexWrap: 'wrap',
          }}
        >
          {['Free forever', 'No credit card', '10,000+ creators'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* CSS-only hero animations — badge/subtitle/CTA animate in without JS,
          h1 stays fully visible to avoid blocking LCP */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
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
        @media (max-width: 768px) {
          .landing-hero-section {
            padding: 120px 16px 64px !important;
          }
        }
        @media (max-width: 480px) {
          .landing-hero-section {
            padding: 100px 16px 48px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-badge, .hero-subtitle, .hero-cta, .hero-trust {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}
