import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Project — TubeForge',
  description:
    'View a public project created with TubeForge AI tools. Watch scenes, like, and share with your friends.',
  openGraph: {
    title: 'Shared Project — TubeForge',
    description:
      'View a public project created with TubeForge AI tools. Watch scenes, like, and share with your friends.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Shared Project' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shared Project — TubeForge',
    description: 'View a public project created with TubeForge AI tools.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
