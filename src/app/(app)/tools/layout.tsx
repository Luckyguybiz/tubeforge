import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tools',
  description: 'Browse all TubeForge AI-powered tools for YouTube creators: thumbnail generator, metadata optimizer, video editor, and more.',
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
