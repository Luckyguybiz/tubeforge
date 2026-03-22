'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** AI Thumbnails page loading skeleton */
export default function AiThumbnailsLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', gap: 20, padding: 20, minHeight: '80vh' }}>
      {/* Left panel skeleton */}
      <div
        style={{
          width: '30%',
          minWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
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
          <Skeleton height={36} width="60%" />
          <Skeleton height={120} width="100%" />
          <Skeleton height={36} width="100%" />
        </div>
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
          <Skeleton height={14} width={80} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={36} width={90} rounded />
            ))}
          </div>
        </div>
        <Skeleton height={48} width="100%" rounded />
      </div>

      {/* Right panel skeleton */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Skeleton height={64} width={64} rounded />
            <Skeleton height={16} width={240} style={{ marginTop: 16 }} />
            <Skeleton height={12} width={180} style={{ marginTop: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
