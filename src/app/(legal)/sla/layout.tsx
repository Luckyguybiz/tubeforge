import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Level Agreement (SLA)',
  description: 'TubeForge Service Level Agreement — uptime guarantees, support response times, and service commitments by plan.',
  openGraph: {
    title: 'Service Level Agreement — TubeForge',
    description: 'TubeForge SLA: uptime guarantees, priority support, and service commitments for each plan.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge SLA' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/sla',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Service Level Agreement — TubeForge',
    description: 'TubeForge SLA: uptime guarantees and service commitments.',
    images: ['/api/og'],
  },
};

export default function SlaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
