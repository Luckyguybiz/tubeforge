import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog — YouTube Tips & Video Marketing",
  description:
    "Guides and tips for YouTube creators: channel growth strategies, Shorts optimization, AI tools, monetization, and platform comparisons.",
  openGraph: {
    title: "TubeForge Blog — YouTube Tips & Video Marketing",
    description:
      "Articles and guides for YouTube creators: channel growth, viral Shorts, AI tools, monetization, and reviews.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "TubeForge Blog" }],
  },
  alternates: { canonical: "https://tubeforge.co/blog" },
  twitter: {
    card: "summary_large_image",
    title: "TubeForge Blog — YouTube Tips & Video Marketing",
    description: "Guides, tips, and tools for YouTube creators.",
    images: ["/api/og"],
  },
  keywords: [
    "YouTube blog",
    "YouTube tips",
    "YouTube Shorts tips",
    "AI video tools",
    "YouTube monetization",
    "TubeForge blog",
    "YouTube channel growth",
    "video marketing",
  ],
};

const CATEGORY_COLORS: Record<string, string> = {
  Guides: "#007aff",
  Tips: "#34c759",
  Product: "#af52de",
  Monetization: "#ff9500",
  Comparisons: "#ff2d55",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#007aff";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

const allCategories = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));

const COLLECTION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "TubeForge Blog",
  url: "https://tubeforge.co/blog",
  description: "Tips, guides and news about YouTube content creation",
};

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tubeforge.co" },
    { "@type": "ListItem", position: 2, name: "Blog" },
  ],
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand-500 hover:text-brand-400 transition-colors no-underline mb-10"
        >
          ← Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight m-0 mb-3 leading-[1.15]">
            Blog
          </h1>
          <p className="text-[17px] text-muted-foreground m-0 leading-relaxed">
            Guides, tips, and tools for YouTube creators
          </p>
        </div>

        <div className="flex flex-nowrap sm:flex-wrap gap-2 mb-12 justify-start sm:justify-center overflow-x-auto sm:overflow-visible pb-1 scrollbar-none">
          {allCategories.map((cat) => {
            const color = getCategoryColor(cat);
            return (
              <span
                key={cat}
                className="text-[13px] font-medium px-5 py-2 rounded-full bg-card transition-colors whitespace-nowrap"
                style={{ color }}
              >
                {cat}
              </span>
            );
          })}
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {BLOG_POSTS.map((post) => {
            const catColor = getCategoryColor(post.category);
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="no-underline text-inherit"
              >
                <article className="group bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-3.5 h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: catColor }}
                    >
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-[21px] font-semibold text-foreground tracking-tight leading-snug m-0">
                    {post.title}
                  </h2>
                  <p className="text-[15px] text-muted-foreground leading-relaxed m-0 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>{post.readingTime} min read</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-500 transition-all group-hover:gap-2">
                      Read
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8H13M13 8L9 4M13 8L9 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        <p className="text-center mt-16 text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} TubeForge. All rights reserved.
        </p>
      </div>
    </main>
  );
}
