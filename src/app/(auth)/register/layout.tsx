import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a free TubeForge account and start creating professional YouTube content with AI tools.',
  openGraph: {
    title: 'Sign Up — TubeForge',
    description: 'Create a free TubeForge account. AI video editor, thumbnail generator, metadata optimizer, and more.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Sign Up for TubeForge' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/register',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up — TubeForge',
    description: 'Create a free account and start creating YouTube content with AI.',
    images: ['/api/og'],
  },
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
