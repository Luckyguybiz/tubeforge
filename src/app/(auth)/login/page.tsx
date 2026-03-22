'use client';

import { Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ---------- Google "G" logo (official multi-color) ---------- */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function LoginContent() {
  const t = useLocaleStore((s) => s.t);
  const { status } = useSession();
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

  const errorMessage = error
    ? error === 'OAuthAccountNotLinked'
      ? t('auth.login.errorLinked')
      : error === 'OAuthSignin'
        ? t('auth.login.errorSignin')
        : error === 'OAuthCallback'
          ? t('auth.login.errorGeneric')
          : t('auth.login.errorGeneric')
    : null;

  if (status === 'loading' || status === 'authenticated') {
    return (
      <main style={styles.page}>
        <div style={styles.spinner} />
      </main>
    );
  }

  return (
    <main style={styles.page}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5z" fill="#fff" />
          </svg>
        </div>
        <span style={styles.logoText}>TubeForge</span>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <h1 style={styles.heading}>{t('auth.login.title')}</h1>
        <p style={styles.subtitle}>{t('auth.login.subtitle')}</p>

        {/* Error */}
        {errorMessage && (
          <div style={styles.errorBanner}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="8" fill="#ff3b30" fillOpacity="0.12" />
              <path d="M8 4.5v4M8 10.5v.5" stroke="#ff3b30" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          style={styles.googleBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <GoogleLogo />
          {t('auth.login.google')}
        </button>
      </div>

      {/* Below-card link */}
      <p style={styles.switchText}>
        {t('auth.login.noAccount')}{' '}
        <Link href="/register" style={styles.switchLink}>
          {t('auth.login.register')}
        </Link>
      </p>

      {/* Legal */}
      <p style={styles.legal}>{t('auth.login.consent')}</p>
    </main>
  );
}

/* ---------- Dark design tokens ---------- */
const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Instrument Sans', 'Helvetica Neue', sans-serif",
    padding: '40px 20px',
    boxSizing: 'border-box',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '2.5px solid rgba(255,255,255,0.1)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#1a1a1a',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    padding: 40,
    boxSizing: 'border-box' as const,
    textAlign: 'center' as const,
  },
  heading: {
    fontSize: 24,
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 6px 0',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    margin: '0 0 28px 0',
    lineHeight: 1.5,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 20,
    color: '#f87171',
    fontSize: 13,
    lineHeight: 1.4,
    textAlign: 'left' as const,
  },
  googleBtn: {
    width: '100%',
    height: 48,
    padding: '0 20px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'background 0.2s, border-color 0.2s',
    outline: 'none',
  },
  switchText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    marginTop: 24,
    marginBottom: 0,
  },
  switchLink: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: 600,
  },
  legal: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center' as const,
    maxWidth: 360,
    lineHeight: 1.5,
  },
};

export default function LoginPage() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <Suspense fallback={<div style={{ width: '100%', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}><div style={styles.spinner} /></div>}>
        <LoginContent />
      </Suspense>
    </>
  );
}
