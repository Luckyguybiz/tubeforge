/**
 * QA STUB - Dashboard Upgrade Modal
 *
 * This is a minimal test-contract stub created by QA team.
 * The dev team (Макс/Clio) will replace this with the full implementation.
 *
 * Contract requirements:
 * - Show upgrade modal only once per user (localStorage flag: tubeforge_upgrade_modal_seen)
 * - Monthly/Yearly toggle with pricing
 * - Countdown timer with "Limited time promo" badge
 * - Feature comparison: Free vs Pro
 * - Pay Now -> Stripe checkout (via trpc billing.createCheckout)
 * - Close button (X) with dark overlay
 * - Dark theme, rounded corners, blue accent CTA
 * - Responsive: mobile 375px+, tablet 768px+
 *
 * TODO(dev): Replace this stub with the full component implementation.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';

const STORAGE_KEY = 'tubeforge_upgrade_modal_seen';

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
    // Graceful fallback: localStorage unavailable (private browsing, etc.)
  }
}

type BillingInterval = 'monthly' | 'yearly';

const FEATURES = [
  { name: 'Personalized Feed', free: false, pro: true },
  { name: 'Video Scoring', free: false, pro: true },
  { name: 'Keyword Research', free: true, pro: true },
  { name: 'Outliers', free: false, pro: true },
  { name: 'Browser Extension', free: true, pro: true },
];

const PRICES = {
  monthly: { original: 29, discounted: 19 },
  yearly: { original: 290, discounted: 149 },
};

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(() => {
    const diff = targetMs - Date.now();
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1000;
        return next > 0 ? next : 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return {
    hours,
    minutes,
    seconds,
    display: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    expired: remaining <= 0,
  };
}

export function DashboardUpgradeModal() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [visible, setVisible] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const mountedRef = useRef(false);

  const countdown = useCountdown(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const seen = safeGetItem(STORAGE_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    safeSetItem(STORAGE_KEY, '1');
  }, []);

  const handlePayNow = useCallback(() => {
    safeSetItem(STORAGE_KEY, '1');
    const plan = interval === 'yearly' ? 'PRO' : 'PRO';
    createCheckout.mutate({ plan });
  }, [interval, createCheckout]);

  if (!visible) return null;

  const price = PRICES[interval];

  return (
    <>
      {/* Overlay */}
      <div
        data-testid="modal-overlay"
        className="tf-modal-backdrop"
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 9998,
        }}
      />
      {/* Modal */}
      <div
        data-testid="upgrade-modal"
        className="tf-modal-dialog"
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '24px 20px',
          maxWidth: 480,
          width: 'calc(100% - 32px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 9999,
          boxSizing: 'border-box',
        }}
      >
        {/* Close button */}
        <button
          aria-label="Close"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: C.sub,
            fontSize: 20,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          X
        </button>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, textAlign: 'center', margin: '0 0 16px' }}>
          {t('upgradeModal.title')}
        </h2>

        {/* Monthly/Yearly toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <button
            aria-pressed={interval === 'monthly'}
            data-active={interval === 'monthly'}
            onClick={() => setInterval('monthly')}
            className={interval === 'monthly' ? 'active' : ''}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: `1px solid ${interval === 'monthly' ? C.accent : C.border}`,
              background: interval === 'monthly' ? C.accent : 'transparent',
              color: interval === 'monthly' ? '#fff' : C.sub,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t('upgradeModal.monthly')}
          </button>
          <button
            aria-pressed={interval === 'yearly'}
            data-active={interval === 'yearly'}
            onClick={() => setInterval('yearly')}
            className={interval === 'yearly' ? 'active' : ''}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: `1px solid ${interval === 'yearly' ? C.accent : C.border}`,
              background: interval === 'yearly' ? C.accent : 'transparent',
              color: interval === 'yearly' ? '#fff' : C.sub,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t('upgradeModal.yearly')}
          </button>
        </div>

        {/* Pricing */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <s style={{ color: C.dim, fontSize: 16 }}>${price.original}</s>
          <span style={{ color: C.text, fontSize: 28, fontWeight: 700, marginLeft: 8 }}>
            ${price.discounted}
          </span>
          <span style={{ color: C.sub, fontSize: 13 }}>/{interval === 'yearly' ? 'yr' : 'mo'}</span>
        </div>

        {/* Promo badge with countdown */}
        <div style={{
          background: C.surface,
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 16,
          textAlign: 'center',
          border: `1px solid ${C.border}`,
        }}>
          <span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>
            {t('upgradeModal.promo')}
          </span>
          <div data-testid="countdown-timer" style={{ color: C.text, fontSize: 18, fontWeight: 600, marginTop: 4 }}>
            {countdown.display}
          </div>
        </div>

        {/* Feature comparison */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 50px 50px',
            padding: '6px 0',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.dim }}></span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textAlign: 'center' }}>{t('upgradeModal.free')}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textAlign: 'center' }}>{t('upgradeModal.pro')}</span>
          </div>
          {FEATURES.map((f) => (
            <div key={f.name} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 50px 50px',
              padding: '8px 0',
              borderBottom: `1px solid ${C.border}22`,
            }}>
              <span style={{ fontSize: 13, color: C.text }}>{f.name}</span>
              <span
                data-check={String(f.free)}
                aria-label={f.free ? 'included in free' : 'not included in free'}
                style={{ textAlign: 'center', color: f.free ? '#22c55e' : C.dim }}
              >
                {f.free ? '\u2713' : '\u2717'}
              </span>
              <span
                data-check={String(f.pro)}
                aria-label={f.pro ? 'included in pro' : 'not included in pro'}
                style={{ textAlign: 'center', color: f.pro ? '#22c55e' : C.dim }}
              >
                {f.pro ? '\u2713' : '\u2717'}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ textAlign: 'center', marginBottom: 16, color: C.sub, fontSize: 13 }}>
          {t('upgradeModal.total')}: <strong style={{ color: C.text }}>${price.discounted}</strong>
        </div>

        {/* Pay Now button */}
        <button
          onClick={handlePayNow}
          disabled={createCheckout.isPending}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 10,
            border: 'none',
            background: C.accent,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: createCheckout.isPending ? 'wait' : 'pointer',
            minHeight: 48,
          }}
        >
          {t('upgradeModal.payNow')}
        </button>
      </div>
    </>
  );
}
