import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'TubeForge admin panel: platform statistics and user management.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
