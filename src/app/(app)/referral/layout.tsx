import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Referral Program',
  description: 'Earn commissions by referring friends to TubeForge. Share your link and get 20% of every subscription payment.',
  openGraph: {
    title: 'Referral Program — TubeForge',
    description: 'Earn commissions by referring friends to TubeForge.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Referral Program — TubeForge',
    description: 'Earn commissions by referring friends to TubeForge.',
  },
  robots: { index: false, follow: false },
};

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
