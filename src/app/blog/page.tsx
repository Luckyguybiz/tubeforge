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

/* -- Category accent colors ------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  Guides: '#007aff',
  Tips: '#34c759',
  Product: '#af52de',
  Monetization: '#ff9500',
  Comparisons: '#ff2d55',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#007aff';
}

/* -- Helpers ---------------------------------------------------------------- */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

const allCategories = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));

/* -- JSON-LD -------------------------------------------------------------- */

const COLLECTION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'TubeForge Blog',
  url: 'https://tubeforge.co/blog',
  description: 'Tips, guides and news about YouTube content creation',
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tubeforge.co' },
    { '@type': 'ListItem', position: 2, name: 'Blog' },
  ],
};

/* -- Page ------------------------------------------------------------------- */

export default function BlogIndexPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '48px 24px 96px' }}>
        {/* Back to home */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#6366f1',
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 500,
            marginBottom: 40,
          }}
        >
          &larr; Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: '0 0 12px',
              lineHeight: 1.15,
            }}
          >
            Blog
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            Guides, tips, and tools for YouTube creators
          </p>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 48,
            justifyContent: 'center',
          }}
        >
          {allCategories.map((cat) => {
            const color = getCategoryColor(cat);
            return (
              <span
                key={cat}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: color,
                  background: 'rgba(255,255,255,0.04)',
                  padding: '8px 20px',
                  borderRadius: 20,
                  letterSpacing: '0.01em',
                  transition: 'background .2s',
                  cursor: 'pointer',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 440px), 1fr))',
            gap: 24,
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
                  className="blog-card"
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    transition: 'all .25s ease',
                    height: '100%',
                  }}
                >
                  {/* Category badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: catColor,
                      }}
                    >
                      {post.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontSize: 21,
                      fontWeight: 600,
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.35,
                      margin: 0,
                    }}
                  >
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p
                    style={{
                      fontSize: 15,
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.6,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {post.excerpt}
                  </p>

                  {/* Footer: date + reading time */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>{post.readingTime} min read</span>
                    </div>
                    <span
                      className="blog-card-arrow"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#6366f1',
                      }}
                    >
                      Read
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
            marginTop: 64,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          &copy; {new Date().getFullYear()} TubeForge. All rights reserved.
        </div>
      </div>

      {/* Hover styles */}
      <style>{`
        .blog-card:hover {
          box-shadow: 0 4px 24px rgba(0,0,0,.3);
          border-color: rgba(255,255,255,0.12) !important;
          transform: translateY(-2px);
        }
        .blog-card:hover .blog-card-arrow {
          gap: 8px !important;
        }
        main a:hover {
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
