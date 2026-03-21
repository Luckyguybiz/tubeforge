import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Gallery — TubeForge',
  description:
    'Browse community-created YouTube videos, thumbnails, and projects made with TubeForge AI tools. Filter by category, sort by popularity, and get inspired.',
  keywords: ['AI video', 'YouTube creator', 'video gallery', 'TubeForge', 'AI thumbnails', 'community projects'],
  openGraph: {
    title: 'Community Gallery — TubeForge',
    description:
      'Explore YouTube content created with TubeForge AI tools. Get inspired by community projects, filter by tags, and sort by popularity.',
    type: 'website',
    locale: 'en_US',
    siteName: 'TubeForge',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Community Gallery' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/gallery',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community Gallery — TubeForge',
    description: 'Explore YouTube content created with TubeForge AI tools. Filter by category and get inspired.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
