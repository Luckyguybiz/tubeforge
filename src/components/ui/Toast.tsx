'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import type { ToastType } from '@/stores/useNotificationStore';

const ICONS: Record<ToastType, string> = {
  success: '\u2713',
  error: '\u2715',
  info: '\u2139',
  warning: '\u26A0',
};

/** Fixed toast type colors per spec — not theme-dependent */
const TYPE_COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#6366f1',
};

export function Toast({
  id,
  type,
  message,
  onClose,
}: {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const color = TYPE_COLORS[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 18px',
        background: '#fff',
        border: `1px solid rgba(0,0,0,0.06)`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 14,
        minWidth: 0,
        width: 'calc(100vw - 32px)',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04)',
        animation: 'toastSlideIn .3s cubic-bezier(.2,.8,.4,1)',
        fontFamily: 'var(--font-sans), sans-serif',
        backdropFilter: 'blur(20px)',
      }}
    >
      <span style={{ color, fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
        {ICONS[type]}
      </span>
      <span style={{ color: C.text, fontSize: 13, flex: 1, lineHeight: 1.4, wordBreak: 'break-word', overflow: 'hidden' }}>
        {message}
      </span>
      <button
        onClick={() => onClose(id)}
        aria-label={t('toast.close')}
        style={{
          background: 'none',
          border: 'none',
          color: C.sub,
          cursor: 'pointer',
          fontSize: 14,
          padding: 4,
          flexShrink: 0,
          minWidth: 32,
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {'\u2715'}
      </button>
    </div>
  );
}
