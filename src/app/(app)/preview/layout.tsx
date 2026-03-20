import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preview & Export',
  description: 'Preview your final video project and export it for publishing on YouTube.',
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
