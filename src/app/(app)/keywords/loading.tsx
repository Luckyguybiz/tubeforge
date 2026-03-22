'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Keywords page loading skeleton */
export default function KeywordsLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 4px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Skeleton height={28} width={200} />
        <Skeleton height={14} width={340} style={{ marginTop: 8 }} />
      </div>

      {/* Search bar */}
      <Skeleton height={52} style={{ borderRadius: 12, marginBottom: 24 }} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        <Skeleton height={36} width={90} rounded />
        <Skeleton height={36} width={130} rounded />
        <Skeleton height={36} width={130} rounded />
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Left panel */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <Skeleton height={20} width="40%" />
          <Skeleton height={14} width="60%" />
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <Skeleton height={48} width="30%" />
            <Skeleton height={48} width="30%" />
            <Skeleton height={48} width="30%" />
          </div>
          <Skeleton height={16} width="30%" style={{ marginTop: 16 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <Skeleton height={16} width="50%" />
              <Skeleton height={16} width="20%" />
              <Skeleton height={16} width="15%" />
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Skeleton height={20} width="60%" />
          <div style={{ display: 'flex', gap: 4 }}>
            <Skeleton height={32} width="33%" rounded />
            <Skeleton height={32} width="33%" rounded />
            <Skeleton height={32} width="33%" rounded />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Skeleton width="55%" height={16} />
              <Skeleton width="20%" height={14} />
              <Skeleton width="20%" height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
