'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Calendar skeleton — header + month grid */
export default function CalendarLoading() {
  const C = useThemeStore((s) => s.theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Skeleton height={28} width={220} />
          <Skeleton height={14} width={320} style={{ marginTop: 8 }} />
        </div>
        <Skeleton height={36} width={120} rounded />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, minHeight: 88 }}>
            <Skeleton height={14} width={28} />
          </div>
        ))}
      </div>
    </div>
  );
}
