import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your TubeForge profile, subscription, integrations, and account preferences.',
  openGraph: {
    title: 'Settings — TubeForge',
    description: 'Manage your TubeForge profile, subscription, and account preferences.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Settings — TubeForge',
    description: 'Manage your TubeForge account settings.',
  },
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
