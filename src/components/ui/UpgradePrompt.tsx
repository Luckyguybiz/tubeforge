'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

export function UpgradePrompt({ feature }: { feature: string }) {
  const C = useThemeStore((s) => s.theme);
  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url && data.url.startsWith('https://')) {
        window.location.href = data.url;
      } else {
        toast.error('Не удалось создать сессию оплаты');
      }
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 24,
      textAlign: 'center',
      maxWidth: 400,
      margin: '0 auto',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.6 }}>&#x1F512;</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        Лимит {feature} исчерпан
      </h3>
      <p style={{ color: C.sub, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
        Обновите план для продолжения работы
      </p>
      <button
        onClick={() => createCheckout.mutate({ plan: 'PRO' })}
        disabled={createCheckout.isPending}
        style={{
          padding: '12px 32px',
          borderRadius: 10,
          border: 'none',
          background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: createCheckout.isPending ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: `0 4px 20px ${C.accent}33`,
        }}
      >
        {createCheckout.isPending ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Загрузка...
          </span>
        ) : 'Обновить до Pro'}
      </button>
    </div>
    </>
  );
}
