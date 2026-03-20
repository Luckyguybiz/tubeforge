import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Referral Program',
  description: 'Earn commissions by referring friends to TubeForge. Share your link and get 20% of every subscription payment.',
};

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
