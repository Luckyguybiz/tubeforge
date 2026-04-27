'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useLocaleStore } from '@/stores/useLocaleStore';

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;

type LoginStep = 'email' | 'code';

function isValidEmail(s: string): boolean {
  // Liberal client-side check; server uses Zod's email validator.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function LoginContent() {
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const { status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeDigits, setCodeDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const [resendIn, setResendIn] = useState(0);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (status === 'authenticated') window.location.href = callbackUrl;
  }, [status, callbackUrl]);

  // Capture referral code from URL to localStorage (existing behavior preserved).
  useEffect(() => {
    try {
      const refCode = searchParams.get('ref');
      if (refCode) localStorage.setItem('tf-ref', refCode);
    } catch { /* localStorage unavailable */ }
  }, [searchParams]);

  // Resend cooldown countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  // Auto-focus first code input when entering code step.
  useEffect(() => {
    if (step === 'code') {
      const id = setTimeout(() => codeRefs.current[0]?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [step]);

  const sendCode = useCallback(
    async (forResend = false) => {
      const trimmed = email.trim();
      if (!isValidEmail(trimmed)) {
        setEmailError(t('auth.login.email.invalid'));
        return;
      }
      setEmailError(null);
      setSending(true);
      try {
        const res = await fetch('/api/auth/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, locale }),
        });
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          const wait = data.retryAt ? Math.max(0, Math.ceil((data.retryAt - Date.now()) / 1000)) : 60;
          setEmailError(t('auth.login.email.rateLimit'));
          setResendIn(wait);
          return;
        }
        if (!res.ok) {
          setEmailError(t('auth.login.email.serverError'));
          return;
        }
        if (!forResend) setStep('code');
        setCodeDigits(Array(CODE_LENGTH).fill(''));
        setCodeError(null);
        setResendIn(RESEND_COOLDOWN_SECONDS);
      } catch {
        setEmailError(t('auth.login.email.serverError'));
      } finally {
        setSending(false);
      }
    },
    [email, locale, t],
  );

  const submitCode = useCallback(async () => {
    const code = codeDigits.join('');
    if (code.length !== CODE_LENGTH) {
      setCodeError(t('auth.login.code.incomplete'));
      return;
    }
    setVerifying(true);
    setCodeError(null);
    try {
      // Pre-validate with /verify so we can show a clear error before letting
      // signIn() consume the code. signIn re-runs the same check server-side.
      const pre = await fetch('/api/auth/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      if (!pre.ok) {
        const data = await pre.json().catch(() => ({}));
        if (pre.status === 429) {
          setCodeError(t('auth.login.code.tooMany'));
        } else if (data.error === 'expired_code') {
          setCodeError(t('auth.login.code.expired'));
        } else {
          setCodeError(t('auth.login.code.invalid'));
        }
        setVerifying(false);
        return;
      }
      // Hand off to NextAuth. The Credentials provider re-checks the code,
      // creates/updates the user, and sets the session cookie.
      const result = await signIn('email-code', {
        email: email.trim(),
        code,
        redirect: false,
      });
      if (result?.error) {
        setCodeError(t('auth.login.code.invalid'));
        setVerifying(false);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setCodeError(t('auth.login.code.serverError'));
      setVerifying(false);
    }
  }, [codeDigits, email, callbackUrl, t]);

  const handleDigitChange = (idx: number, value: string) => {
    // Accept only the last digit if multiple are pasted into a single box.
    const digits = value.replace(/\D/g, '');
    if (!digits.length) {
      const next = [...codeDigits];
      next[idx] = '';
      setCodeDigits(next);
      return;
    }
    if (digits.length === 1) {
      const next = [...codeDigits];
      next[idx] = digits;
      setCodeDigits(next);
      if (idx < CODE_LENGTH - 1) codeRefs.current[idx + 1]?.focus();
      return;
    }
    // Multi-digit paste — distribute starting at this index.
    const next = [...codeDigits];
    for (let i = 0; i < digits.length && idx + i < CODE_LENGTH; i++) {
      next[idx + i] = digits[i];
    }
    setCodeDigits(next);
    const lastFilled = Math.min(idx + digits.length, CODE_LENGTH - 1);
    codeRefs.current[lastFilled]?.focus();
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < CODE_LENGTH - 1) {
      codeRefs.current[idx + 1]?.focus();
    } else if (e.key === 'Enter') {
      void submitCode();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (/^\d+$/.test(text.replace(/\s/g, ''))) {
      e.preventDefault();
      handleDigitChange(0, text);
    }
  };

  // Auto-submit when all 6 digits are entered (only if not already verifying).
  useEffect(() => {
    if (codeDigits.every((d) => d) && !verifying) {
      void submitCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeDigits.join('')]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <main style={styles.page}>
        <div style={styles.spinner} />
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.logoWrap}>
        <div style={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5z" fill="#fff" />
          </svg>
        </div>
        <span style={styles.logoText}>TubeForge</span>
      </div>

      <div style={styles.card}>
        {step === 'email' ? (
          <>
            <h1 style={styles.heading}>{t('auth.login.title')}</h1>
            <p style={styles.subtitle}>{t('auth.login.subtitle')}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              <label htmlFor="login-email" style={styles.label}>
                {t('auth.login.email.label')}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder={t('auth.login.email.placeholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                disabled={sending}
                style={{
                  ...styles.input,
                  borderColor: emailError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)',
                }}
                aria-invalid={!!emailError}
              />
              {emailError && <p style={styles.fieldError}>{emailError}</p>}

              <button
                type="submit"
                disabled={sending}
                style={{
                  ...styles.primaryBtn,
                  opacity: sending ? 0.6 : 1,
                  cursor: sending ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? <ButtonSpinner /> : t('auth.login.email.send')}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={styles.heading}>{t('auth.login.code.title')}</h1>
            <p style={styles.subtitle}>
              {t('auth.login.code.subtitle')} <strong style={{ color: '#ffffff' }}>{email}</strong>
            </p>

            {codeError && (
              <div style={styles.errorBanner} role="alert">
                <ErrorIcon />
                <span>{codeError}</span>
              </div>
            )}

            <div style={styles.codeRow}>
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { codeRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  pattern="\d*"
                  maxLength={CODE_LENGTH /* allow paste; we filter in handler */}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  onPaste={handlePaste}
                  disabled={verifying}
                  aria-label={`${t('auth.login.code.digit')} ${idx + 1}`}
                  style={{
                    ...styles.codeInput,
                    borderColor: codeError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => void submitCode()}
              disabled={verifying || codeDigits.some((d) => !d)}
              style={{
                ...styles.primaryBtn,
                marginTop: 20,
                opacity: verifying || codeDigits.some((d) => !d) ? 0.6 : 1,
                cursor: verifying || codeDigits.some((d) => !d) ? 'not-allowed' : 'pointer',
              }}
            >
              {verifying ? <ButtonSpinner /> : t('auth.login.code.verify')}
            </button>

            <div style={styles.codeFooter}>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCodeError(null);
                  setCodeDigits(Array(CODE_LENGTH).fill(''));
                }}
                style={styles.linkBtn}
              >
                {t('auth.login.code.changeEmail')}
              </button>
              <button
                type="button"
                onClick={() => void sendCode(true)}
                disabled={resendIn > 0 || sending}
                style={{
                  ...styles.linkBtn,
                  opacity: resendIn > 0 || sending ? 0.5 : 1,
                  cursor: resendIn > 0 || sending ? 'not-allowed' : 'pointer',
                }}
              >
                {resendIn > 0
                  ? `${t('auth.login.code.resendIn')} ${resendIn}s`
                  : t('auth.login.code.resend')}
              </button>
            </div>
          </>
        )}
      </div>

      <p style={styles.legal}>{t('auth.login.consent')}</p>
    </main>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="#ff3b30" fillOpacity="0.12" />
      <path d="M8 4.5v4M8 10.5v.5" stroke="#ff3b30" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ButtonSpinner() {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        border: '2px solid rgba(255,255,255,0.25)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }}
      aria-hidden="true"
    />
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
    padding: 'clamp(20px, 5vw, 40px)',
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
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    textAlign: 'left' as const,
  },
  input: {
    width: '100%',
    height: 48,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s, background 0.15s',
  },
  fieldError: {
    color: '#f87171',
    fontSize: 12,
    margin: '6px 0 0',
    textAlign: 'left' as const,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    marginTop: 16,
    padding: '0 20px',
    borderRadius: 12,
    border: 'none',
    background: '#6366f1',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.15s, transform 0.05s',
    outline: 'none',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
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
  codeRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  codeInput: {
    width: 44,
    height: 56,
    textAlign: 'center' as const,
    fontSize: 22,
    fontWeight: 600,
    color: '#ffffff',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontFamily: "'SF Mono', 'Menlo', 'Consolas', monospace",
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  },
  codeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    fontSize: 13,
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: 4,
    fontFamily: 'inherit',
  },
  switchText: {
    color: 'rgba(255,255,255,0.5)',
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
    color: 'rgba(255,255,255,0.45)',
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
