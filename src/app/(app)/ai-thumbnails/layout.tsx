import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Thumbnail Generator — Create YouTube Thumbnails in Seconds',
  description:
    'Generate professional YouTube thumbnails with AI. Describe your idea in plain text and get click-worthy designs in seconds. Powered by DALL-E 3.',
  openGraph: {
    title: 'AI Thumbnail Generator — TubeForge',
    description:
      'Create professional YouTube thumbnails with AI. Text-to-thumbnail generation powered by DALL-E 3.',
    type: 'website',
    locale: 'en_US',
    url: 'https://tubeforge.co/ai-thumbnails',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge AI Thumbnail Generator' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/ai-thumbnails',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Thumbnail Generator — TubeForge',
    description: 'Generate professional YouTube thumbnails with AI in seconds.',
    images: ['/api/og'],
  },
  keywords: [
    'AI thumbnail generator',
    'YouTube thumbnail maker',
    'thumbnail creator',
    'AI thumbnails',
    'DALL-E thumbnails',
    'YouTube thumbnail design',
  ],
};

const SOFTWARE_APP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TubeForge AI Thumbnail Generator',
  description:
    'AI-powered YouTube thumbnail generator. Describe your thumbnail concept in plain text and get professional, click-worthy designs generated in seconds using DALL-E 3.',
  url: 'https://tubeforge.co/ai-thumbnails',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Text-to-thumbnail AI generation',
    'YouTube-optimized 1280x720 output',
    'Multiple style presets',
    'Background removal and replacement',
    'Batch generation for A/B testing',
  ],
  author: {
    '@type': 'Organization',
    name: 'TubeForge',
    url: 'https://tubeforge.co',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
  },
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tubeforge.co' },
    { '@type': 'ListItem', position: 2, name: 'AI Thumbnails' },
  ],
};

export default function AiThumbnailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_APP_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />
      {children}
    </>
  );
}
