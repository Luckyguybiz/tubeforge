import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preview & Export',
  description: 'Preview your final video project and export it for publishing on YouTube.',
  openGraph: {
    title: 'Preview & Export — TubeForge',
    description: 'Preview and export your video project for YouTube.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preview & Export — TubeForge',
    description: 'Preview and export your video for YouTube.',
  },
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
