import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tubeforge.co';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tools', '/vpn', '/blog', '/about', '/referral', '/billing', '/login', '/register', '/terms', '/privacy'],
        disallow: ['/api/', '/admin', '/settings', '/dashboard', '/editor', '/team', '/thumbnails', '/metadata', '/preview', '/shorts-analytics', '/tiktok-analytics', '/analytics'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
