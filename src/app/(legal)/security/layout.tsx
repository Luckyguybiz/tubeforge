import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'TubeForge security practices — encryption, data protection, infrastructure security, and compliance.',
  openGraph: {
    title: 'Security — TubeForge',
    description: 'Learn about TubeForge security: encryption, data protection, and infrastructure safeguards.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Security' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/security',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Security — TubeForge',
    description: 'Learn about TubeForge security practices and data protection.',
    images: ['/api/og'],
  },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
