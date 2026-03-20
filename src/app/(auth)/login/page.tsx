'use client';

import { Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

function LoginContent() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (status === 'authenticated') window.location.href = '/dashboard';
  }, [status]);

  // Capture referral code from URL to localStorage
  useEffect(() => {
    try {
      const refCode = searchParams.get('ref');
      if (refCode) localStorage.setItem('tf-ref', refCode);
    } catch { /* localStorage unavailable */ }
  }, [searchParams]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div style={{ width: '100%', minHeight: '100dvh' /* dvh accounts for mobile address bar */, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <main style={{ width: '100%', minHeight: '100dvh' /* dvh accounts for mobile address bar */, background: C.bg, fontFamily: "'Instrument Sans',sans-serif", color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>TF</div>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.02em' }}>TubeForge</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{t('auth.login.title')}</h1>
        <p style={{ color: C.sub, fontSize: 14, marginBottom: 28 }}>{t('auth.login.subtitle')}</p>
        {error && (
          <div style={{ background: '#ef444414', border: '1px solid #ef444433', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#ef4444', fontSize: 13, textAlign: 'left' }}>
            {error === 'OAuthAccountNotLinked'
              ? t('auth.login.errorLinked')
              : t('auth.login.errorGeneric')}
          </div>
        )}
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          style={{ width: '100%', padding: '14px 24px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12, transition: 'border-color .2s, background .2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.surface; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t('auth.login.google')}
        </button>
        <p style={{ color: C.sub, fontSize: 13, marginTop: 20 }}>
          {t('auth.login.noAccount')}{' '}
          <Link href="/register" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
            {t('auth.login.register')}
          </Link>
        </p>
        <p style={{ color: C.dim, fontSize: 11, marginTop: 12 }}>{t('auth.login.consent')}</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ width: '100%', minHeight: '100dvh' /* dvh accounts for mobile address bar */, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}>
      <LoginContent />
    </Suspense>
  );
}
