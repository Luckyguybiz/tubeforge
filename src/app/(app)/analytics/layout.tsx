import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'View your content creation statistics, project activity, AI usage, and tool usage breakdown.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
