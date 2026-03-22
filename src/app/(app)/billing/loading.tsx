'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Billing page skeleton: plan card + invoice list */
export default function BillingLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={160} />
        <Skeleton height={14} width={280} style={{ marginTop: 8 }} />
      </div>

      {/* Current plan card */}
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
        <Skeleton height={16} width={100} />
        <Skeleton height={32} width={180} />
        <Skeleton height={12} width="60%" />
        <Skeleton height={38} width={140} rounded />
      </div>

      {/* Invoice list */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton height={14} width={`${160 - i * 20}px`} />
            <Skeleton height={10} width={`${100 - i * 10}px`} />
          </div>
          <Skeleton height={28} width={72} rounded />
        </div>
      ))}
    </div>
  );
}
