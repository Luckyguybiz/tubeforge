import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'TubeForge Privacy Policy — how we collect, use, and protect your data.',
  openGraph: {
    title: 'Privacy Policy — TubeForge',
    description: 'Learn how TubeForge collects, uses, and protects your personal data.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Privacy Policy' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/privacy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — TubeForge',
    description: 'Learn how TubeForge collects, uses, and protects your personal data.',
    images: ['/api/og'],
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
