import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Editor',
  description: 'AI-powered video editor with scene editing, timeline, and automated video generation for YouTube creators.',
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
