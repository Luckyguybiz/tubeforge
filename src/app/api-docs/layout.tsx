import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation',
  description:
    'TubeForge REST API documentation. Integrate AI-powered YouTube tools into your workflow with our developer API.',
  openGraph: {
    title: 'API Documentation — TubeForge',
    description:
      'Explore the TubeForge API: endpoints, authentication, rate limits, and code examples for YouTube tool integration.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge API Documentation' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/api-docs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Documentation — TubeForge',
    description: 'Integrate TubeForge AI-powered YouTube tools into your workflow.',
    images: ['/api/og'],
  },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
