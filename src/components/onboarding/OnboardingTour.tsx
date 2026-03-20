'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { Z_INDEX } from '@/lib/constants';

/* ── Step definitions ──────────────────────────────────────────────── */

type TargetSelector = string | null;
type TooltipPosition = 'center' | 'right' | 'bottom' | 'bottom-right';

interface TourStepDef {
  titleKey: string;
  descKey: string;
  /** CSS selector for the element to spotlight. null = centered modal */
  target: TargetSelector;
  /** Where to position the tooltip relative to the target */
  tooltipPos: TooltipPosition;
  /** Icon shown in the step header */
  icon: string;
}

const STEP_DEFS: TourStepDef[] = [
  {
    titleKey: 'onboarding.welcomeTitle',
    descKey: 'onboarding.welcomeDesc',
    target: null,
    tooltipPos: 'center',
    icon: 'wave',
  },
  {
    titleKey: 'onboarding.sidebarTitle',
    descKey: 'onboarding.sidebarDesc',
    target: 'nav[aria-label="Main navigation"]',
    tooltipPos: 'right',
    icon: 'sidebar',
  },
  {
    titleKey: 'onboarding.newProjectTitle',
    descKey: 'onboarding.newProjectDesc',
    target: '[data-tour="new-project"]',
    tooltipPos: 'bottom',
    icon: 'project',
  },
  {
    titleKey: 'onboarding.toolsTitle',
    descKey: 'onboarding.toolsDesc',
    target: '[data-tour="tools-section"]',
    tooltipPos: 'right',
    icon: 'tools',
  },
  {
    titleKey: 'onboarding.billingTitle',
    descKey: 'onboarding.billingDesc',
    target: '[data-tour="billing-section"]',
    tooltipPos: 'right',
    icon: 'billing',
  },
  {
    titleKey: 'onboarding.doneTitle',
    descKey: 'onboarding.doneDesc',
    target: null,
    tooltipPos: 'center',
    icon: 'done',
  },
];

/* ── Step icons (inline SVGs) ──────────────────────────────────────── */

function StepIcon({ icon, color }: { icon: string; color: string }) {
  const size = 28;
  const svgProps = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' };

  switch (icon) {
    case 'wave':
      return (
        <svg {...svgProps}>
          <path d="M7 15c-1-1-2-3-2-5s1-4 3-4 3 2 3 2l1-1c0 0 1-2 3-2s3 2 3 4-1 4-2 5l-4 4-5-3z" fill={color} opacity=".85" />
          <circle cx="12" cy="7" r="2" fill={color} opacity=".4" />
        </svg>
      );
    case 'sidebar':
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5" opacity=".4" />
          <rect x="3" y="3" width="7" height="18" rx="3" fill={color} opacity=".85" />
        </svg>
      );
    case 'project':
      return (
        <svg {...svgProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.5" opacity=".4" />
          <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'tools':
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="7" height="7" rx="2" fill={color} opacity=".85" />
          <rect x="14" y="3" width="7" height="7" rx="2" fill={color} opacity=".5" />
          <rect x="3" y="14" width="7" height="7" rx="2" fill={color} opacity=".5" />
          <rect x="14" y="14" width="7" height="7" rx="2" fill={color} opacity=".35" />
        </svg>
      );
    case 'billing':
      return (
        <svg {...svgProps}>
          <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.5" opacity=".85" />
          <path d="M2 10h20" stroke={color} strokeWidth="1.5" opacity=".5" />
          <rect x="5" y="13" width="6" height="2.5" rx="1" fill={color} opacity=".4" />
        </svg>
      );
    case 'done':
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="9" fill={color} opacity=".15" />
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" opacity=".85" />
          <path d="M8 12.5l2.5 2.5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Onboarding event name for external triggers ───────────────────── */

export const ONBOARDING_REPLAY_EVENT = 'tubeforge:replay-onboarding';

/* ── Main component ────────────────────────────────────────────────── */

export function OnboardingTour() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
  const { data: session } = useSession();

  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Fetch profile to check onboardingDone flag
  const profile = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });
  const completeOnboarding = trpc.user.completeOnboarding.useMutation();

  // Show tour if user has not completed onboarding
  useEffect(() => {
    if (profile.data && !profile.data.onboardingDone) {
      setVisible(true);
      setStep(0);
    }
  }, [profile.data]);

  // Listen for replay event from settings page
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setVisible(true);
    };
    window.addEventListener(ONBOARDING_REPLAY_EVENT, handler);
    return () => window.removeEventListener(ONBOARDING_REPLAY_EVENT, handler);
  }, []);

  // Compute target element rect when step changes
  useEffect(() => {
    if (!visible) return;
    const def = STEP_DEFS[step];
    if (!def?.target) {
      setTargetRect(null);
      return;
    }
    // Small delay to allow DOM to settle
    const timer = setTimeout(() => {
      const el = document.querySelector(def.target!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [step, visible]);

  // Update rect on resize
  useEffect(() => {
    if (!visible) return;
    const handler = () => {
      const def = STEP_DEFS[step];
      if (def?.target) {
        const el = document.querySelector(def.target);
        if (el) setTargetRect(el.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [step, visible]);

  const complete = useCallback(() => {
    setVisible(false);
    completeOnboarding.mutate();
  }, [completeOnboarding]);

  const next = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setStep((s) => {
      if (s < STEP_DEFS.length - 1) return s + 1;
      complete();
      return s;
    });
  }, [complete]);

  const prev = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { skip(); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter') { next(); return; }
      if (e.key === 'ArrowLeft') { prev(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, next, prev, skip]);

  if (!visible) return null;

  const currentDef = STEP_DEFS[step];
  const userName = session?.user?.name ?? 'Creator';
  const totalSteps = STEP_DEFS.length;
  const isCenter = !currentDef.target || !targetRect;

  // Interpolate {name} placeholder in title
  const title = t(currentDef.titleKey).replace('{name}', userName);
  const description = t(currentDef.descKey);
  const stepLabel = t('onboarding.stepOf')
    .replace('{current}', String(step + 1))
    .replace('{total}', String(totalSteps));

  /* ── Spotlight cutout padding ───────────────────────────────────── */
  const PAD = 8;
  const RADIUS = 12;

  /* ── Tooltip position calculation ───────────────────────────────── */
  const getTooltipStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: Z_INDEX.ONBOARDING_SPOTLIGHT,
      background: isDark
        ? 'linear-gradient(135deg, rgba(16,16,28,.98), rgba(12,12,20,.99))'
        : 'linear-gradient(135deg, rgba(255,255,255,.99), rgba(248,248,252,.99))',
      border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : C.border}`,
      borderRadius: 20,
      padding: 28,
      width: 'calc(100vw - 32px)',
      maxWidth: 400,
      boxShadow: isDark
        ? '0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04) inset'
        : '0 24px 80px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.04)',
      backdropFilter: 'blur(20px)',
      transition: isAnimating ? 'all .3s cubic-bezier(.4,0,.2,1)' : 'none',
    };

    if (isCenter) {
      return {
        ...base,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    if (!targetRect) return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    switch (currentDef.tooltipPos) {
      case 'right':
        return {
          ...base,
          top: Math.max(20, Math.min(targetRect.top, window.innerHeight - 380)),
          left: targetRect.right + 20,
        };
      case 'bottom':
        return {
          ...base,
          top: targetRect.bottom + 16,
          left: Math.max(20, targetRect.left),
        };
      case 'bottom-right':
        return {
          ...base,
          top: targetRect.bottom + 16,
          left: targetRect.right - 400,
        };
      default:
        return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  /* ── Tooltip arrow ──────────────────────────────────────────────── */
  const getArrowStyle = (): React.CSSProperties | null => {
    if (isCenter || !targetRect) return null;

    const arrowBase: React.CSSProperties = {
      position: 'absolute',
      width: 14,
      height: 14,
      background: isDark ? 'rgba(16,16,28,.98)' : 'rgba(255,255,255,.99)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : C.border}`,
      transform: 'rotate(45deg)',
      zIndex: -1,
    };

    switch (currentDef.tooltipPos) {
      case 'right':
        return {
          ...arrowBase,
          left: -8,
          top: Math.min(
            Math.max(20, targetRect.top + targetRect.height / 2 - Math.max(20, Math.min(targetRect.top, window.innerHeight - 380)) - 7),
            340,
          ),
          borderRight: 'none',
          borderTop: 'none',
        };
      case 'bottom':
        return {
          ...arrowBase,
          top: -8,
          left: Math.min(targetRect.width / 2, 60),
          borderBottom: 'none',
          borderRight: 'none',
        };
      case 'bottom-right':
        return {
          ...arrowBase,
          top: -8,
          right: 30,
          borderBottom: 'none',
          borderRight: 'none',
        };
      default:
        return null;
    }
  };

  const btnBase: React.CSSProperties = {
    padding: '10px 22px',
    borderRadius: 10,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .2s cubic-bezier(.4,0,.2,1)',
    letterSpacing: '-.01em',
  };

  const tooltipStyle = getTooltipStyle();
  const arrowStyle = getArrowStyle();

  /* ── Spotlight clip-path (polygon with cutout) ──────────────────── */
  const spotlightClipPath = targetRect
    ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${targetRect.left - PAD}px ${targetRect.top - PAD}px,
        ${targetRect.left - PAD}px ${targetRect.bottom + PAD}px,
        ${targetRect.right + PAD}px ${targetRect.bottom + PAD}px,
        ${targetRect.right + PAD}px ${targetRect.top - PAD}px,
        ${targetRect.left - PAD}px ${targetRect.top - PAD}px
      )`
    : undefined;

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z_INDEX.ONBOARDING_OVERLAY,
          background: 'rgba(0,0,0,.6)',
          ...(spotlightClipPath ? { clipPath: spotlightClipPath } : {}),
          transition: 'clip-path .4s cubic-bezier(.4,0,.2,1)',
        }}
        onClick={(e) => e.target === e.currentTarget && skip()}
      />

      {/* Spotlight border glow around target */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            zIndex: Z_INDEX.ONBOARDING_OVERLAY,
            top: targetRect.top - PAD,
            left: targetRect.left - PAD,
            width: targetRect.width + PAD * 2,
            height: targetRect.height + PAD * 2,
            borderRadius: RADIUS,
            border: `2px solid ${C.accent}`,
            boxShadow: `0 0 20px ${C.accent}33, 0 0 40px ${C.accent}11`,
            pointerEvents: 'none',
            transition: 'all .4s cubic-bezier(.4,0,.2,1)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        style={tooltipStyle}
      >
        {/* Arrow */}
        {arrowStyle && <div style={arrowStyle} aria-hidden="true" />}

        {/* Step icon + counter header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${C.accent}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StepIcon icon={currentDef.icon} color={C.accent} />
            </div>
            <span style={{ fontSize: 12, color: C.sub, fontWeight: 600, letterSpacing: '.02em' }}>
              {stepLabel}
            </span>
          </div>

          {/* Close (X) button */}
          <button
            onClick={skip}
            aria-label={t('onboarding.skip')}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
              color: C.dim,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontFamily: 'inherit',
              transition: 'all .15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Step indicator dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
          {STEP_DEFS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 28 : 8,
                height: 6,
                borderRadius: 3,
                background: i === step
                  ? `linear-gradient(90deg, ${C.accent}, ${C.pink ?? C.accent})`
                  : i < step
                    ? `${C.accent}40`
                    : isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
                transition: 'all .3s cubic-bezier(.4,0,.2,1)',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <h2
          id="onboarding-title"
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 8,
            color: C.text,
            letterSpacing: '-.02em',
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.65,
            color: C.sub,
            marginBottom: 24,
            marginTop: 8,
          }}
        >
          {description}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={skip}
            style={{
              ...btnBase,
              background: 'transparent',
              color: C.dim,
              padding: '10px 14px',
            }}
          >
            {t('onboarding.skip')}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={prev}
                style={{
                  ...btnBase,
                  background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
                  color: C.sub,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : C.border}`,
                }}
              >
                {t('onboarding.back')}
              </button>
            )}
            <button
              onClick={next}
              style={{
                ...btnBase,
                background: step === totalSteps - 1
                  ? `linear-gradient(135deg, ${C.accent}, ${C.pink ?? C.accent})`
                  : C.accent,
                color: '#fff',
                boxShadow: `0 4px 12px ${C.accent}33`,
              }}
            >
              {step < totalSteps - 1 ? t('onboarding.next') : t('onboarding.start')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
