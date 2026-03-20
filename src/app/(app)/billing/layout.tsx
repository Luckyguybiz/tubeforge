import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Plans',
  description: 'Manage your TubeForge subscription, view pricing plans, and upgrade to Pro or Studio for advanced AI features.',
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
