import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TikTok Analytics',
  description: 'Track your TikTok video performance, engagement metrics, and audience growth with TubeForge analytics.',
  openGraph: {
    title: 'TikTok Analytics — TubeForge',
    description: 'Track TikTok video performance, engagement, and audience growth.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TikTok Analytics — TubeForge',
    description: 'Track your TikTok video performance with TubeForge.',
  },
  robots: { index: false, follow: false },
};

export default function TiktokAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
