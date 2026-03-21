import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description:
    'Find answers to common questions about TubeForge: getting started, billing, editor, AI generation, and troubleshooting.',
  openGraph: {
    title: 'Help Center — TubeForge',
    description:
      'Find answers about TubeForge: subscriptions, editor, AI tools, and troubleshooting.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge Help Center' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/help',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Center — TubeForge',
    description: 'Find answers about TubeForge: subscriptions, editor, AI tools, and troubleshooting.',
    images: ['/api/og'],
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
