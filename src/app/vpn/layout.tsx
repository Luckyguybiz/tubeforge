import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VPN для YouTube из России — TubeForge',
  description:
    'Персональный WireGuard VPN от TubeForge. Быстрый и безопасный доступ к YouTube из России. Серверы в Европе, включён в подписку Pro и Studio.',
  openGraph: {
    title: 'VPN для YouTube из России — TubeForge',
    description:
      'Персональный WireGuard VPN. Быстрый доступ к YouTube из России. Серверы в Европе, шифрование WireGuard, работает на всех устройствах.',
    type: 'website',
    locale: 'ru_RU',
  },
  alternates: {
    canonical: 'https://tubeforge.co/vpn',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VPN для YouTube из России — TubeForge',
    description: 'Персональный WireGuard VPN. Быстрый доступ к YouTube из России.',
  },
  keywords: [
    'VPN',
    'YouTube VPN',
    'VPN Россия',
    'доступ к YouTube',
    'WireGuard VPN',
    'TubeForge VPN',
    'YouTube из России',
    'разблокировать YouTube',
    'VPN для YouTube',
  ],
};

export default function VpnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
