'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Shorts Analytics skeleton: stat cards + chart + table */
export default function ShortsAnalyticsLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={220} />
        <Skeleton height={14} width={280} style={{ marginTop: 8 }} />
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <Skeleton height={12} width={80} />
            <Skeleton height={26} width={100} />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 24,
          height: 240,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${25 + Math.abs(3 - i) * 12}%`}
            rounded
          />
        ))}
      </div>
    </div>
  );
}
