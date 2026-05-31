'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Publish-area skeleton — generic form + sidebar layout */
export default function PublishLoading() {
  const C = useThemeStore((s) => s.theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100, margin: '0 auto', padding: 4 }}>
      <div>
        <Skeleton height={32} width={260} />
        <Skeleton height={14} width={420} style={{ marginTop: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <Skeleton height={16} width={140} />
              <Skeleton height={48} width="100%" style={{ marginTop: 12 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
              <Skeleton height={14} width={100} />
              <Skeleton height={20} width="80%" style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
