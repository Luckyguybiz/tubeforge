'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function LandingHero() {
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 150);
    const t2 = setTimeout(() => setTextVisible(true), 500);
    const t3 = setTimeout(() => setCtaVisible(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 980,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            marginBottom: 24,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.6s cubic-bezier(.4,0,.2,1)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#818cf8', letterSpacing: '0.01em' }}>AI-Powered Creator Platform</span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(28px, 7vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            margin: '0 0 20px',
            color: '#ffffff',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(.4,0,.2,1)',
          }}
        >
          Create YouTube Videos
          <br />
          That Go Viral
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(15px, 4vw, 18px)',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.5,
            maxWidth: 540,
            margin: '0 auto 40px',
            fontWeight: 400,
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.8s cubic-bezier(.4,0,.2,1)',
          }}
        >
          AI-powered tools for thumbnails, video editing, SEO optimization, and more. Everything you need in one platform.
        </p>

        {/* CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.8s cubic-bezier(.4,0,.2,1)',
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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            marginTop: 48,
            flexWrap: 'wrap',
            opacity: ctaVisible ? 1 : 0,
            transition: 'opacity 1s ease 0.3s',
          }}
        >
          {['Free forever', 'No credit card', '10,000+ creators'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
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
      `}</style>
    </section>
  );
}
