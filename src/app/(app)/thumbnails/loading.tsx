'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Thumbnail editor skeleton: toolbar + canvas + sidebar */
export default function ThumbnailsLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', gap: 12, height: '80vh' }}>
      {/* Tool sidebar */}
      <div
        style={{
          width: 56,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '10px 8px',
          alignItems: 'center',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={38} width={38} rounded />
        ))}
      </div>

      {/* Canvas area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
        }}
      >
        <Skeleton width="80%" height="70%" rounded />
      </div>

      {/* Properties sidebar */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Skeleton height={36} />
        <div style={{ height: 1, background: C.border, margin: '2px 0' }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton height={10} width={60} style={{ marginBottom: 6 }} />
            <Skeleton height={36} />
          </div>
        ))}
      </div>
    </div>
  );
}
