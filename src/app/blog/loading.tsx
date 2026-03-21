'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Blog page loading skeleton */
export default function BlogLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Header skeleton */}
      <div
        style={{
          padding: '48px 24px 32px',
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Skeleton height={32} width={280} />
        <Skeleton height={14} width={420} />
      </div>

      {/* Category pills skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          padding: '0 24px 32px',
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={32} width={80 + i * 12} rounded />
        ))}
      </div>

      {/* Blog cards grid skeleton */}
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '0 24px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {/* Image placeholder */}
            <Skeleton height={160} width="100%" style={{ borderRadius: 0 }} />
            {/* Content */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton height={10} width={60} />
              <Skeleton height={18} width="90%" />
              <Skeleton height={12} width="100%" />
              <Skeleton height={12} width="75%" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Skeleton height={10} width={80} />
                <Skeleton height={10} width={50} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
