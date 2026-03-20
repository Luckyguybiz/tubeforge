import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tubeforge.co';

  return [
    { url: baseUrl, lastModified: new Date('2026-03-20'), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/tools`, lastModified: new Date('2026-03-20'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/vpn`, lastModified: new Date('2026-03-20'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/billing`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date('2026-03-20'), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/referral`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date('2026-01-01'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: new Date('2026-01-01'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: new Date('2026-03-01'), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date('2026-03-01'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date('2026-03-01'), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
