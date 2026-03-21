import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VPN for YouTube',
  description:
    'Personal WireGuard VPN by TubeForge. Fast and secure access to YouTube. European servers, included with Pro and Studio plans.',
  openGraph: {
    title: 'VPN for YouTube — TubeForge',
    description:
      'Personal WireGuard VPN. Fast YouTube access. European servers, WireGuard encryption, works on all devices.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeForge VPN' }],
  },
  alternates: {
    canonical: 'https://tubeforge.co/vpn',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VPN for YouTube — TubeForge',
    description: 'Personal WireGuard VPN. Fast and secure YouTube access.',
    images: ['/api/og'],
  },
  keywords: [
    'VPN',
    'YouTube VPN',
    'WireGuard VPN',
    'TubeForge VPN',
    'VPN for YouTube',
    'secure VPN',
  ],
};

export default function VpnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
