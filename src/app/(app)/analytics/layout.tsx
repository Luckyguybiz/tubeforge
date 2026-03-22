import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Trending content insights for YouTube Shorts and TikTok — discover top-performing short-form videos.',
  openGraph: {
    title: 'Analytics — TubeForge',
    description: 'Trending content insights for YouTube Shorts and TikTok.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://tubeforge.co/analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics — TubeForge',
    description: 'Trending content insights for YouTube Shorts and TikTok.',
  },
  robots: { index: false, follow: false },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
