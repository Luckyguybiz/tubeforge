import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metadata Optimizer',
  description: 'Optimize YouTube video titles, descriptions, and tags with AI for better search rankings and discoverability.',
};

export default function MetadataLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
