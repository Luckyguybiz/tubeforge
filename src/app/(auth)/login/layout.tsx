import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Sign in to TubeForge with your Google account to access AI-powered YouTube creation tools.',
  openGraph: {
    title: 'Log In — TubeForge',
    description: 'Sign in to TubeForge and start creating YouTube content with AI.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Log In to TubeForge' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/login',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Log In — TubeForge',
    description: 'Sign in to TubeForge and start creating YouTube content with AI.',
    images: ['/api/og'],
  },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
