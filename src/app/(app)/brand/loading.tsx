'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Brand page skeleton: logo area + color palette + typography */
export default function BrandLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={160} />
        <Skeleton height={14} width={300} style={{ marginTop: 8 }} />
      </div>

      {/* Logo section */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <Skeleton height={80} width={80} rounded />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={16} width={140} />
          <Skeleton height={12} width="70%" />
          <Skeleton height={34} width={120} rounded />
        </div>
      </div>

      {/* Color palette */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <Skeleton height={16} width={120} />
        <div style={{ display: 'flex', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={48} width={48} rounded />
          ))}
        </div>
      </div>
    </div>
  );
}
