import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status',
  description:
    'Current status of all TubeForge services: application, database, AI generation, payments, and VPN.',
  openGraph: {
    title: 'System Status — TubeForge',
    description:
      'Real-time TubeForge service health monitoring. 99.9% uptime.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge System Status' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/status',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'System Status — TubeForge',
    description: 'Real-time TubeForge service health monitoring.',
    images: ['/api/og'],
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
