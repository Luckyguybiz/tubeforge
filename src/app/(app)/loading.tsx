'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** App layout loading skeleton with animated shimmer */
export default function AppLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header area */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={28} width={220} />
          <Skeleton height={14} width={320} />
        </div>
        <Skeleton height={38} width={130} rounded />
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 4,
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
              gap: 12,
            }}
          >
            <Skeleton height={12} width={80} />
            <Skeleton height={24} width={100} />
            <Skeleton height={10} width={60} />
          </div>
        ))}
      </div>

      {/* Content rows */}
      <div style={{ marginTop: 4 }}>
        <Skeleton height={20} width={160} style={{ marginBottom: 16 }} />
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
              <Skeleton height={40} width={40} rounded />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton height={14} width={`${60 - i * 10}%`} />
                <Skeleton height={10} width={`${40 - i * 5}%`} />
              </div>
              <Skeleton height={28} width={72} rounded />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
