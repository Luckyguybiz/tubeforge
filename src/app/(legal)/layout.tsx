'use client';

import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  return (
    <main
      role="main"
      style={{
        minHeight: '100dvh',
        background: C.bg,
        color: C.text,
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: C.sub,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 18 }}>{'\u2190'}</span>
          {t('legal.backToHome')}
        </Link>
        <article
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: '48px 40px',
          }}
        >
          {children}
        </article>
        <div
          style={{
            textAlign: 'center',
            marginTop: 32,
            fontSize: 13,
            color: C.dim,
          }}
        >
          {'\u00A9'} {new Date().getFullYear()} TubeForge. {t('legal.copyright')}
        </div>
      </div>
    </main>
  );
}
