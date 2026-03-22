'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Tool page skeleton: header + main content area */
export default function ToolLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tool header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <Skeleton height={48} width={48} rounded />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton height={22} width={200} />
          <Skeleton height={13} width={300} />
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Skeleton height={16} width="40%" />
        <Skeleton height={200} width="100%" />
        <div style={{ display: 'flex', gap: 12 }}>
          <Skeleton height={40} width={140} rounded />
          <Skeleton height={40} width={140} rounded />
        </div>
      </div>
    </div>
  );
}
