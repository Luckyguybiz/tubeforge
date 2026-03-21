import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Agreement (DPA)',
  description: 'TubeForge Data Processing Agreement — how we process and protect your data in compliance with GDPR.',
  openGraph: {
    title: 'Data Processing Agreement — TubeForge',
    description: 'TubeForge DPA: data processing terms, GDPR compliance, and data protection measures.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge DPA' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/dpa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Data Processing Agreement — TubeForge',
    description: 'TubeForge DPA: data processing terms and GDPR compliance.',
    images: ['/api/og'],
  },
};

export default function DpaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
