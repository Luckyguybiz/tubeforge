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

  const colorMap: Record<ToastType, string> = {
    success: C.green,
    error: C.accent,
    info: C.blue,
    warning: C.orange,
  };

  const color = colorMap[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        minWidth: 0,
        width: 'calc(100vw - 32px)',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,.3)',
        animation: 'toastSlideIn .25s ease-out',
        fontFamily: 'var(--font-sans), sans-serif',
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
