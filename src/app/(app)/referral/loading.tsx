'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Referral page skeleton: stats + referral link + history */
export default function ReferralLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={200} />
        <Skeleton height={14} width={300} style={{ marginTop: 8 }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <Skeleton height={12} width={70} />
            <Skeleton height={24} width={50} />
          </div>
        ))}
      </div>

      {/* Referral link card */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Skeleton height={16} width={140} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Skeleton height={40} style={{ flex: 1 }} />
          <Skeleton height={40} width={80} rounded />
        </div>
      </div>
    </div>
  );
}
