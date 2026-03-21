import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'Latest TubeForge updates: new features, bug fixes, and platform improvements.',
  openGraph: {
    title: 'Changelog — TubeForge',
    description:
      'Stay up to date with TubeForge releases: AI video generation, tools, analytics, and more.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Changelog' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/changelog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog — TubeForge',
    description: 'Latest TubeForge updates: new features, bug fixes, and improvements.',
    images: ['/api/og'],
  },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
