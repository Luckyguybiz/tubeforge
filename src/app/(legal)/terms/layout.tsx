import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Условия использования',
  description: 'Условия использования платформы TubeForge.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
