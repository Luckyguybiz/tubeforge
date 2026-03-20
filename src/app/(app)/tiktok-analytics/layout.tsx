import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TikTok Analytics',
  description: 'Track your TikTok video performance, engagement metrics, and audience growth with TubeForge analytics.',
};

export default function TiktokAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
