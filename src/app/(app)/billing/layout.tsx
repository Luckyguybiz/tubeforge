import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Plans',
  description: 'Manage your TubeForge subscription, view pricing plans, and upgrade to Pro or Studio for advanced AI features.',
  openGraph: {
    title: 'Billing & Plans — TubeForge',
    description: 'Choose the right TubeForge plan. Free, Pro, or Studio with advanced AI-powered YouTube tools.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://tubeforge.co/billing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Billing & Plans — TubeForge',
    description: 'Choose the right TubeForge plan for your YouTube content creation needs.',
  },
  robots: { index: false, follow: false },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
