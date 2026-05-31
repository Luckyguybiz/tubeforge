'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Jobs timeline skeleton — header chips + row list */
export default function JobsLoading() {
  const C = useThemeStore((s) => s.theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 4 }}>
      <div>
        <Skeleton height={28} width={220} />
        <Skeleton height={14} width={300} style={{ marginTop: 8 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={32} width={90} rounded />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Skeleton height={72} width={120} />
          <div style={{ flex: 1 }}>
            <Skeleton height={16} width="60%" />
            <Skeleton height={12} width="40%" style={{ marginTop: 6 }} />
          </div>
          <Skeleton height={24} width={80} rounded />
        </div>
      ))}
    </div>
  );
}
