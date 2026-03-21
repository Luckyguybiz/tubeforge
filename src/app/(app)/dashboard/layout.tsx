import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your projects and quick access to TubeForge AI tools for YouTube content creation.',
  openGraph: {
    title: 'Dashboard — TubeForge',
    description: 'Manage your YouTube projects, track progress, and access AI-powered creation tools.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://tubeforge.co/dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard — TubeForge',
    description: 'Manage your YouTube projects and access AI-powered creation tools.',
  },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
