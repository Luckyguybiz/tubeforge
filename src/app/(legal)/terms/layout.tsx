import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'TubeForge Terms of Service — rules and conditions for using the platform.',
  openGraph: {
    title: 'Terms of Service — TubeForge',
    description: 'Read the TubeForge Terms of Service before using the platform.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Terms of Service' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/terms',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service — TubeForge',
    description: 'Read the TubeForge Terms of Service.',
    images: ['/api/og'],
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
