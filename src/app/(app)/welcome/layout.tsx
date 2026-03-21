import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'Welcome to TubeForge! Get started with your AI-powered YouTube content creation journey.',
  robots: { index: false, follow: false },
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
