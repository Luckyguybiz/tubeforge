import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creator Profile — TubeForge',
  description:
    'Browse public projects by this TubeForge creator. Explore their AI-generated videos, thumbnails, and more.',
  openGraph: {
    title: 'Creator Profile — TubeForge',
    description:
      'Browse public projects by this TubeForge creator. Explore their AI-generated videos, thumbnails, and more.',
    type: 'profile',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Creator Profile' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creator Profile — TubeForge',
    description: 'Browse public projects by this TubeForge creator.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
