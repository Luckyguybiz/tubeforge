'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Team page skeleton: header + invite bar + member list */
export default function TeamLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={200} />
        <Skeleton height={14} width={260} style={{ marginTop: 8 }} />
      </div>

      {/* Team overview card */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={12} width={80} />
          <Skeleton height={20} width={120} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={12} width={80} />
          <Skeleton height={20} width={60} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={12} width={80} />
          <Skeleton height={20} width={90} />
        </div>
      </div>

      {/* Invite bar */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1 }}>
          <Skeleton height={10} width={40} style={{ marginBottom: 6 }} />
          <Skeleton height={38} />
        </div>
        <div style={{ width: 120 }}>
          <Skeleton height={10} width={40} style={{ marginBottom: 6 }} />
          <Skeleton height={38} />
        </div>
        <Skeleton height={38} width={110} rounded />
      </div>

      {/* Member list */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderBottom: i < 3 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <Skeleton height={36} width={36} rounded />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton height={14} width={`${130 - i * 15}px`} />
              <Skeleton height={11} width={`${180 - i * 20}px`} />
            </div>
            <Skeleton height={24} width={72} rounded />
          </div>
        ))}
      </div>
    </div>
  );
}
