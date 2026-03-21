import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'View your content creation statistics, project activity, AI usage, and tool usage breakdown.',
  openGraph: {
    title: 'Analytics — TubeForge',
    description: 'Track your YouTube content creation stats, project activity, AI usage, and tool usage.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://tubeforge.co/analytics',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics — TubeForge',
    description: 'Track your YouTube content creation stats and AI usage.',
  },
  robots: { index: false, follow: false },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
