import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metadata Optimizer',
  description: 'Optimize YouTube video titles, descriptions, and tags with AI for better search rankings and discoverability.',
  openGraph: {
    title: 'Metadata Optimizer — TubeForge',
    description: 'AI-powered YouTube metadata optimization for better search rankings.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metadata Optimizer — TubeForge',
    description: 'Optimize YouTube metadata with AI.',
  },
  robots: { index: false, follow: false },
};

export default function MetadataLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
