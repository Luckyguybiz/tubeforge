import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BLOG_POSTS, getBlogPostBySlug } from '@/lib/blog-posts';

/* ── Static Params ─────────────────────────────────────────────────── */

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

/* ── Metadata ──────────────────────────────────────────────────────── */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — TubeForge Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      locale: 'en_US',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: '/api/og', width: 1200, height: 630, alt: post.title }],
    },
    alternates: {
      canonical: `https://tubeforge.co/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: ['/api/og'],
    },
    keywords: post.tags,
  };
}

/* ── Helpers ───────────────────────────────────────────────────────── */

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const catColor = getCategoryColor(post.category);

  // Related posts: same category first, then others, excluding current post
  const related = BLOG_POSTS
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => {
      if (a.category === post.category && b.category !== post.category) return -1;
      if (b.category === post.category && a.category !== post.category) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 3);

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: 'https://tubeforge.co',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TubeForge',
      url: 'https://tubeforge.co',
    },
    datePublished: post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tubeforge.co/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount: post.content.replace(/<[^>]+>/g, '').split(/\s+/).length,
    timeRequired: `PT${post.readingTime}M`,
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#0a0a12',
        color: '#e8e8f0',
        fontFamily: "var(--font-sans), 'Instrument Sans', sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Back to blog */}
        <Link
          href="/blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#8b8b9e',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 24,
            transition: 'color .15s',
          }}
        >
          &larr; Все статьи
        </Link>

        {/* Article */}
        <article style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* Article header */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,30,.95), rgba(17,17,25,.9))',
              border: '1px solid rgba(255,255,255,.06)',
              borderRadius: 20,
              padding: '40px 36px',
            }}
          >
            {/* Category badge */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: catColor,
                background: `${catColor}15`,
                padding: '4px 12px',
                borderRadius: 6,
                display: 'inline-block',
                marginBottom: 16,
              }}
            >
              {post.category}
            </span>

            {/* Title */}
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#e8e8f0',
                letterSpacing: '-.03em',
                lineHeight: 1.3,
                margin: '0 0 16px',
              }}
            >
              {post.title}
            </h1>

            {/* Meta: author, date, reading time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: 13,
                color: '#5e5e72',
                marginBottom: 32,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="#5e5e72" strokeWidth="1.2" />
                  <path d="M2 14C2 11 4.5 9 8 9C11.5 9 14 11 14 14" stroke="#5e5e72" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {post.author}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="2.5" width="13" height="11.5" rx="2" stroke="#5e5e72" strokeWidth="1.2" />
                  <path d="M1.5 6.5H14.5" stroke="#5e5e72" strokeWidth="1.2" />
                  <path d="M5 1V4" stroke="#5e5e72" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M11 1V4" stroke="#5e5e72" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {formatDate(post.publishedAt)}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#5e5e72" strokeWidth="1.2" />
                  <path d="M8 4V8L10.5 10.5" stroke="#5e5e72" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {post.readingTime} мин чтения
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: catColor,
                  background: `${catColor}12`,
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {post.category}
              </span>
            </div>

            {/* Content */}
            <div
              className="blog-article-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: '#e8e8f0',
              }}
            />
          </div>

          {/* Tags */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 24,
              marginBottom: 48,
            }}
          >
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 12,
                  color: '#8b8b9e',
                  background: 'rgba(255,255,255,.04)',
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,.06)',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Related Posts */}
          {related.length > 0 && (
            <section style={{ marginTop: 16 }}>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 750,
                  color: '#e8e8f0',
                  letterSpacing: '-.02em',
                  marginBottom: 20,
                }}
              >
                Читайте также
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                  gap: 14,
                }}
              >
                {related.map((relPost) => {
                  const relColor = getCategoryColor(relPost.category);
                  return (
                    <Link
                      key={relPost.slug}
                      href={`/blog/${relPost.slug}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div
                        style={{
                          background: 'rgba(255,255,255,.02)',
                          border: '1px solid rgba(255,255,255,.06)',
                          borderRadius: 14,
                          padding: '20px 18px',
                          transition: 'all .2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            color: relColor,
                          }}
                        >
                          {relPost.category}
                        </span>
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#e8e8f0',
                            lineHeight: 1.35,
                            margin: 0,
                            letterSpacing: '-.01em',
                          }}
                        >
                          {relPost.title}
                        </h3>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#5e5e72',
                          }}
                        >
                          {relPost.readingTime} мин чтения
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </article>

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

      {/* Article content styles */}
      <style>{`
        .blog-article-content h2 {
          font-size: 20px;
          font-weight: 750;
          letter-spacing: -.02em;
          margin: 28px 0 12px;
          color: #e8e8f0;
        }
        .blog-article-content h3 {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -.015em;
          margin: 24px 0 10px;
          color: #e8e8f0;
        }
        .blog-article-content p {
          margin: 0 0 16px;
        }
        .blog-article-content ul,
        .blog-article-content ol {
          margin: 0 0 16px;
          padding-left: 24px;
        }
        .blog-article-content li {
          margin-bottom: 6px;
        }
        .blog-article-content a {
          text-decoration: none;
          font-weight: 600;
          transition: opacity .15s;
        }
        .blog-article-content a:hover {
          opacity: .8;
          text-decoration: underline;
        }
        .blog-article-content strong {
          font-weight: 700;
          color: #e8e8f0;
        }
        .blog-article-content blockquote {
          margin: 16px 0;
          padding: 16px 20px;
          border-left: 3px solid rgba(139, 92, 246, .5);
          background: rgba(139, 92, 246, .06);
          border-radius: 0 10px 10px 0;
          font-style: italic;
          color: #b0b0c4;
        }
        section a:hover > div {
          background: rgba(255,255,255,.04) !important;
          border-color: rgba(255,255,255,.12) !important;
          transform: translateY(-1px);
        }
        @media (max-width: 640px) {
          .blog-article-content h2 {
            font-size: 18px;
          }
        }
      `}</style>
    </main>
  );
}
