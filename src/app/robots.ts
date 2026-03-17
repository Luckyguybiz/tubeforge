import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tubeforge.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/editor', '/settings', '/admin', '/team', '/thumbnails', '/metadata', '/preview', '/billing'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
