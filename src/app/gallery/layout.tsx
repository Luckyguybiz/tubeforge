import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Browse community-created YouTube videos, thumbnails, and projects made with TubeForge AI tools.',
  openGraph: {
    title: 'Gallery — TubeForge',
    description:
      'Explore YouTube content created with TubeForge AI tools. Get inspired by community projects.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Gallery' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/gallery',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gallery — TubeForge',
    description: 'Explore YouTube content created with TubeForge AI tools.',
    images: ['/api/og'],
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
