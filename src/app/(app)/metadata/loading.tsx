'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Metadata page skeleton: form fields */
export default function MetadataLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <Skeleton height={28} width={260} />
        <Skeleton height={14} width={360} style={{ marginTop: 8 }} />
      </div>

      {/* Form card */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Title field */}
        <div>
          <Skeleton height={11} width={60} style={{ marginBottom: 8 }} />
          <Skeleton height={44} />
        </div>
        {/* Description field */}
        <div>
          <Skeleton height={11} width={80} style={{ marginBottom: 8 }} />
          <Skeleton height={120} />
        </div>
        {/* Tags */}
        <div>
          <Skeleton height={11} width={40} style={{ marginBottom: 8 }} />
          <Skeleton height={44} />
        </div>
        {/* Tag pills */}
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={28} width={70 + i * 10} rounded />
          ))}
        </div>
      </div>
    </div>
  );
}
