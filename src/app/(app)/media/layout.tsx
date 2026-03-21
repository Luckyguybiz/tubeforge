import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Library',
  description: 'Manage your uploaded media files, images, and video assets in the TubeForge media library.',
  robots: { index: false, follow: false },
};

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
