import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Статус системы — TubeForge',
  description:
    'Текущий статус всех сервисов TubeForge: приложение, база данных, AI-генерация, платежи, VPN.',
  openGraph: {
    title: 'Статус системы — TubeForge',
    description:
      'Мониторинг работоспособности TubeForge в реальном времени. Uptime 99.9%.',
    type: 'website',
    locale: 'ru_RU',
  },
  alternates: {
    canonical: 'https://tubeforge.co/status',
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
