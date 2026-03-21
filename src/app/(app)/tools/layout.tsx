import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tools',
  description: 'Browse all TubeForge AI-powered tools for YouTube creators: thumbnail generator, metadata optimizer, video editor, and more.',
  openGraph: {
    title: 'AI Tools — TubeForge',
    description: 'Free and premium AI-powered tools for YouTube creators. Download videos, generate thumbnails, optimize metadata, and more.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge AI Tools' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tools — TubeForge',
    description: 'Free and premium AI-powered tools for YouTube creators.',
    images: ['/api/og'],
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
