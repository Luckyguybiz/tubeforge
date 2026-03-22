import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free AI Tools for YouTube Creators',
  description: 'Browse all TubeForge AI-powered tools for YouTube creators: thumbnail generator, metadata optimizer, video editor, and more.',
  openGraph: {
    title: 'Free AI Tools for YouTube Creators — TubeForge',
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
    title: 'Free AI Tools for YouTube Creators — TubeForge',
    description: 'Free and premium AI-powered tools for YouTube creators.',
    images: ['/api/og'],
  },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Free YouTube Creator Tools',
  description: 'AI-powered tools for YouTube creators — thumbnail generator, video editor, metadata optimizer, voiceover generator, and more.',
  url: 'https://tubeforge.co/tools',
  isPartOf: {
    '@type': 'WebSite',
    name: 'TubeForge',
    url: 'https://tubeforge.co',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {children}
    </>
  );
}
