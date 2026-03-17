'use client';

import { useNotificationStore } from '@/stores/useNotificationStore';
import { Z_INDEX } from '@/lib/constants';
import { Toast } from './Toast';

export function ToastProvider() {
  const toasts = useNotificationStore((s) => s.toasts);
  const removeToast = useNotificationStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        aria-label="Уведомления"
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: Z_INDEX.TOAST,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </>
  );
}
