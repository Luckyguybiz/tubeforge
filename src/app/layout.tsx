import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Analytics } from '@/components/Analytics';
import { WebVitals } from '@/components/WebVitals';

const instrumentSans = Instrument_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'TubeForge — AI Studio for YouTube Creators', template: '%s | TubeForge' },
  description: 'AI-powered platform for YouTube creators. Video editor, thumbnail generator, metadata optimizer, analytics, and free tools.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tubeforge.co'),
  applicationName: 'TubeForge',
  keywords: ['YouTube', 'AI video editor', 'thumbnail generator', 'YouTube SEO', 'video creator', 'TubeForge', 'YouTube tools'],
  authors: [{ name: 'TubeForge', url: 'https://tubeforge.co' }],
  creator: 'TubeForge',
  publisher: 'TubeForge',
  robots: { index: true, follow: true },
  openGraph: {
    siteName: 'TubeForge',
    title: 'TubeForge — AI Studio for YouTube Creators',
    description: 'Create professional YouTube content with AI. Thumbnail generation, metadata optimization, video editing, analytics, and free tools.',
    type: 'website',
    locale: 'en_US',
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
    title: 'TubeForge — AI Studio for YouTube Creators',
    description: 'Create professional YouTube content with AI. Thumbnail generation, metadata optimization, video editing.',
    images: ['/api/og'],
  },
  manifest: '/manifest.json',
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
  description: 'AI-powered platform for YouTube creators. Video editor, thumbnail generator, metadata optimizer, analytics, and free tools.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  url: 'https://tubeforge.co',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '2490',
    priceCurrency: 'RUB',
    offerCount: '3',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <WebVitals />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
