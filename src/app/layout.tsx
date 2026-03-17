import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const instrumentSans = Instrument_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: { default: 'TubeForge — ИИ-студия для YouTube', template: '%s | TubeForge' },
  description: 'ИИ-платформа для YouTube-креаторов. Видеоредактор, генерация обложек, оптимизация метаданных.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tubeforge.app'),
  openGraph: {
    title: 'TubeForge — ИИ-студия для YouTube',
    description: 'Создавайте профессиональный YouTube-контент с ИИ. Генерация обложек, оптимизация метаданных, видеомонтаж.',
    type: 'website',
    locale: 'ru_RU',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://tubeforge.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TubeForge — ИИ-студия для YouTube',
    description: 'Создавайте профессиональный YouTube-контент с ИИ.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${instrumentSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
