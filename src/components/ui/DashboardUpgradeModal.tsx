'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { Z_INDEX } from '@/lib/constants';

/* ── localStorage helpers (graceful fallback) ──────────── */

const STORAGE_KEY = 'tubeforge_upgrade_modal_seen';
const COUNTDOWN_KEY = 'tubeforge_upgrade_modal_deadline';

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Graceful fallback - modal may reappear on next visit */
  }
}

/* ── Countdown hook with persistent deadline ───────────── */

function useCountdown(deadlineMs: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadlineMs - Date.now()));

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, deadlineMs - Date.now());
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [deadlineMs, remaining]);

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return { hours, minutes, seconds, expired: remaining <= 0 };
}

/* ── Pricing data ──────────────────────────────────────── */

const PRICES = {
  monthly: { original: 19, discounted: 12 },
  yearly: { original: 190, discounted: 115 },
};

type Interval = 'monthly' | 'yearly';

/* ── Feature comparison ────────────────────────────────── */

const FEATURES: { name: string; free: boolean; pro: boolean }[] = [
  { name: 'Personalized Feed', free: false, pro: true },
  { name: 'Video Scoring', free: false, pro: true },
  { name: 'Keyword Research', free: false, pro: true },
  { name: 'Outliers', free: false, pro: true },
  { name: 'Browser Extension', free: true, pro: true },
];

/* ── Component ─────────────────────────────────────────── */

interface DashboardUpgradeModalProps {
  userPlan: string;
}

export function DashboardUpgradeModal({ userPlan }: DashboardUpgradeModalProps) {
  const [visible, setVisible] = useState(false);
  const [interval, setInterval] = useState<Interval>('monthly');
  const modalRef = useRef<HTMLDivElement>(null);
  const C = useThemeStore((s) => s.theme);

  /* ── Determine deadline (persisted to localStorage) ── */
  const [deadline] = useState<number>(() => {
    const stored = safeGetItem(COUNTDOWN_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!isNaN(parsed) && parsed > Date.now()) return parsed;
    }
    const newDeadline = Date.now() + 24 * 60 * 60 * 1000;
    safeSetItem(COUNTDOWN_KEY, String(newDeadline));
    return newDeadline;
  });

  const countdown = useCountdown(deadline);

  /* ── Show logic: only FREE users, only once ────────── */
  useEffect(() => {
    if (userPlan !== 'FREE') return;
    const seen = safeGetItem(STORAGE_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, [userPlan]);

  /* ── Escape key handler ────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /* ── Focus trap ────────────────────────────────────── */
  useEffect(() => {
    if (!visible || !modalRef.current) return;
    const modal = modalRef.current;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [visible]);

  /* ── Stripe checkout mutation ──────────────────────── */
  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url && data.url.startsWith('https://')) {
        window.location.href = data.url;
      } else if (data.updated) {
        toast.success('Plan updated!');
        dismiss();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  /* ── Dismiss logic (sets flag) ─────────────────────── */
  const dismiss = useCallback(() => {
    safeSetItem(STORAGE_KEY, '1');
    setVisible(false);
  }, []);

  /* ── Pay Now handler (sets flag + triggers checkout) ── */
  const handlePayNow = useCallback(() => {
    safeSetItem(STORAGE_KEY, '1');
    createCheckout.mutate({ plan: 'PRO', annual: interval === 'yearly' });
  }, [interval, createCheckout]);

  if (!visible) return null;

  const price = PRICES[interval];
  const pad2 = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: Z_INDEX.MODAL_BACKDROP,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade to Pro"
        data-testid="upgrade-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: Z_INDEX.MODAL_BACKDROP + 1,
          width: 'calc(100% - 32px)',
          maxWidth: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#1a1a2e',
          borderRadius: 20,
          padding: '28px 24px',
          boxSizing: 'border-box',
          color: '#fff',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close upgrade modal"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 16,
            fontFamily: 'inherit',
            lineHeight: 1,
          }}
        >
          &#x2715;
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>&#x1F680;</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
            Upgrade to Pro
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
            Unlock all premium features and grow your channel faster
          </p>
        </div>

        {/* Monthly / Yearly toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 20,
          gap: 0,
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: 3,
          }}>
            {(['monthly', 'yearly'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: interval === opt ? '#3b82f6' : 'transparent',
                  color: interval === opt ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                {opt === 'monthly' ? 'Monthly' : 'Yearly'}
                {opt === 'yearly' && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 10,
                    background: '#10b981',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 700,
                  }}>
                    SAVE 40%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
            <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.35)', fontSize: 18 }}>
              ${price.original}
            </span>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>
              ${price.discounted}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              /{interval === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
          {interval === 'yearly' && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
              ${(price.discounted / 12).toFixed(2)}/mo billed annually
            </p>
          )}
        </div>

        {/* Limited time promo badge with countdown */}
        {!countdown.expired && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
            padding: '10px 16px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 10,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
              Limited time promo
            </span>
            <span
              data-testid="countdown-timer"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                background: 'rgba(59,130,246,0.2)',
                padding: '3px 8px',
                borderRadius: 6,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pad2(countdown.hours)}h {pad2(countdown.minutes)}m {pad2(countdown.seconds)}s
            </span>
          </div>
        )}

        {/* Feature comparison */}
        <div style={{
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 50px 50px',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Feature
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'center' }}>
              Free
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'center' }}>
              Pro
            </span>
          </div>
          {/* Feature rows */}
          {FEATURES.map((feat, i) => (
            <div
              key={feat.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 50px 50px',
                padding: '9px 14px',
                borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {feat.name}
              </span>
              <span style={{ textAlign: 'center', fontSize: 14 }}>
                {feat.free ? (
                  <span style={{ color: '#10b981' }}>&#x2713;</span>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>&#x2014;</span>
                )}
              </span>
              <span style={{ textAlign: 'center', fontSize: 14 }}>
                <span style={{ color: '#10b981' }}>&#x2713;</span>
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          marginBottom: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            Total due today
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
            ${price.discounted}.00
          </span>
        </div>

        {/* Pay Now button */}
        <button
          onClick={handlePayNow}
          disabled={createCheckout.isPending}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: createCheckout.isPending
              ? 'rgba(59,130,246,0.5)'
              : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: createCheckout.isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
            transition: 'opacity 0.2s ease',
            boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
          }}
        >
          {createCheckout.isPending ? 'Processing...' : 'Pay Now'}
        </button>

        {/* Subtle note */}
        <p style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          marginTop: 12,
          marginBottom: 0,
          lineHeight: 1.4,
        }}>
          Secure checkout via Stripe. Cancel anytime.
        </p>
      </div>
    </>
  );
}
