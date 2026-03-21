import type { MetadataRoute } from 'next';

import { BLOG_POSTS } from '@/lib/blog-posts';

const COMPARISON_SLUGS = [
  'tubeforge-vs-invideo',
  'tubeforge-vs-capcut',
  'tubeforge-vs-pictory',
  'tubeforge-vs-synthesia',
  'tubeforge-vs-fliki',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tubeforge.co';

  const staticPages: {
    path: string;
    lastModified: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }[] = [
    { path: '', lastModified: '2026-03-21', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/blog', lastModified: '2026-03-21', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/help', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/contact', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/changelog', lastModified: '2026-03-20', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/status', lastModified: '2026-03-20', changeFrequency: 'daily', priority: 0.6 },
    { path: '/gallery', lastModified: '2026-03-20', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/api-docs', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/privacy', lastModified: '2026-03-01', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', lastModified: '2026-03-01', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/security', lastModified: '2026-03-01', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/dpa', lastModified: '2026-03-01', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/sla', lastModified: '2026-03-01', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/login', lastModified: '2026-01-01', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/register', lastModified: '2026-01-01', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/about', lastModified: '2026-03-01', changeFrequency: 'monthly', priority: 0.5 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(page.lastModified),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const comparisonEntries: MetadataRoute.Sitemap = COMPARISON_SLUGS.map((slug) => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified: new Date('2026-03-21'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...blogEntries, ...comparisonEntries];
}
