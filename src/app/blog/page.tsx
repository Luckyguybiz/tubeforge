import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — TubeForge',
  description: 'Tips, tutorials, and updates from the TubeForge team.',
};

export default function BlogPage() {
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
            Blog
          </h1>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 32 }}>
            Tips, tutorials, and updates from the TubeForge team
          </p>

          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#a1a1aa',
              fontSize: 16,
            }}
          >
            <p style={{ marginBottom: 8, fontSize: 32 }}>{'\uD83D\uDCDD'}</p>
            <p style={{ fontWeight: 600, color: '#71717a', marginBottom: 4 }}>
              Coming Soon
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              We are working on articles about video creation, AI tools, and
              YouTube growth strategies. Stay tuned!
            </p>
          </div>
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
