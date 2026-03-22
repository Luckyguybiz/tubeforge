import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BLOG_POSTS, getBlogPostBySlug } from '@/lib/blog-posts';

/* -- Static Params --------------------------------------------------------- */

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

/* -- Metadata -------------------------------------------------------------- */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — TubeForge Blog`,
    description: post.excerpt,
    authors: [{ name: 'TubeForge Team' }],
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

/* -- Helpers ---------------------------------------------------------------- */

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* -- Page ------------------------------------------------------------------- */

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

  // JSON-LD BreadcrumbList schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tubeforge.co' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://tubeforge.co/blog' },
      { '@type': 'ListItem', position: 3, name: post.title },
    ],
  };

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ?? 'https://tubeforge.co/api/og',
    author: {
      '@type': 'Organization',
      name: post.author,
      url: 'https://tubeforge.co',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TubeForge',
      url: 'https://tubeforge.co',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tubeforge.co/favicon.svg',
      },
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

  // HowTo JSON-LD for guide articles
  const isGuide = post.category === 'Guides' || post.slug.includes('how-to');
  const howToJsonLd = isGuide
    ? (() => {
        // Extract steps from H2 headings that start with "Step"
        const stepRegex = /<h2>(Step \d+[^<]*)<\/h2>\s*<p>([^<]+)/g;
        const steps: { name: string; text: string }[] = [];
        let match;
        while ((match = stepRegex.exec(post.content)) !== null) {
          steps.push({ name: match[1], text: match[2] });
        }
        if (steps.length === 0) return null;
        return {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: post.title,
          description: post.excerpt,
          totalTime: `PT${post.readingTime}M`,
          step: steps.map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.name,
            text: s.text,
          })),
        };
      })()
    : null;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {howToJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      )}

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '48px 24px 96px' }}>
        {/* Back to blog */}
        <Link
          href="/blog"
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
          &larr; All articles
        </Link>

        {/* Article */}
        <article style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Category badge */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: catColor,
              display: 'inline-block',
              marginBottom: 16,
            }}
          >
            {post.category}
          </span>

          {/* Title */}
          <h1
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: '0 0 24px',
            }}
          >
            {post.title}
          </h1>

          {/* Meta: author, date, reading time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 48,
              flexWrap: 'wrap',
              paddingBottom: 32,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span>{post.author}</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span>{post.readingTime} min read</span>
          </div>

          {/* Content */}
          <div
            className="blog-article-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.7)',
            }}
          />

          {/* Tags */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 48,
              paddingTop: 32,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 64,
            }}
          >
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                  background: '#111111',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontWeight: 500,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Related Posts */}
          {related.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  marginBottom: 24,
                }}
              >
                Related Articles
              </h2>
              <div
                style={{
                  display: 'flex',
                  gap: 20,
                  overflowX: 'auto',
                  paddingBottom: 8,
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
                        flex: '0 0 280px',
                      }}
                    >
                      <div
                        className="related-card"
                        style={{
                          background: '#111111',
                          borderRadius: 16,
                          padding: '24px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          transition: 'all .25s ease',
                          height: '100%',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: relColor,
                          }}
                        >
                          {relPost.category}
                        </span>
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#ffffff',
                            lineHeight: 1.35,
                            margin: 0,
                          }}
                        >
                          {relPost.title}
                        </h3>
                        <span
                          style={{
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {relPost.readingTime} min read
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
            marginTop: 64,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          &copy; {new Date().getFullYear()} TubeForge. All rights reserved.
        </div>
      </div>

      {/* Article content styles */}
      <style>{`
        .blog-article-content h2 {
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 40px 0 16px;
          color: #ffffff;
        }
        .blog-article-content h3 {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 32px 0 12px;
          color: #ffffff;
        }
        .blog-article-content p {
          margin: 0 0 20px;
        }
        .blog-article-content ul,
        .blog-article-content ol {
          margin: 0 0 20px;
          padding-left: 28px;
        }
        .blog-article-content li {
          margin-bottom: 8px;
        }
        .blog-article-content a {
          color: #6366f1;
          text-decoration: none;
          font-weight: 500;
          transition: opacity .15s;
        }
        .blog-article-content a:hover {
          text-decoration: underline;
        }
        .blog-article-content strong {
          font-weight: 600;
          color: #ffffff;
        }
        .blog-article-content blockquote {
          margin: 24px 0;
          padding: 20px 24px;
          border-left: 3px solid #6366f1;
          background: #1a1a1a;
          border-radius: 0 12px 12px 0;
          font-style: italic;
          color: rgba(255,255,255,0.7);
        }
        .related-card:hover {
          background: rgba(255,255,255,0.08) !important;
          transform: translateY(-1px);
        }
        @media (max-width: 640px) {
          .blog-article-content h2 {
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  );
}
