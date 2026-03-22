import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

/* ── Comparison data ─────────────────────────────────────── */

interface Feature {
  name: string;
  tubeforge: string;
  competitor: string;
}

interface ComparisonData {
  name: string;
  description: string;
  features: Feature[];
  pricing: {
    tubeforge: string;
    competitor: string;
  };
  advantages: string[];
}

const COMPARISONS: Record<string, ComparisonData> = {
  'tubeforge-vs-invideo': {
    name: 'InVideo',
    description: 'Comparison of TubeForge and InVideo — two popular AI-powered video creation platforms.',
    features: [
      { name: 'AI scene generation', tubeforge: '\u2705 Yes', competitor: '\u2705 Yes' },
      { name: 'Multi-language support', tubeforge: '\u2705 Full support', competitor: '\u26A0\uFE0F Partial' },
      { name: 'YouTube integration', tubeforge: '\u2705 Publishing + analytics', competitor: '\u26A0\uFE0F Export only' },
      { name: 'SEO optimization', tubeforge: '\u2705 Built-in AI SEO', competitor: '\u274C No' },
      { name: 'Free tools', tubeforge: '\u2705 6+ tools', competitor: '\u274C No' },
      { name: 'Team collaboration', tubeforge: '\u2705 Studio plan', competitor: '\u2705 Business plan' },
      { name: 'API access', tubeforge: '\u2705 Studio', competitor: '\u274C No' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $25/mo' },
    advantages: [
      'Full multi-language support in the interface and AI',
      'Free tools: video downloads, converter, compression',
      'Built-in AI SEO for metadata optimization',
      'More affordable pricing with a free plan',
    ],
  },
  'tubeforge-vs-capcut': {
    name: 'CapCut',
    description: 'Comparison of TubeForge and CapCut — platforms for video content creation.',
    features: [
      { name: 'AI scene generation', tubeforge: '\u2705 Yes', competitor: '\u26A0\uFE0F Limited' },
      { name: 'YouTube optimization', tubeforge: '\u2705 SEO + analytics', competitor: '\u274C No' },
      { name: 'Cloud editor', tubeforge: '\u2705 Web app', competitor: '\u2705 Web + mobile' },
      { name: 'Video downloads', tubeforge: '\u2705 YouTube, TikTok, etc.', competitor: '\u274C No' },
      { name: 'AI thumbnails', tubeforge: '\u2705 Yes', competitor: '\u26A0\uFE0F Limited' },
      { name: 'Referral program', tubeforge: '\u2705 20% commission', competitor: '\u274C No' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $0/mo (Free)' },
    advantages: [
      'YouTube specialization — SEO, analytics, publishing',
      'AI generation of full videos from descriptions',
      'Built-in video downloader',
      'Referral program with 20% commission',
    ],
  },
  'tubeforge-vs-pictory': {
    name: 'Pictory',
    description: 'Comparison of TubeForge and Pictory — AI platforms for video production.',
    features: [
      { name: 'AI scene generation', tubeforge: '\u2705 Yes', competitor: '\u2705 Yes' },
      { name: 'Multi-language support', tubeforge: '\u2705 Full', competitor: '\u274C English only' },
      { name: 'Free plan', tubeforge: '\u2705 Yes', competitor: '\u274C No' },
      { name: 'YouTube SEO', tubeforge: '\u2705 Built-in', competitor: '\u274C No' },
      { name: 'Video downloads', tubeforge: '\u2705 Yes', competitor: '\u274C No' },
      { name: 'Team collaboration', tubeforge: '\u2705 Studio', competitor: '\u2705 Teams' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $23/mo' },
    advantages: [
      'Full multi-language localization',
      'Free plan to get started',
      'More built-in YouTube tools',
      'Lower prices on paid plans',
    ],
  },
  'tubeforge-vs-synthesia': {
    name: 'Synthesia',
    description: 'Comparison of TubeForge and Synthesia — AI video platforms.',
    features: [
      { name: 'AI avatars', tubeforge: '\u274C No', competitor: '\u2705 Yes' },
      { name: 'AI scene generation', tubeforge: '\u2705 Yes', competitor: '\u26A0\uFE0F Partial' },
      { name: 'YouTube tools', tubeforge: '\u2705 Full suite', competitor: '\u274C No' },
      { name: 'Free plan', tubeforge: '\u2705 Yes', competitor: '\u274C No' },
      { name: 'Video downloads', tubeforge: '\u2705 Yes', competitor: '\u274C No' },
      { name: 'Multi-language interface', tubeforge: '\u2705 Yes', competitor: '\u274C English only' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $22/mo' },
    advantages: [
      'Focus on YouTube creators, not corporate videos',
      'Free plan to get started',
      'Built-in SEO and analytics',
      'Significantly cheaper for individual creators',
    ],
  },
  'tubeforge-vs-fliki': {
    name: 'Fliki',
    description: 'Comparison of TubeForge and Fliki — AI platforms for video creation.',
    features: [
      { name: 'AI scene generation', tubeforge: '\u2705 Yes', competitor: '\u2705 Yes' },
      { name: 'Text-to-speech (TTS)', tubeforge: '\u26A0\uFE0F In development', competitor: '\u2705 Yes' },
      { name: 'YouTube SEO', tubeforge: '\u2705 Built-in', competitor: '\u274C No' },
      { name: 'Video downloads', tubeforge: '\u2705 Yes', competitor: '\u274C No' },
      { name: 'Multi-language interface', tubeforge: '\u2705 Full', competitor: '\u274C English only' },
      { name: 'Free tools', tubeforge: '\u2705 6+ tools', competitor: '\u274C No' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $28/mo' },
    advantages: [
      'Full suite of YouTube tools',
      'Free utilities for creators',
      'Full multi-language support',
      'More affordable pricing',
    ],
  },
  'tubeforge-vs-tubebuddy': {
    name: 'TubeBuddy',
    description: 'Comparison of TubeForge and TubeBuddy — tools that help YouTube creators grow their channels faster.',
    features: [
      { name: 'AI video creation', tubeforge: '\u2705 Full suite', competitor: '\u274C No' },
      { name: 'Keyword research', tubeforge: '\u2705 AI-powered', competitor: '\u2705 Keyword Explorer' },
      { name: 'AI thumbnails', tubeforge: '\u2705 DALL-E powered', competitor: '\u26A0\uFE0F A/B testing only' },
      { name: 'SEO optimization', tubeforge: '\u2705 Built-in AI SEO', competitor: '\u2705 Tag suggestions' },
      { name: 'Bulk video tools', tubeforge: '\u274C No', competitor: '\u2705 Cards, screens, etc.' },
      { name: 'Browser extension', tubeforge: '\u274C No', competitor: '\u2705 Chrome extension' },
      { name: 'Free plan', tubeforge: '\u2705 Yes', competitor: '\u2705 Limited free tier' },
      { name: 'Multi-language interface', tubeforge: '\u2705 4 languages', competitor: '\u274C English only' },
      { name: 'Video editing', tubeforge: '\u2705 AI editor', competitor: '\u274C No' },
      { name: 'Free tools suite', tubeforge: '\u2705 6+ tools', competitor: '\u274C No' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $4.99/mo' },
    advantages: [
      'Full AI video creation from text descriptions',
      'AI-powered thumbnail generation with DALL-E',
      'All-in-one platform — no extension required',
      'Multi-language interface and AI support',
    ],
  },
  'tubeforge-vs-vidiq': {
    name: 'vidIQ',
    description: 'Comparison of TubeForge and vidIQ — platforms that help YouTube creators optimize and grow their channels.',
    features: [
      { name: 'AI video creation', tubeforge: '\u2705 Full suite', competitor: '\u274C No' },
      { name: 'Keyword research', tubeforge: '\u2705 AI-powered', competitor: '\u2705 Deep database' },
      { name: 'Competitor tracking', tubeforge: '\u274C No', competitor: '\u2705 Yes' },
      { name: 'Daily video ideas', tubeforge: '\u274C No', competitor: '\u2705 AI-generated' },
      { name: 'SEO optimization', tubeforge: '\u2705 Built-in AI SEO', competitor: '\u2705 Score & suggestions' },
      { name: 'AI thumbnails', tubeforge: '\u2705 DALL-E powered', competitor: '\u274C No' },
      { name: 'Video editing', tubeforge: '\u2705 AI editor', competitor: '\u274C No' },
      { name: 'Free plan', tubeforge: '\u2705 Yes', competitor: '\u2705 Limited free tier' },
      { name: 'Multi-language interface', tubeforge: '\u2705 4 languages', competitor: '\u274C English only' },
      { name: 'Free tools suite', tubeforge: '\u2705 6+ tools', competitor: '\u274C No' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $7.50/mo' },
    advantages: [
      'Complete video creation suite, not just analytics',
      'AI thumbnail generation saves hours of design work',
      'Free tools for titles, descriptions, and tags',
      'Multi-language support for global creators',
    ],
  },
  'tubeforge-vs-veed': {
    name: 'VEED',
    description: 'Comparison of TubeForge and VEED — online video editing and creation platforms for content creators.',
    features: [
      { name: 'AI video creation', tubeforge: '\u2705 Text-to-video', competitor: '\u26A0\uFE0F Templates' },
      { name: 'YouTube SEO tools', tubeforge: '\u2705 Built-in', competitor: '\u274C No' },
      { name: 'AI thumbnails', tubeforge: '\u2705 DALL-E powered', competitor: '\u274C No' },
      { name: 'Timeline editor', tubeforge: '\u26A0\uFE0F AI-assisted', competitor: '\u2705 Full timeline' },
      { name: 'Screen recording', tubeforge: '\u274C No', competitor: '\u2705 Built-in' },
      { name: 'Auto subtitles', tubeforge: '\u2705 AI transcription', competitor: '\u2705 AI transcription' },
      { name: 'Social media templates', tubeforge: '\u274C No', competitor: '\u2705 Multi-platform' },
      { name: 'Free plan', tubeforge: '\u2705 Yes', competitor: '\u2705 Watermarked' },
      { name: 'Multi-language interface', tubeforge: '\u2705 4 languages', competitor: '\u274C English only' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $18/mo' },
    advantages: [
      'YouTube-specific tools — SEO, analytics, publishing',
      'AI thumbnail generation not available in VEED',
      'Generous free plan without watermarks',
      'Purpose-built for YouTube creators, not generic video editing',
    ],
  },
  'tubeforge-vs-opus-clip': {
    name: 'Opus Clip',
    description: 'Comparison of TubeForge and Opus Clip — AI-powered platforms for video content creation and repurposing.',
    features: [
      { name: 'AI video creation', tubeforge: '\u2705 Full suite', competitor: '\u274C Clipping only' },
      { name: 'AI clip extraction', tubeforge: '\u274C No', competitor: '\u2705 Best-in-class' },
      { name: 'Virality prediction', tubeforge: '\u274C No', competitor: '\u2705 AI scoring' },
      { name: 'YouTube SEO tools', tubeforge: '\u2705 Built-in', competitor: '\u274C No' },
      { name: 'AI thumbnails', tubeforge: '\u2705 DALL-E powered', competitor: '\u274C No' },
      { name: 'Video editing', tubeforge: '\u2705 AI editor', competitor: '\u26A0\uFE0F Trim only' },
      { name: 'Analytics', tubeforge: '\u2705 YouTube analytics', competitor: '\u274C No' },
      { name: 'Free plan', tubeforge: '\u2705 Yes', competitor: '\u2705 Limited' },
      { name: 'Multi-language interface', tubeforge: '\u2705 4 languages', competitor: '\u274C English only' },
      { name: 'Free tools suite', tubeforge: '\u2705 6+ tools', competitor: '\u274C No' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $15/mo' },
    advantages: [
      'Full video creation suite, not limited to clipping',
      'YouTube SEO and analytics for channel growth',
      'AI thumbnail generation for better click-through rates',
      'Free plan with no credit card required',
    ],
  },
  'tubeforge-vs-descript': {
    name: 'Descript',
    description: 'Comparison of TubeForge and Descript — platforms for video creation and editing with AI assistance.',
    features: [
      { name: 'AI video creation', tubeforge: '\u2705 Text-to-video', competitor: '\u274C No' },
      { name: 'Text-based editing', tubeforge: '\u274C No', competitor: '\u2705 Edit like a doc' },
      { name: 'Filler word removal', tubeforge: '\u274C No', competitor: '\u2705 Automatic' },
      { name: 'YouTube SEO tools', tubeforge: '\u2705 Built-in', competitor: '\u274C No' },
      { name: 'AI thumbnails', tubeforge: '\u2705 DALL-E powered', competitor: '\u274C No' },
      { name: 'Transcription', tubeforge: '\u2705 AI transcription', competitor: '\u2705 Industry-leading' },
      { name: 'Screen recording', tubeforge: '\u274C No', competitor: '\u2705 Built-in' },
      { name: 'Podcast tools', tubeforge: '\u274C No', competitor: '\u2705 Full suite' },
      { name: 'Free plan', tubeforge: '\u2705 Yes', competitor: '\u2705 Limited' },
      { name: 'Multi-language interface', tubeforge: '\u2705 4 languages', competitor: '\u274C English only' },
    ],
    pricing: { tubeforge: 'from $0/mo (Free)', competitor: 'from $24/mo' },
    advantages: [
      'YouTube-focused with built-in SEO and analytics',
      'AI thumbnail generation for higher click-through rates',
      'Free tools suite for titles, descriptions, and tags',
      'Generous free plan — Descript starts at $24/mo for full features',
    ],
  },
};

const VALID_SLUGS = Object.keys(COMPARISONS);

/* ── generateStaticParams ─────────────────────────────── */

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

/* ── generateMetadata ─────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = COMPARISONS[slug];
  if (!data) return { title: 'Not Found' };

  const title = `TubeForge vs ${data.name} — Comparison 2026`;
  const description = data.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
      url: `https://tubeforge.co/compare/${slug}`,
      images: [{ url: '/api/og', width: 1200, height: 630, alt: title }],
    },
    alternates: {
      canonical: `https://tubeforge.co/compare/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/api/og'],
    },
  };
}

/* ── Styles ───────────────────────────────────────────── */

const accentColor = '#6c5ce7';

const tableCell: React.CSSProperties = {
  padding: '14px 18px',
  fontSize: 14,
  borderBottom: '1px solid #e4e4e7',
  verticalAlign: 'middle',
};

/* ── Page component ───────────────────────────────────── */

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = COMPARISONS[slug];
  if (!data) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `TubeForge vs ${data.name} — Comparison`,
    description: data.description,
    url: `https://tubeforge.co/compare/${slug}`,
    mainEntity: {
      '@type': 'Table',
      about: `Feature comparison of TubeForge and ${data.name}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tubeforge.co' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://tubeforge.co/compare' },
      { '@type': 'ListItem', position: 3, name: `TubeForge vs ${data.name}` },
    ],
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#fff',
        color: '#18181b',
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Back link */}
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
          Home
        </Link>

        {/* Hero */}
        <div style={{
          background: '#fafafa',
          border: '1px solid #e4e4e7',
          borderRadius: 20,
          padding: '48px 40px',
          marginBottom: 32,
        }}>
          <h1 style={{
            marginBottom: 16,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-.02em',
            margin: '0 0 16px',
            lineHeight: 1.3,
          }}>
            <span style={{
              color: accentColor,
            }}>
              TubeForge
            </span>
            {' '}
            <span style={{ fontSize: 20, color: '#a1a1aa', fontWeight: 600 }}>vs</span>
            {' '}
            <span style={{
              color: '#18181b',
            }}>
              {data.name}
            </span>
          </h1>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
            {data.description}
          </p>
        </div>

        {/* Feature comparison table */}
        <div style={{
          background: '#fff',
          border: '1px solid #e4e4e7',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 32,
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e4e4e7',
            background: '#fafafa',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>
              Feature Comparison
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ ...tableCell, fontWeight: 600, textAlign: 'left', width: '40%' }}>
                  Feature
                </th>
                <th style={{ ...tableCell, fontWeight: 700, textAlign: 'center', color: accentColor }}>
                  TubeForge
                </th>
                <th style={{ ...tableCell, fontWeight: 600, textAlign: 'center', color: '#71717a' }}>
                  {data.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.features.map((f, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...tableCell, fontWeight: 500 }}>{f.name}</td>
                  <td style={{ ...tableCell, textAlign: 'center' }}>{f.tubeforge}</td>
                  <td style={{ ...tableCell, textAlign: 'center' }}>{f.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing comparison */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 32,
        }}>
          <div style={{
            background: `${accentColor}08`,
            border: `2px solid ${accentColor}30`,
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#71717a', marginBottom: 8 }}>TubeForge</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: accentColor, letterSpacing: '-.02em' }}>
              {data.pricing.tubeforge}
            </div>
          </div>
          <div style={{
            background: '#fafafa',
            border: '1px solid #e4e4e7',
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#71717a', marginBottom: 8 }}>{data.name}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#18181b', letterSpacing: '-.02em' }}>
              {data.pricing.competitor}
            </div>
          </div>
        </div>

        {/* Why TubeForge is better */}
        <div style={{
          background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}04)`,
          border: `1px solid ${accentColor}20`,
          borderRadius: 16,
          padding: '32px',
          marginBottom: 32,
        }}>
          <h2 style={{
            fontSize: 22,
            fontWeight: 800,
            margin: '0 0 20px',
            letterSpacing: '-.02em',
            color: '#18181b',
          }}>
            Why TubeForge Is Better
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.advantages.map((adv, i) => (
              <li key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 15,
                lineHeight: 1.6,
                color: '#3f3f46',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: accentColor,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {'\u2713'}
                </span>
                {adv}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 16,
            letterSpacing: '-.02em',
          }}>
            Try TubeForge for Free
          </h2>
          <p style={{ color: '#71717a', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
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
            Get Started Free
          </Link>
        </div>

        {/* Other comparisons */}
        <div style={{
          borderTop: '1px solid #e4e4e7',
          paddingTop: 32,
          marginTop: 16,
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 16,
            color: '#71717a',
          }}>
            Other Comparisons
          </h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {VALID_SLUGS.filter((s) => s !== slug).map((s) => (
              <Link
                key={s}
                href={`/compare/${s}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e4e4e7',
                  background: '#fafafa',
                  color: '#3f3f46',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'border-color .15s',
                }}
              >
                TubeForge vs {COMPARISONS[s].name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
