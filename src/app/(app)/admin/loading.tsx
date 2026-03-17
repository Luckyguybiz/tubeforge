'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Admin page skeleton: stat cards + table */
export default function AdminLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={240} />
        <Skeleton height={14} width={340} style={{ marginTop: 8 }} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <Skeleton height={12} width={80} />
            <Skeleton height={28} width={70} />
            <Skeleton height={10} width={50} />
          </div>
        ))}
      </div>

      {/* Table area */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 16 }}>
          <Skeleton height={12} width={80} />
          <Skeleton height={12} width={120} />
          <Skeleton height={12} width={80} />
          <Skeleton height={12} width={60} />
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '14px 18px',
              borderBottom: i < 5 ? `1px solid ${C.border}` : 'none',
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <Skeleton height={32} width={32} rounded />
            <Skeleton height={14} width={`${30 - i * 2}%`} />
            <div style={{ flex: 1 }} />
            <Skeleton height={14} width={80} />
            <Skeleton height={24} width={60} rounded />
          </div>
        ))}
      </div>
    </div>
  );
}
