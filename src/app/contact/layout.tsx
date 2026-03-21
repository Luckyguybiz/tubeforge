import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the TubeForge team. Technical support, billing questions, and partnership inquiries.',
  openGraph: {
    title: 'Contact Us — TubeForge',
    description:
      'Get in touch with the TubeForge team. Priority support for Pro and Studio subscribers.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Contact TubeForge' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/contact',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us — TubeForge',
    description: 'Get in touch with the TubeForge team for support and inquiries.',
    images: ['/api/og'],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
