'use client';

/**
 * Login — pilot migration to Tailwind v4 + shadcn primitives.
 *
 * Logic preserved 1:1 from the inline-styled predecessor:
 *   - Two modes (email-code OTP / email + password), persisted in localStorage
 *   - Code mode: email step → 6-digit step with paste/auto-advance/auto-submit
 *   - Password mode: email + password single-step
 *   - All error/loading states; rate-limit, expired-code, invalid distinctions
 *   - Referral code captured from URL → localStorage
 *
 * What changed: ~470 lines of inline styles replaced by Tailwind utility
 * classes + Button/Input primitives. Pure visual / structural refactor.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;
const MODE_STORAGE_KEY = 'tf-login-mode';

type LoginStep = 'email' | 'code';
type LoginMode = 'code' | 'password';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function LoginContent() {
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const { status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [mode, setMode] = useState<LoginMode>('code');
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeDigits, setCodeDigits] = useState<string[]>(() =>
    Array(CODE_LENGTH).fill(''),
  );
  const [resendIn, setResendIn] = useState(0);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [signingInPassword, setSigningInPassword] = useState(false);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Restore mode preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === 'password' || saved === 'code') setMode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const switchMode = useCallback((next: LoginMode) => {
    setMode(next);
    setEmailError(null);
    setPasswordError(null);
    setCodeError(null);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // Already-authenticated → redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') window.location.href = callbackUrl;
  }, [status, callbackUrl]);

  // Capture referral code from URL
  useEffect(() => {
    try {
      const refCode = searchParams.get('ref');
      if (refCode) localStorage.setItem('tf-ref', refCode);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  // Auto-focus first code box
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
          const wait = data.retryAt
            ? Math.max(0, Math.ceil((data.retryAt - Date.now()) / 1000))
            : 60;
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

  const submitPassword = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailError(t('auth.login.email.invalid'));
      return;
    }
    if (password.length < 8) {
      setPasswordError(t('auth.login.password.tooShort'));
      return;
    }
    setEmailError(null);
    setPasswordError(null);
    setSigningInPassword(true);
    try {
      const result = await signIn('email-password', {
        email: trimmedEmail,
        password,
        redirect: false,
      });
      if (result?.error) {
        setPasswordError(t('auth.login.password.invalid'));
        setSigningInPassword(false);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setPasswordError(t('auth.login.password.serverError'));
      setSigningInPassword(false);
    }
  }, [email, password, callbackUrl, t]);

  const handleDigitChange = (idx: number, value: string) => {
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
    const next = [...codeDigits];
    for (let i = 0; i < digits.length && idx + i < CODE_LENGTH; i++) {
      next[idx + i] = digits[i];
    }
    setCodeDigits(next);
    const lastFilled = Math.min(idx + digits.length, CODE_LENGTH - 1);
    codeRefs.current[lastFilled]?.focus();
  };

  const handleDigitKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
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

  // Auto-submit on full code
  useEffect(() => {
    if (codeDigits.every((d) => d) && !verifying) {
      void submitCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeDigits.join('')]);

  // Loading / already-authenticated splash
  if (status === 'loading' || status === 'authenticated') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-10">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7L8 5z" fill="#fff" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          TubeForge
        </span>
      </div>

      {/* Card */}
      <section
        className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8"
        aria-labelledby="login-title"
      >
        {step === 'email' ? (
          <>
            <h1
              id="login-title"
              className="mb-1.5 text-center text-2xl font-semibold tracking-tight text-foreground"
            >
              {t('auth.login.title')}
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {t('auth.login.subtitle')}
            </p>

            {/* Mode toggle */}
            <div
              role="tablist"
              className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted/40 p-1"
            >
              <ModeTabButton
                active={mode === 'code'}
                onClick={() => switchMode('code')}
                label={t('auth.login.tab.code')}
              />
              <ModeTabButton
                active={mode === 'password'}
                onClick={() => switchMode('password')}
                label={t('auth.login.tab.password')}
              />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === 'code') void sendCode();
                else void submitPassword();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-muted-foreground"
                >
                  {t('auth.login.email.label')}
                </label>
                <Input
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
                  disabled={sending || signingInPassword}
                  aria-invalid={!!emailError}
                />
                {emailError && <FieldError>{emailError}</FieldError>}
              </div>

              {mode === 'password' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-muted-foreground"
                  >
                    {t('auth.login.password.label')}
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t('auth.login.password.placeholder')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    disabled={signingInPassword}
                    aria-invalid={!!passwordError}
                  />
                  {passwordError && <FieldError>{passwordError}</FieldError>}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={mode === 'code' ? sending : signingInPassword}
              >
                {mode === 'code'
                  ? t('auth.login.email.send')
                  : t('auth.login.password.signIn')}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1
              id="login-title"
              className="mb-1.5 text-center text-2xl font-semibold tracking-tight text-foreground"
            >
              {t('auth.login.code.title')}
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {t('auth.login.code.subtitle')}{' '}
              <strong className="text-foreground">{email}</strong>
            </p>

            {codeError && (
              <div
                role="alert"
                className="mb-5 flex items-center gap-2.5 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
              >
                <ErrorIcon />
                <span>{codeError}</span>
              </div>
            )}

            <div className="flex justify-center gap-2">
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    codeRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  pattern="\d*"
                  maxLength={CODE_LENGTH}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  onPaste={handlePaste}
                  disabled={verifying}
                  aria-label={`${t('auth.login.code.digit')} ${idx + 1}`}
                  aria-invalid={!!codeError}
                  className={cn(
                    'h-14 w-11 rounded-lg border bg-input text-center font-mono text-xl font-semibold text-foreground',
                    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    codeError ? 'border-error/40' : 'border-border',
                  )}
                />
              ))}
            </div>

            <Button
              onClick={() => void submitCode()}
              disabled={verifying || codeDigits.some((d) => !d)}
              loading={verifying}
              className="mt-5 w-full"
              size="lg"
            >
              {t('auth.login.code.verify')}
            </Button>

            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCodeError(null);
                  setCodeDigits(Array(CODE_LENGTH).fill(''));
                }}
                className="font-medium text-brand-300 transition-colors hover:text-brand-200"
              >
                {t('auth.login.code.changeEmail')}
              </button>
              <button
                type="button"
                onClick={() => void sendCode(true)}
                disabled={resendIn > 0 || sending}
                className={cn(
                  'font-medium transition-colors',
                  resendIn > 0 || sending
                    ? 'cursor-not-allowed text-muted-foreground/60'
                    : 'text-brand-300 hover:text-brand-200',
                )}
              >
                {resendIn > 0
                  ? `${t('auth.login.code.resendIn')} ${resendIn}s`
                  : t('auth.login.code.resend')}
              </button>
            </div>
          </>
        )}
      </section>

      <p className="mt-4 max-w-[360px] text-center text-xs leading-relaxed text-muted-foreground/70">
        {t('auth.login.consent')}
      </p>
    </main>
  );
}

/* — Sub-components — */

function ModeTabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'h-9 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-brand-500/15 text-brand-200'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-error">{children}</p>;
}

function ErrorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M8 4.5v4M8 10.5v.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-background">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
