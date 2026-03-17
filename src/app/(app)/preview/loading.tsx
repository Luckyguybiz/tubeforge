'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Preview page skeleton: video player + info */
export default function PreviewLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={240} />
        <Skeleton height={14} width={320} style={{ marginTop: 8 }} />
      </div>

      {/* Video player area */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <Skeleton width="100%" height={420} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Skeleton height={40} width={130} rounded />
        <Skeleton height={40} width={130} rounded />
        <div style={{ flex: 1 }} />
        <Skeleton height={40} width={100} rounded />
      </div>
    </div>
  );
}
