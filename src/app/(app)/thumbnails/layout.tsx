import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thumbnail Editor',
  description: 'AI-powered YouTube thumbnail editor with templates, text overlays, and smart generation for higher click-through rates.',
  openGraph: {
    title: 'Thumbnail Editor — TubeForge',
    description: 'AI-powered YouTube thumbnail editor with templates and smart generation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thumbnail Editor — TubeForge',
    description: 'AI-powered YouTube thumbnail editor.',
  },
  robots: { index: false, follow: false },
};

export default function ThumbnailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
