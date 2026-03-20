import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shorts Analytics',
  description: 'Analyze your YouTube Shorts performance: views, engagement, and growth metrics powered by TubeForge.',
};

export default function ShortsAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
