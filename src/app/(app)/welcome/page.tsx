'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import Link from 'next/link';

/* ── SVG Icons ──────────────────────────────────── */

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="4" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2.5 5.5L10 11L17.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Step definitions ───────────────────────────── */

function getSteps(t: (key: string) => string) {
  return [
    { label: t('welcome.step.greeting') },
    { label: t('welcome.step.tutorial') },
    { label: t('welcome.step.support') },
  ];
}

function getPlanLabels(t: (key: string) => string): Record<string, string> {
  return {
    PRO: t('welcome.planPro'),
    STUDIO: t('welcome.planStudio'),
  };
}

/* ── Inner component (uses useSearchParams) ─────── */

function WelcomeInner() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
  const STEPS = useMemo(() => getSteps(t), [t]);
  const PLAN_LABELS = useMemo(() => getPlanLabels(t), [t]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();

  const planParam = searchParams.get('plan')?.toUpperCase() ?? '';
  const sessionPlan = session.data?.user?.plan ?? '';
  const plan = (planParam === 'PRO' || planParam === 'STUDIO') ? planParam : sessionPlan;
  const planLabel = PLAN_LABELS[plan] ?? PLAN_LABELS['PRO']!;

  const [currentStep, setCurrentStep] = useState(0);

  /* ── Shared styles ────────────────────────────── */

  const primaryBtn: React.CSSProperties = {
    background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
    color: '#fff',
    border: 'none',
    borderRadius: 50,
    padding: '14px 32px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };

  const outlineBtn: React.CSSProperties = {
    background: isDark ? 'transparent' : C.surface,
    color: C.text,
    border: `1px solid ${C.border}`,
    borderRadius: 50,
    padding: '14px 32px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };

  const linkStyle: React.CSSProperties = {
    color: C.sub,
    fontSize: 13,
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    marginTop: 12,
  };

  /* ── Step progress bar ────────────────────────── */

  const renderStepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
      {STEPS.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const isFuture = i > currentStep;

        const circleColor = isCompleted ? C.green : isCurrent ? C.purple : C.dim;
        const textColor = isCompleted ? C.green : isCurrent ? C.purple : C.dim;

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isCompleted ? C.green : isCurrent ? C.purple : C.border,
                  color: (isCompleted || isCurrent) ? '#fff' : C.dim,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {isCompleted ? <CheckIcon /> : i + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span style={{ color: C.dim, display: 'flex', alignItems: 'center' }}>
                <ChevronIcon />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── Step 1: Welcome ──────────────────────────── */

  const renderStep1 = () => (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-block',
          padding: '6px 18px',
          borderRadius: 50,
          background: `${C.green}1f`,
          color: C.green,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          marginBottom: 20,
        }}
      >
        {planLabel}
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', color: C.text, lineHeight: 1.3 }}>
        <span style={{ color: C.purple }}>{t('welcome.hooray')}</span>
        <span role="img" aria-label="celebration">🎉</span>
      </h1>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', color: C.text }}>
        {t('welcome.congrats')} {plan || 'PRO'}!
      </h2>

      <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.65, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
        {t('welcome.syncedDesc1')} {plan || 'PRO'}{t('welcome.syncedDesc2')}{' '}
        <Link href="/settings" style={{ color: C.purple, textDecoration: 'underline' }}>
          {t('welcome.settingsLink')}
        </Link>
        .
      </p>

      <button
        type="button"
        style={primaryBtn}
        onClick={() => setCurrentStep(1)}
      >
        {t('welcome.startWorking')}
      </button>

      <div style={{ marginTop: 16 }}>
        <button type="button" style={linkStyle}>
          {t('welcome.viewReceipt')}
        </button>
      </div>
    </div>
  );

  /* ── Step 2: Tutorial ─────────────────────────── */

  const renderStep2 = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: C.text, textAlign: 'center' }}>
        {t('welcome.tutorialTitle')}
      </h2>
      <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.65, margin: '0 0 24px', textAlign: 'center' }}>
        {t('welcome.tutorialDesc')}
      </p>

      <div
        style={{
          width: '100%',
          paddingTop: 48,
          paddingBottom: 48,
          borderRadius: 14,
          background: isDark ? 'rgba(79,70,229,.08)' : 'rgba(79,70,229,.04)',
          border: `1px solid ${isDark ? 'rgba(79,70,229,.2)' : 'rgba(79,70,229,.12)'}`,
          marginBottom: 28,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: C.purple }}>
          <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="currentColor" />
        </svg>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.text }}>
          {t('welcome.videoGuideComingSoon')}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.sub }}>
          {t('welcome.videoGuidePrep')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          style={outlineBtn}
          onClick={() => setCurrentStep(0)}
        >
          {t('welcome.back')}
        </button>
        <button
          type="button"
          style={{ ...primaryBtn, flex: 1 }}
          onClick={() => setCurrentStep(2)}
        >
          {t('welcome.continue')}
        </button>
      </div>
    </div>
  );

  /* ── Step 3: Support ──────────────────────────── */

  const renderStep3 = () => (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: C.text }}>
        {t('welcome.needHelp')}
      </h2>
      <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.65, margin: '0 0 28px' }}>
        {t('welcome.supportDesc')}
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
        <a
          href="#"
          style={{
            ...primaryBtn,
            width: 'auto',
            padding: '12px 28px',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          <TelegramIcon />
          Telegram
        </a>
        <a
          href="mailto:support@tubeforge.ai"
          style={{
            ...outlineBtn,
            padding: '12px 28px',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          <MailIcon />
          support@tubeforge.ai
        </a>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          style={outlineBtn}
          onClick={() => setCurrentStep(1)}
        >
          {t('welcome.back')}
        </button>
        <button
          type="button"
          style={{ ...primaryBtn, flex: 1 }}
          onClick={() => router.push('/dashboard')}
        >
          {t('welcome.goToDashboard')}
        </button>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────── */

  const steps = [renderStep1, renderStep2, renderStep3] as const;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? 'rgba(6,6,11,.85)' : 'rgba(243,243,247,.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9998,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          margin: '0 20px',
          background: C.surface,
          borderRadius: 20,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05)'
            : '0 24px 80px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)',
          padding: '40px 44px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {renderStepBar()}
        {steps[currentStep]()}
      </div>
    </div>
  );
}

/* ── Page export (wrapped in Suspense for useSearchParams) ── */

export default function WelcomePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <WelcomeInner />
      </Suspense>
    </ErrorBoundary>
  );
}
