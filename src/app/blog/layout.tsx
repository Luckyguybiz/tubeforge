import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Блог TubeForge — Гайды для YouTube-креаторов',
  description:
    'Полезные статьи для YouTube-блогеров: как скачать видео, VPN для YouTube в России, AI инструменты, создание превью и сравнение TikTok vs YouTube Shorts.',
  openGraph: {
    title: 'Блог TubeForge — Гайды для YouTube-креаторов',
    description:
      'Статьи про YouTube: скачивание видео, VPN доступ из России, AI инструменты для блогеров, создание превью, TikTok vs Shorts.',
    type: 'website',
    locale: 'ru_RU',
  },
  alternates: {
    canonical: 'https://tubeforge.co/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Блог TubeForge — Гайды для YouTube-креаторов',
    description:
      'Полезные статьи для YouTube-блогеров: скачивание видео, VPN, AI инструменты, превью, TikTok vs Shorts.',
  },
  keywords: [
    'скачать видео с ютуба',
    'скачать видео с youtube',
    'youtube downloader',
    'vpn для youtube',
    'как зайти на ютуб из россии',
    'youtube vpn россия',
    'ai для ютуба',
    'инструменты для ютубера',
    'нейросети для видео',
    'превью для ютуба',
    'обложка youtube',
    'thumbnail youtube',
    'тикток или ютуб шортс',
    'shorts vs tiktok',
    'TubeForge блог',
  ],
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
