import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — TubeForge',
  description:
    'Последние обновления TubeForge: новые функции, исправления ошибок, улучшения платформы.',
  openGraph: {
    title: 'Changelog — TubeForge',
    description:
      'Следите за обновлениями TubeForge: AI-генерация видео, скачивание, VPN, аналитика и многое другое.',
    type: 'website',
    locale: 'ru_RU',
  },
  alternates: {
    canonical: 'https://tubeforge.co/changelog',
  },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
