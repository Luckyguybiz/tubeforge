import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thumbnail Editor',
  description: 'AI-powered YouTube thumbnail editor with templates, text overlays, and smart generation for higher click-through rates.',
};

export default function ThumbnailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
