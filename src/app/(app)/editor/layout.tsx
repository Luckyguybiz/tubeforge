import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Editor',
  description: 'AI-powered video editor with scene editing, timeline, and automated video generation for YouTube creators.',
  openGraph: {
    title: 'Video Editor — TubeForge',
    description: 'AI-powered video editor with scene editing, timeline, and automated generation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Editor — TubeForge',
    description: 'AI-powered video editor for YouTube creators.',
  },
  robots: { index: false, follow: false },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
