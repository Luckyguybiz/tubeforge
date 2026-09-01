'use client';

import { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { Z_INDEX } from '@/lib/constants';

const LS_KEY = 'tf_upgrade_popup_shown';
const LS_TIMER_KEY = 'tf_upgrade_popup_deadline';
const PROMO_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours

const MONTHLY_PRICE = 12;
const YEARLY_PRICE = 115;
const MONTHLY_ORIGINAL = 19;
const YEARLY_ORIGINAL = 228;

interface FeatureRow {
  label: string;
  free: boolean;
  pro: boolean;
}

const FEATURES: FeatureRow[] = [
  { label: 'Personalized Feed', free: true, pro: true },
  { label: 'Video Scoring', free: false, pro: true },
  { label: 'Keyword Research', free: false, pro: true },
  { label: 'Outliers', free: false, pro: true },
];

function getDeadline(): number {
  if (typeof window === 'undefined') return Date.now() + PROMO_DURATION_MS;
  const stored = localStorage.getItem(LS_TIMER_KEY);
  if (stored) {
    const val = Number(stored);
    if (!isNaN(val) && val > 0) return val;
  }
  const deadline = Date.now() + PROMO_DURATION_MS;
  localStorage.setItem(LS_TIMER_KEY, String(deadline));
  return deadline;
}

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function UpgradePopupModal({ userPlan }: { userPlan: string }) {
  const [open, setOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const C = useThemeStore((s) => s.theme);

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url && data.url.startsWith('https://')) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // Show-once gate: only FREE users who haven't seen the popup
  useEffect(() => {
    if (userPlan !== 'FREE') return;
    const shown = localStorage.getItem(LS_KEY);
    if (shown === '1') return;
    // Small delay so dashboard renders first
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [userPlan]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    const deadline = getDeadline();
    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setTimeLeft('00:00:00');
        setExpired(true);
      } else {
        setTimeLeft(formatTime(remaining));
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    localStorage.setItem(LS_KEY, '1');
  }, []);

  const handlePay = useCallback(() => {
    localStorage.setItem(LS_KEY, '1');
    createCheckout.mutate({ plan: 'PRO', annual });
  }, [annual, createCheckout]);

  if (!open) return null;

  const price = annual ? YEARLY_PRICE : MONTHLY_PRICE;
  const originalPrice = annual ? YEARLY_ORIGINAL : MONTHLY_ORIGINAL;
  const perMonth = annual ? (YEARLY_PRICE / 12).toFixed(2) : null;

  return (
    <>
      <style>{`
        @keyframes tf-popup-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tf-popup-slide-up { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes tf-popup-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="tf-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: Z_INDEX.MODAL_BACKDROP,
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="tf-modal-dialog"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: Z_INDEX.MODAL_BACKDROP + 1,
          width: 'calc(100vw - 32px)',
          maxWidth: 480,
          maxHeight: 'calc(100dvh - 80px)',
          overflowY: 'auto',
          background: '#1a1a2e',
          borderRadius: 20,
          padding: '32px 24px 24px',
          boxSizing: 'border-box',
          color: '#fff',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            border: 'none',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
          }}
        >
          &#x2715;
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Upgrade to Pro
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Unlock all features and grow your channel faster
          </p>
        </div>

        {/* Monthly / Yearly toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: 3,
          }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: !annual ? '#3b82f6' : 'transparent',
                color: !annual ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: annual ? '#3b82f6' : 'transparent',
                color: annual ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
            <span style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.35)',
              textDecoration: 'line-through',
            }}>
              ${originalPrice}{annual ? '/yr' : '/mo'}
            </span>
            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }}>
              ${price}
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              {annual ? '/yr' : '/mo'}
            </span>
          </div>
          {perMonth && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              ${perMonth}/mo billed annually
            </div>
          )}
        </div>

        {/* Feature comparison table */}
        <div style={{
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 60px',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.04)',
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
          {/* Rows */}
          {FEATURES.map((row, i) => (
            <div key={row.label} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px 60px',
              padding: '9px 14px',
              borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{row.label}</span>
              <span style={{ textAlign: 'center', fontSize: 14 }}>
                {row.free
                  ? <span style={{ color: '#10b981' }}>&#x2713;</span>
                  : <span style={{ color: 'rgba(255,255,255,0.15)' }}>&#x2013;</span>
                }
              </span>
              <span style={{ textAlign: 'center', fontSize: 14 }}>
                <span style={{ color: '#10b981' }}>&#x2713;</span>
              </span>
            </div>
          ))}
        </div>

        {/* Promo badge with timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 20,
          padding: '10px 16px',
          background: 'rgba(59,130,246,0.1)',
          borderRadius: 10,
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}>
            Limited time promo
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: expired ? '#ef4444' : '#fff',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {expired ? 'Offer expired' : timeLeft}
          </span>
        </div>

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          padding: '0 4px',
        }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            Total due today
          </span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>
            ${price}
          </span>
        </div>

        {/* Pay Now button */}
        <button
          onClick={handlePay}
          disabled={createCheckout.isPending}
          style={{
            width: '100%',
            padding: '14px 32px',
            borderRadius: 12,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: createCheckout.isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
            transition: 'background 0.2s ease',
          }}
        >
          {createCheckout.isPending ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'tf-popup-spin 0.8s linear infinite',
              }} />
              Processing...
            </span>
          ) : 'Pay Now'}
        </button>
      </div>
    </>
  );
}
