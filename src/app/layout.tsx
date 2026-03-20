import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Analytics } from '@/components/Analytics';

const instrumentSans = Instrument_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'TubeForge — ИИ-студия для YouTube', template: '%s | TubeForge' },
  description: 'ИИ-платформа для YouTube-креаторов. Видеоредактор, генерация обложек, оптимизация метаданных.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tubeforge.co'),
  openGraph: {
    title: 'TubeForge — ИИ-студия для YouTube',
    description: 'Создавайте профессиональный YouTube-контент с ИИ. Генерация обложек, оптимизация метаданных, видеомонтаж.',
    type: 'website',
    locale: 'ru_RU',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'TubeForge — AI Studio for YouTube Creators',
      },
    ],
  },
  alternates: {
    canonical: 'https://tubeforge.co',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TubeForge — ИИ-студия для YouTube',
    description: 'Создавайте профессиональный YouTube-контент с ИИ.',
    images: ['/api/og'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TubeForge',
  description: 'ИИ-платформа для YouTube-креаторов. Видеоредактор, генерация обложек, оптимизация метаданных.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  url: 'https://tubeforge.co',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'RUB', name: 'Free' },
    { '@type': 'Offer', price: '990', priceCurrency: 'RUB', name: 'Pro' },
    { '@type': 'Offer', price: '2490', priceCurrency: 'RUB', name: 'Studio' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Prevent flash of wrong theme: read persisted mode before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('tubeforge-theme')||'{}');var m=s.state&&s.state.mode||'light';var d=m==='system'?window.matchMedia('(prefers-color-scheme:dark)').matches:m==='dark';document.documentElement.style.colorScheme=d?'dark':'light';document.documentElement.setAttribute('data-theme',d?'dark':'light');document.documentElement.style.background=d?'#06060b':'#f3f3f7'}catch(e){}})()`
          }}
        />
      </head>
      <body className={`${instrumentSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
