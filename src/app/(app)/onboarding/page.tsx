'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/* ── Constants ────────────────────────────────────────────────────── */

const ACCENT = '#6366f1';
const ACCENT_BG = 'rgba(99,102,241,0.08)';
const BG = '#0a0a0a';
const CARD_BG = '#1a1a1a';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const TEXT = '#ffffff';
const SUB = 'rgba(255,255,255,0.5)';
const DIM = 'rgba(255,255,255,0.3)';
const TOTAL_QUIZ_STEPS = 4;
const COUNTDOWN_SECONDS = 15 * 60; // 15 minutes
const LS_QUIZ_KEY = 'tf-onboarding-quiz';
const LS_DONE_KEY = 'tf-quiz-done';

/* ── Types ────────────────────────────────────────────────────────── */

interface QuizAnswers {
  usage?: string;
  goal?: string;
  frequency?: string;
  tools?: string[];
}

/* ── SVG Icons ────────────────────────────────────────────────────── */

function SparkleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
        fill={ACCENT}
        opacity="0.9"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke={ACCENT} strokeWidth="1.5" />
      <path d="M3 19c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke={ACCENT} strokeWidth="1.5" opacity="0.6" />
      <path d="M19 19c0-2.76-1.79-5-4-5" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="1" width="18" height="18" rx="4" fill={ACCENT} />
        <path d="M6 10l2.5 2.5L14 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="18" height="18" rx="4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
    </svg>
  );
}

function RadioIcon({ selected }: { selected: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke={selected ? ACCENT : 'rgba(255,255,255,0.15)'} strokeWidth="1.5" />
      {selected && <circle cx="10" cy="10" r="5" fill={ACCENT} />}
    </svg>
  );
}

/* ── Helper: format countdown ─────────────────────────────────────── */

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ── Main Component ───────────────────────────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState(0); // 0-3 = quiz, 4 = offer
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if quiz already done, redirect to dashboard
  useEffect(() => {
    try {
      if (localStorage.getItem(LS_DONE_KEY) === 'true') {
        router.replace('/dashboard');
      }
    } catch { /* localStorage unavailable */ }
  }, [router]);

  // Load saved answers from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_QUIZ_KEY);
      if (saved) {
        setAnswers(JSON.parse(saved));
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LS_QUIZ_KEY, JSON.stringify(answers));
    } catch { /* localStorage unavailable */ }
  }, [answers]);

  // Countdown timer for the offer step
  useEffect(() => {
    if (step !== 4) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  /* ── Navigation helpers ─────────────────────────────────────────── */

  const goToStep = useCallback((nextStep: number, direction: 'forward' | 'backward') => {
    setSlideDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 200);
  }, []);

  const handleContinue = useCallback(() => {
    if (step < TOTAL_QUIZ_STEPS - 1) {
      goToStep(step + 1, 'forward');
    } else {
      // Quiz complete, show offer
      goToStep(4, 'forward');
    }
  }, [step, goToStep]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      goToStep(step - 1, 'backward');
    }
  }, [step, goToStep]);

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem(LS_DONE_KEY, 'true');
    } catch { /* localStorage unavailable */ }
    router.push('/dashboard');
  }, [router]);

  const handleClaimOffer = useCallback(() => {
    try {
      localStorage.setItem(LS_DONE_KEY, 'true');
    } catch { /* localStorage unavailable */ }
    router.push('/billing?plan=PRO&promo=WELCOME50');
  }, [router]);

  const handleSkipOffer = useCallback(() => {
    try {
      localStorage.setItem(LS_DONE_KEY, 'true');
    } catch { /* localStorage unavailable */ }
    router.push('/dashboard');
  }, [router]);

  /* ── Check if current step has a valid answer ───────────────────── */

  const canContinue = (): boolean => {
    switch (step) {
      case 0: return !!answers.usage;
      case 1: return !!answers.goal;
      case 2: return !!answers.frequency;
      case 3: return !!answers.tools && answers.tools.length > 0;
      default: return true;
    }
  };

  /* ── Progress bar width ─────────────────────────────────────────── */

  const progressWidth = step <= 3 ? ((step + 1) / TOTAL_QUIZ_STEPS) * 100 : 100;

  /* ── Shared styles ──────────────────────────────────────────────── */

  const cardStyle = (selected: boolean): React.CSSProperties => ({
    background: selected ? ACCENT_BG : CARD_BG,
    border: `1.5px solid ${selected ? ACCENT : CARD_BORDER}`,
    borderRadius: 16,
    padding: '24px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    textAlign: 'left',
  });

  const pillStyle = (selected: boolean): React.CSSProperties => ({
    background: selected ? ACCENT_BG : CARD_BG,
    border: `1.5px solid ${selected ? ACCENT : CARD_BORDER}`,
    borderRadius: 50,
    padding: '14px 28px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 500,
    color: selected ? TEXT : SUB,
    fontFamily: 'inherit',
  });

  const continueBtn: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: 'none',
    background: canContinue()
      ? `linear-gradient(135deg, ${ACCENT}, #8b5cf6)`
      : 'rgba(255,255,255,0.06)',
    color: canContinue() ? '#fff' : 'rgba(255,255,255,0.2)',
    fontSize: 15,
    fontWeight: 600,
    cursor: canContinue() ? 'pointer' : 'default',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    marginTop: 32,
  };

  /* ── Slide animation style ──────────────────────────────────────── */

  const slideStyle: React.CSSProperties = {
    opacity: isTransitioning ? 0 : 1,
    transform: isTransitioning
      ? `translateX(${slideDirection === 'forward' ? '30px' : '-30px'})`
      : 'translateX(0)',
    transition: 'all 0.2s ease',
  };

  /* ── Step Renderers ─────────────────────────────────────────────── */

  const renderStep1 = () => (
    <div style={slideStyle}>
      <h1 style={{ fontSize: 40, fontWeight: 700, color: TEXT, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
        How do you plan to use TubeForge?
      </h1>
      <p style={{ fontSize: 16, color: SUB, textAlign: 'center', margin: '0 0 40px', lineHeight: 1.5 }}>
        This helps us personalize your experience
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Personal use */}
        <button
          type="button"
          style={cardStyle(answers.usage === 'personal')}
          onClick={() => setAnswers((a) => ({ ...a, usage: 'personal' }))}
        >
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <RadioIcon selected={answers.usage === 'personal'} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <SparkleIcon />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: TEXT, marginBottom: 6 }}>
            For personal use
          </div>
          <div style={{ fontSize: 14, color: SUB, lineHeight: 1.5 }}>
            For individual creators who want to grow their YouTube channel
          </div>
        </button>

        {/* Team */}
        <button
          type="button"
          style={cardStyle(answers.usage === 'team')}
          onClick={() => setAnswers((a) => ({ ...a, usage: 'team' }))}
        >
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <RadioIcon selected={answers.usage === 'team'} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <PeopleIcon />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: TEXT, marginBottom: 6 }}>
            With my team
          </div>
          <div style={{ fontSize: 14, color: SUB, lineHeight: 1.5 }}>
            For agencies and teams who collaborate on content at scale
          </div>
        </button>
      </div>

      <button
        type="button"
        style={continueBtn}
        disabled={!canContinue()}
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );

  const renderStep2 = () => {
    const goals = [
      { id: 'grow', label: 'Grow my channel', desc: 'Get more views, subscribers, and engagement' },
      { id: 'save-time', label: 'Save time on editing', desc: 'Speed up video creation with AI tools' },
      { id: 'thumbnails', label: 'Create better thumbnails', desc: 'Design click-worthy thumbnails that convert' },
      { id: 'seo', label: 'Optimize SEO', desc: 'Rank higher in YouTube search results' },
    ];

    return (
      <div style={slideStyle}>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: TEXT, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          What&apos;s your main goal?
        </h1>
        <p style={{ fontSize: 16, color: SUB, textAlign: 'center', margin: '0 0 40px', lineHeight: 1.5 }}>
          We&apos;ll tailor your dashboard and recommendations
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              style={cardStyle(answers.goal === g.id)}
              onClick={() => setAnswers((a) => ({ ...a, goal: g.id }))}
            >
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <RadioIcon selected={answers.goal === g.id} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: TEXT, marginBottom: 6 }}>
                {g.label}
              </div>
              <div style={{ fontSize: 14, color: SUB, lineHeight: 1.5 }}>
                {g.desc}
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          style={continueBtn}
          disabled={!canContinue()}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    );
  };

  const renderStep3 = () => {
    const frequencies = [
      { id: '1-2', label: '1-2 videos' },
      { id: '3-5', label: '3-5 videos' },
      { id: '6-10', label: '6-10 videos' },
      { id: '10+', label: '10+ videos' },
    ];

    return (
      <div style={slideStyle}>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: TEXT, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          How many videos do you publish per month?
        </h1>
        <p style={{ fontSize: 16, color: SUB, textAlign: 'center', margin: '0 0 40px', lineHeight: 1.5 }}>
          This helps us recommend the right plan for you
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {frequencies.map((f) => (
            <button
              key={f.id}
              type="button"
              style={pillStyle(answers.frequency === f.id)}
              onClick={() => setAnswers((a) => ({ ...a, frequency: f.id }))}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          style={continueBtn}
          disabled={!canContinue()}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    );
  };

  const renderStep4 = () => {
    const tools = [
      { id: 'vidiq', label: 'vidIQ' },
      { id: 'tubebuddy', label: 'TubeBuddy' },
      { id: 'canva', label: 'Canva' },
      { id: 'capcut', label: 'CapCut' },
      { id: 'invideo', label: 'InVideo' },
      { id: 'none', label: "None — I'm new!" },
    ];

    const selectedTools = answers.tools ?? [];

    const toggleTool = (id: string) => {
      setAnswers((a) => {
        const current = a.tools ?? [];
        if (id === 'none') {
          // Selecting "None" clears all others
          return { ...a, tools: current.includes('none') ? [] : ['none'] };
        }
        // Selecting a tool removes "None"
        const withoutNone = current.filter((t) => t !== 'none');
        if (withoutNone.includes(id)) {
          return { ...a, tools: withoutNone.filter((t) => t !== id) };
        }
        return { ...a, tools: [...withoutNone, id] };
      });
    };

    return (
      <div style={slideStyle}>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: TEXT, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          What tools have you tried before?
        </h1>
        <p style={{ fontSize: 16, color: SUB, textAlign: 'center', margin: '0 0 40px', lineHeight: 1.5 }}>
          Select all that apply
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {tools.map((t) => {
            const isSelected = selectedTools.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                style={{
                  ...cardStyle(isSelected),
                  padding: '16px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
                onClick={() => toggleTool(t.id)}
              >
                <CheckboxIcon checked={isSelected} />
                <span style={{ fontSize: 15, fontWeight: 500, color: isSelected ? TEXT : SUB }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          style={continueBtn}
          disabled={!canContinue()}
          onClick={handleContinue}
        >
          See my results
        </button>
      </div>
    );
  };

  /* ── Offer Page ─────────────────────────────────────────────────── */

  const renderOffer = () => (
    <div style={{ ...slideStyle, textAlign: 'center' }}>
      {/* Celebration */}
      <div style={{ fontSize: 56, marginBottom: 16 }} role="img" aria-label="celebration">
        {'\uD83C\uDF89'}
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 700, color: TEXT, margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
        Welcome to TubeForge!
      </h1>
      <p style={{ fontSize: 16, color: SUB, margin: '0 0 32px', lineHeight: 1.5 }}>
        Based on your answers, <strong style={{ color: TEXT }}>Pro plan</strong> is perfect for you
      </p>

      {/* Offer card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
          border: `1.5px solid ${ACCENT}`,
          borderRadius: 20,
          padding: '36px 32px',
          maxWidth: 420,
          margin: '0 auto 32px',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.15)',
            borderRadius: 50,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 700,
            color: ACCENT,
            letterSpacing: '0.05em',
            marginBottom: 20,
          }}
        >
          SPECIAL OFFER
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 4 }}>
          50% off your first month
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '16px 0' }}>
          <span style={{ fontSize: 28, color: DIM, textDecoration: 'line-through', fontWeight: 500 }}>
            $12
          </span>
          <span style={{ fontSize: 48, fontWeight: 800, color: TEXT, letterSpacing: '-0.03em' }}>
            $6
          </span>
          <span style={{ fontSize: 16, color: SUB, alignSelf: 'flex-end', paddingBottom: 8 }}>
            /month
          </span>
        </div>

        <div style={{ fontSize: 15, color: SUB, marginBottom: 24 }}>
          Save $6 today
        </div>

        {/* Countdown */}
        {countdown > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 50,
              padding: '8px 20px',
              marginBottom: 24,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke={SUB} strokeWidth="1.2" />
              <path d="M8 4v4.5l3 1.5" stroke={SUB} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 14, color: SUB, fontWeight: 500 }}>
              Offer expires in{' '}
              <span style={{ color: TEXT, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {formatCountdown(countdown)}
              </span>
            </span>
          </div>
        )}

        {countdown <= 0 && (
          <div style={{ fontSize: 14, color: 'rgba(255,100,100,0.8)', marginBottom: 24 }}>
            Offer expired
          </div>
        )}

        <button
          type="button"
          onClick={handleClaimOffer}
          disabled={countdown <= 0}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 12,
            border: 'none',
            background: countdown > 0
              ? `linear-gradient(135deg, ${ACCENT}, #8b5cf6)`
              : 'rgba(255,255,255,0.06)',
            color: countdown > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
            fontSize: 16,
            fontWeight: 700,
            cursor: countdown > 0 ? 'pointer' : 'default',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            boxShadow: countdown > 0 ? `0 4px 24px rgba(99,102,241,0.35)` : 'none',
          }}
        >
          Claim 50% Off{countdown > 0 ? ' \u2192' : ''}
        </button>
      </div>

      {/* Skip link */}
      <button
        type="button"
        onClick={handleSkipOffer}
        style={{
          background: 'none',
          border: 'none',
          color: DIM,
          fontSize: 14,
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: '8px 16px',
        }}
      >
        Skip for now{' \u2192'}
      </button>
    </div>
  );

  /* ── Main Render ────────────────────────────────────────────────── */

  const quizSteps = [renderStep1, renderStep2, renderStep3, renderStep4];
  const isQuizStep = step <= 3;

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Instrument Sans', 'Helvetica Neue', sans-serif",
        padding: '40px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Progress bar at top */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'rgba(255,255,255,0.04)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressWidth}%`,
            background: `linear-gradient(90deg, ${ACCENT}, #8b5cf6)`,
            transition: 'width 0.4s ease',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* Logo */}
      <div
        style={{
          position: 'fixed',
          top: 24,
          left: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 100,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 5v14l11-7L8 5z" fill="#fff" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: TEXT, letterSpacing: '-0.02em' }}>
          TubeForge
        </span>
      </div>

      {/* Skip button (quiz steps only) */}
      {isQuizStep && (
        <button
          type="button"
          onClick={handleSkip}
          style={{
            position: 'fixed',
            top: 28,
            right: 28,
            background: 'none',
            border: 'none',
            color: DIM,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            zIndex: 100,
            padding: '4px 8px',
          }}
        >
          Skip
        </button>
      )}

      {/* Content area */}
      <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
        {isQuizStep ? quizSteps[step]() : renderOffer()}
      </div>

      {/* Step dots + back button (quiz steps only) */}
      {isQuizStep && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 100,
          }}
        >
          {/* Back arrow */}
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: SUB,
                position: 'absolute',
                left: 28,
              }}
              aria-label="Go back"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: TOTAL_QUIZ_STEPS }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === step
                    ? ACCENT
                    : i < step
                      ? 'rgba(99,102,241,0.4)'
                      : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          h1 { font-size: 28px !important; }
        }
        @media (max-width: 480px) {
          h1 { font-size: 24px !important; }
        }
      `}</style>
    </div>
  );
}
