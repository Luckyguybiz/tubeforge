import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — TubeForge',
  description: 'Learn more about TubeForge, the AI-powered platform for YouTube creators.',
};

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fff',
        color: '#18181b',
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#71717a',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 18 }}>{'\u2190'}</span>
          Back to Home
        </Link>

        <article
          style={{
            background: '#fafafa',
            border: '1px solid #e4e4e7',
            borderRadius: 20,
            padding: '48px 40px',
          }}
        >
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: '-.02em',
              marginBottom: 8,
            }}
          >
            About TubeForge
          </h1>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 32 }}>
            Our mission and story
          </p>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              Our Mission
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#71717a', marginBottom: 12 }}>
              TubeForge is an AI-powered platform designed for YouTube creators.
              We help you generate, optimize, and publish video content faster
              than ever before.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#71717a' }}>
              Our tools leverage state-of-the-art artificial intelligence to
              assist with video generation, AI voiceovers, thumbnail creation,
              and SEO optimization — so you can focus on what matters most:
              creating content your audience loves.
            </p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              Contact Us
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#71717a' }}>
              Have questions or feedback? Reach out to us at{' '}
              <a
                href="mailto:support@tubeforge.co"
                style={{ color: '#6366f1', textDecoration: 'underline' }}
              >
                support@tubeforge.co
              </a>
              .
            </p>
          </section>
        </article>

        <div
          style={{
            textAlign: 'center',
            marginTop: 32,
            fontSize: 13,
            color: '#a1a1aa',
          }}
        >
          {'\u00A9'} {new Date().getFullYear()} TubeForge. All rights reserved.
        </div>
      </div>
    </main>
  );
}
