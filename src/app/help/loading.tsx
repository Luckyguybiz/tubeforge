'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Help center loading skeleton */
export default function HelpLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Header skeleton */}
      <div
        style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Skeleton height={32} width={140} rounded />
        <Skeleton height={32} width={100} rounded />
      </div>

      {/* Hero / search section skeleton */}
      <div
        style={{
          padding: '48px 24px 32px',
          maxWidth: 700,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Skeleton height={28} width={240} />
        <Skeleton height={14} width={360} />
        <Skeleton height={42} width="100%" rounded style={{ maxWidth: 480, marginTop: 8 }} />
      </div>

      {/* Category tabs skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          padding: '0 24px 24px',
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={34} width={90 + i * 8} rounded />
        ))}
      </div>

      {/* Articles list skeleton */}
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto',
          padding: '0 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
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
            <Skeleton height={36} width={36} rounded />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton height={14} width={`${70 - i * 4}%`} />
              <Skeleton height={10} width={`${50 - i * 3}%`} />
            </div>
            <Skeleton height={20} width={20} rounded />
          </div>
        ))}
      </div>
    </div>
  );
}
