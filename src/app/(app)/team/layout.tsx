import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team',
  description: 'Manage your TubeForge team members and collaborate on video projects together.',
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
