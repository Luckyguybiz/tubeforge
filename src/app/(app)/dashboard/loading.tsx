'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Dashboard skeleton: stat cards + project list */
export default function DashboardLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Skeleton height={28} width={220} />
          <Skeleton height={14} width={300} style={{ marginTop: 8 }} />
        </div>
        <Skeleton height={38} width={140} rounded />
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <Skeleton height={10} width={60} />
          </div>
        ))}
      </div>

      {/* Section heading */}
      <Skeleton height={20} width={180} style={{ marginTop: 8 }} />

      {/* Project cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Skeleton height={48} width={72} rounded />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton height={14} width={`${60 - i * 10}%`} />
              <Skeleton height={10} width={`${40 - i * 5}%`} />
            </div>
            <Skeleton height={28} width={72} rounded />
          </div>
        ))}
      </div>
    </div>
  );
}
