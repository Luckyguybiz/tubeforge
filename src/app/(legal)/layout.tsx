'use client';

import Link from 'next/link';
import { useLocaleStore } from '@/stores/useLocaleStore';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = useLocaleStore((s) => s.t);

  return (
    <main
      role="main"
      style={{
        minHeight: '100dvh',
        background: '#ffffff',
        color: '#1d1d1f',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 24px 96px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#6366f1',
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 500,
            marginBottom: 48,
          }}
        >
          <span>{'\u2190'}</span>
          {t('legal.backToHome')}
        </Link>
        <article>
          {children}
        </article>
        <div
          style={{
            textAlign: 'center',
            marginTop: 48,
            fontSize: 13,
            color: '#86868b',
          }}
        >
          {'\u00A9'} {new Date().getFullYear()} TubeForge. {t('legal.copyright')}
        </div>
      </div>
    </main>
  );
}
