import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tubeforge.co';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/editor', '/settings', '/admin', '/team', '/thumbnails', '/metadata', '/preview', '/billing', '/login', '/register'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
