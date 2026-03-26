import Link from 'next/link';
import type { Metadata } from 'next';

/* ── Data ──────────────────────────────────────────────── */

const COMPARISONS = [
  { slug: 'tubeforge-vs-vidiq', name: 'vidIQ', tagline: 'YouTube SEO & analytics' },
  { slug: 'tubeforge-vs-tubebuddy', name: 'TubeBuddy', tagline: 'YouTube channel management' },
  { slug: 'tubeforge-vs-pictory', name: 'Pictory', tagline: 'AI video production' },
  { slug: 'tubeforge-vs-invideo', name: 'InVideo', tagline: 'AI video creation' },
  { slug: 'tubeforge-vs-capcut', name: 'CapCut', tagline: 'Video editing' },
  { slug: 'tubeforge-vs-synthesia', name: 'Synthesia', tagline: 'AI avatar videos' },
  { slug: 'tubeforge-vs-fliki', name: 'Fliki', tagline: 'Text-to-video' },
  { slug: 'tubeforge-vs-veed', name: 'VEED', tagline: 'Online video editing' },
  { slug: 'tubeforge-vs-opus-clip', name: 'Opus Clip', tagline: 'AI video clipping' },
  { slug: 'tubeforge-vs-descript', name: 'Descript', tagline: 'Text-based editing' },
];

/* ── SEO ───────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'TubeForge Comparisons — See How We Stack Up',
  description:
    'Compare TubeForge with popular video creation and YouTube optimization tools. Feature tables, pricing, pros and cons for each competitor.',
  openGraph: {
    title: 'TubeForge Comparisons — See How We Stack Up',
    description:
      'Compare TubeForge with popular video creation and YouTube optimization tools. Feature tables, pricing, pros and cons for each competitor.',
    type: 'website',
    locale: 'en_US',
    url: 'https://tubeforge.co/compare',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Comparisons' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/compare',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TubeForge Comparisons — See How We Stack Up',
    description:
      'Compare TubeForge with popular video creation and YouTube optimization tools.',
    images: ['/api/og'],
  },
};

/* ── Styles ────────────────────────────────────────────── */

const accentColor = '#6c5ce7';

/* ── Page ──────────────────────────────────────────────── */

export default function ComparePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'TubeForge Comparisons',
    description: metadata.description,
    url: 'https://tubeforge.co/compare',
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Back link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 18 }}>{'\u2190'}</span>
          Home
        </Link>

        {/* Hero */}
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20,
            padding: '48px 40px',
            marginBottom: 40,
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-.02em',
              margin: '0 0 16px',
              lineHeight: 1.3,
            }}
          >
            <span style={{ color: accentColor }}>TubeForge</span> vs Competitors
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 640,
            }}
          >
            See how TubeForge compares to popular video creation and YouTube optimization tools.
            Feature-by-feature breakdowns, pricing, and honest pros &amp; cons.
          </p>
        </div>

        {/* Comparison cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
            marginBottom: 48,
          }}
        >
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '24px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                textDecoration: 'none',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                <span style={{ color: accentColor }}>TubeForge</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}> vs </span>
                {c.name}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                {c.tagline}
              </div>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: accentColor,
                }}
              >
                View comparison {'\u2192'}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: '-.02em',
            }}
          >
            Try TubeForge for Free
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 15,
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Start creating videos with AI today. Free, no credit card required.
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 36px',
              borderRadius: 12,
              background: accentColor,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 700,
              boxShadow: `0 4px 16px ${accentColor}44`,
              transition: 'all .2s',
            }}
          >
            Try TubeForge for Free
          </Link>
        </div>
      </div>
    </main>
  );
}
