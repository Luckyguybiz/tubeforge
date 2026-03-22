'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Media library skeleton: header + grid of media cards */
export default function MediaLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Skeleton height={28} width={180} />
          <Skeleton height={14} width={240} style={{ marginTop: 8 }} />
        </div>
        <Skeleton height={38} width={120} rounded />
      </div>

      {/* Media grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <Skeleton height={120} />
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton height={13} width={`${80 - i * 8}%`} />
              <Skeleton height={10} width={60} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
