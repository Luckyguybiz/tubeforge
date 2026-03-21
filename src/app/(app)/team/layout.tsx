import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team',
  description: 'Manage your TubeForge team members and collaborate on video projects together.',
  openGraph: {
    title: 'Team — TubeForge',
    description: 'Manage your TubeForge team and collaborate on video projects.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Team — TubeForge',
    description: 'Manage your TubeForge team and collaborate on video projects.',
  },
  robots: { index: false, follow: false },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
