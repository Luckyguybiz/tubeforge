import type { MetadataRoute } from 'next';

import { BLOG_POSTS } from '@/lib/blog-posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tubeforge.co';

  const staticPages: {
    path: string;
    lastModified: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }[] = [
    { path: '', lastModified: '2026-03-20', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/blog', lastModified: '2026-03-20', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/pricing', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.9 },
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
    { path: '/compare/tubeforge-vs-invideo', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-capcut', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-pictory', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-synthesia', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-fliki', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-tubebuddy', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-vidiq', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-veed', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-opus-clip', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/compare/tubeforge-vs-descript', lastModified: '2026-03-20', changeFrequency: 'monthly', priority: 0.8 },
    // Tools hub + individual tool pages
    { path: '/tools', lastModified: '2026-03-22', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/tools/image-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/subtitle-editor', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/video-compressor', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/mp3-converter', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/youtube-downloader', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/voiceover-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/background-remover', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/content-planner', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/cut-crop', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/ai-video-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/video-translator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    // Coming-soon tool pages — still SEO-valuable for indexing
    { path: '/tools/speech-enhancer', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/veo3-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/brainstormer', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/vocal-remover', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/ai-creator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/autoclip', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/subtitle-remover', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/reddit-video', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/fake-texts', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/tiktok-downloader', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/audio-balancer', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/voice-changer', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tools/face-swap', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/ai-thumbnails', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    // Public SEO tool pages
    { path: '/tools/youtube-title-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/youtube-description-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/youtube-tag-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/youtube-thumbnail-size', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/tools/youtube-money-calculator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    // Free SEO tools
    { path: '/free-tools', lastModified: '2026-03-22', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/free-tools/title-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/free-tools/description-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/free-tools/tag-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/free-tools/thumbnail-checker', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/free-tools/channel-name-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/free-tools/script-generator', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/free-tools/character-counter', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/free-tools/video-ideas', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/free-tools/shorts-dimensions', lastModified: '2026-03-22', changeFrequency: 'monthly', priority: 0.8 },
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

  return [...staticEntries, ...blogEntries];
}
