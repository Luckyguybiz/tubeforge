'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Settings page skeleton: section cards */
export default function SettingsLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={180} />
        <Skeleton height={14} width={300} style={{ marginTop: 8 }} />
      </div>

      {/* Setting sections */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton height={16} width={120 + i * 20} />
            <Skeleton height={32} width={80} rounded />
          </div>
          <Skeleton height={12} width="80%" />
          <div style={{ height: 1, background: C.border }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Skeleton height={40} width={40} rounded />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton height={14} width={`${50 - i * 5}%`} />
              <Skeleton height={10} width={`${35 - i * 3}%`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
