import Link from 'next/link';
import type { Metadata } from 'next';
import { BLOG_POSTS } from '@/lib/blog-posts';

export const metadata: Metadata = {
  title: 'Blog — YouTube Tips & Video Marketing',
  description:
    'Guides and tips for YouTube creators: channel growth strategies, Shorts optimization, AI tools, monetization, and platform comparisons.',
  openGraph: {
    title: 'TubeForge Blog — YouTube Tips & Video Marketing',
    description:
      'Articles and guides for YouTube creators: channel growth, viral Shorts, AI tools, monetization, and reviews.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Blog' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TubeForge Blog — YouTube Tips & Video Marketing',
    description: 'Guides, tips, and tools for YouTube creators.',
    images: ['/api/og'],
  },
  keywords: [
    'YouTube blog',
    'YouTube tips',
    'YouTube Shorts tips',
    'AI video tools',
    'YouTube monetization',
    'TubeForge blog',
    'YouTube channel growth',
    'video marketing',
  ],
};

/* ── Category Colors ───────────────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  'Гайды': '#3a7bfd',
  'Советы': '#2dd4a0',
  'Продукт': '#8b5cf6',
  'Монетизация': '#f59e0b',
  'Сравнения': '#ec4899',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#3a7bfd';
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Category Pills (client interactive via CSS) ───────────────────── */

const allCategories = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));

/* ── Page ──────────────────────────────────────────────────────────── */

export default function BlogIndexPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#0a0a12',
        color: '#e8e8f0',
        fontFamily: "var(--font-sans), 'Instrument Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Back to home */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#8b8b9e',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 32,
            transition: 'color .15s',
          }}
        >
          &larr; На главную
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: '-.04em',
              color: '#e8e8f0',
              margin: '0 0 8px',
            }}
          >
            Блог TubeForge
          </h1>
          <p
            style={{
              fontSize: 15,
              color: '#8b8b9e',
              margin: 0,
              fontWeight: 450,
            }}
          >
            Гайды, советы и инструменты для YouTube-креаторов
          </p>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 32,
          }}
        >
          {allCategories.map((cat) => {
            const color = getCategoryColor(cat);
            return (
              <span
                key={cat}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: color,
                  background: `${color}15`,
                  padding: '5px 14px',
                  borderRadius: 8,
                  letterSpacing: '.02em',
                  border: `1px solid ${color}30`,
                }}
              >
                {cat}
              </span>
            );
          })}
        </div>

        {/* Articles Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
            gap: 16,
          }}
        >
          {BLOG_POSTS.map((post) => {
            const catColor = getCategoryColor(post.category);
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <article
                  style={{
                    background: 'rgba(255,255,255,.02)',
                    border: '1px solid rgba(255,255,255,.06)',
                    borderRadius: 16,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'all .2s ease',
                    height: '100%',
                  }}
                >
                  {/* Category badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                        color: catColor,
                        background: `${catColor}15`,
                        padding: '3px 10px',
                        borderRadius: 6,
                      }}
                    >
                      {post.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontSize: 19,
                      fontWeight: 750,
                      color: '#e8e8f0',
                      letterSpacing: '-.02em',
                      lineHeight: 1.35,
                      margin: 0,
                    }}
                  >
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p
                    style={{
                      fontSize: 13.5,
                      color: '#8b8b9e',
                      lineHeight: 1.6,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {post.excerpt}
                  </p>

                  {/* Footer: date + reading time + arrow */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 12,
                        color: '#5e5e72',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <rect x="1.5" y="2.5" width="13" height="11.5" rx="2" stroke="#5e5e72" strokeWidth="1.2" />
                          <path d="M1.5 6.5H14.5" stroke="#5e5e72" strokeWidth="1.2" />
                          <path d="M5 1V4" stroke="#5e5e72" strokeWidth="1.2" strokeLinecap="round" />
                          <path d="M11 1V4" stroke="#5e5e72" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        {formatDate(post.publishedAt)}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6.5" stroke="#5e5e72" strokeWidth="1.2" />
                          <path d="M8 4V8L10.5 10.5" stroke="#5e5e72" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {post.readingTime} мин
                      </span>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#8b8b9e',
                      }}
                    >
                      Читать
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#8b8b9e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 48,
            fontSize: 13,
            color: '#5e5e72',
          }}
        >
          &copy; {new Date().getFullYear()} TubeForge. Все права защищены.
        </div>
      </div>

      {/* Hover styles for article cards */}
      <style>{`
        main a:hover article {
          background: rgba(255,255,255,.04) !important;
          border-color: rgba(255,255,255,.12) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,.3);
        }
        main a:hover article span:last-child {
          color: #e8243c !important;
        }
      `}</style>
    </main>
  );
}
