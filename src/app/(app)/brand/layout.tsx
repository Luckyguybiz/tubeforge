import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brand Kit',
  description: 'Manage your brand assets, colors, fonts, and logos for consistent YouTube content creation.',
  robots: { index: false, follow: false },
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
