'use client';

import { useNotificationStore } from '@/stores/useNotificationStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { Z_INDEX } from '@/lib/constants';
import { Toast } from './Toast';

export function ToastProvider() {
  const toasts = useNotificationStore((s) => s.toasts);
  const removeToast = useNotificationStore((s) => s.removeToast);
  const t = useLocaleStore((s) => s.t);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 640px) {
          .tf-toast-container {
            top: auto !important;
            bottom: 16px !important;
            right: 16px !important;
            left: 16px !important;
            align-items: stretch !important;
          }
        }
      `}</style>
      <div
        className="tf-toast-container"
        role="status"
        aria-live={toasts.some((t) => t.type === 'error') ? 'assertive' : 'polite'}
        aria-label={t('toast.notifications')}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: Z_INDEX.TOAST,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'auto',
          alignItems: 'flex-end',
        }}
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </>
  );
}
