import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shorts Analytics',
  description: 'Analyze your YouTube Shorts performance: views, engagement, and growth metrics powered by TubeForge.',
  openGraph: {
    title: 'Shorts Analytics — TubeForge',
    description: 'Track YouTube Shorts performance, engagement, and growth metrics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shorts Analytics — TubeForge',
    description: 'Analyze your YouTube Shorts performance.',
  },
  robots: { index: false, follow: false },
};

export default function ShortsAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
