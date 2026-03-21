'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

function getContextMessage(feature: string, t: (key: string) => string, projectCount?: number): string {
  switch (feature) {
    case 'projects':
      return (t('upgrade.contextProjects') || '').replace('{count}', String(projectCount ?? 3));
    case 'ai':
      return t('upgrade.contextAi') || '';
    case 'scenes':
      return t('upgrade.contextScenes') || '';
    default:
      return t('upgrade.upgradeDesc');
  }
}

export function UpgradePrompt({ feature, projectCount }: { feature: string; projectCount?: number }) {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url && data.url.startsWith('https://')) {
        window.location.href = data.url;
      } else {
        toast.error(t('upgrade.checkoutError'));
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const contextMessage = getContextMessage(feature, t, projectCount);

  const compareRows = [
    { label: t('upgrade.compareProjects'), free: t('upgrade.freeProjects'), pro: t('upgrade.proProjects') },
    { label: t('upgrade.compareAi'), free: t('upgrade.freeAi'), pro: t('upgrade.proAi') },
    { label: t('upgrade.compareExport'), free: t('upgrade.freeExport'), pro: t('upgrade.proExport') },
    { label: t('upgrade.compareWatermark'), free: t('upgrade.freeWatermark'), pro: t('upgrade.proWatermark') },
  ];

  return (
    <>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '24px 20px',
      textAlign: 'center',
      maxWidth: 440,
      width: 'calc(100% - 32px)',
      margin: '0 auto',
      boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.6 }}>&#x1F512;</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        {t('upgrade.limitReached').replace('{feature}', feature)}
      </h3>
      <p style={{ color: C.sub, fontSize: 13, marginBottom: 16, lineHeight: 1.6, wordBreak: 'break-word' }}>
        {contextMessage}
      </p>

      {/* Mini comparison table */}
      <div style={{
        borderRadius: 10,
        border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`,
        overflow: 'hidden',
        marginBottom: 20,
        textAlign: 'left',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 70px 70px',
          padding: '8px 12px',
          background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            {t('upgrade.compareTitle')}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'center' }}>
            {t('upgrade.compareFree')}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'center' }}>
            {t('upgrade.comparePro')}
          </span>
        </div>
        {/* Rows */}
        {compareRows.map((row, i) => (
          <div key={row.label} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 70px 70px',
            padding: '7px 12px',
            borderBottom: i < compareRows.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'}` : 'none',
          }}>
            <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{row.label}</span>
            <span style={{ fontSize: 12, color: C.dim, textAlign: 'center' }}>{row.free}</span>
            <span style={{ fontSize: 12, color: C.text, fontWeight: 600, textAlign: 'center' }}>{row.pro}</span>
          </div>
        ))}
      </div>

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
          minHeight: 44,
          width: '100%',
          maxWidth: 280,
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
            {t('upgrade.loading')}
          </span>
        ) : t('upgrade.upgradeToPro')}
      </button>
    </div>
    </>
  );
}
