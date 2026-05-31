'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Autopilot skeleton — health gauge + heatmap + recommendations */
export default function AutopilotLoading() {
  const C = useThemeStore((s) => s.theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Skeleton height={28} width={260} />
          <Skeleton height={14} width={380} style={{ marginTop: 8 }} />
        </div>
        <Skeleton height={36} width={120} rounded />
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
        <Skeleton height={16} width={140} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, marginTop: 16 }}>
          {Array.from({ length: 24 * 7 }).map((_, i) => (
            <Skeleton key={i} height={18} />
          ))}
        </div>
      </div>
    </div>
  );
}
