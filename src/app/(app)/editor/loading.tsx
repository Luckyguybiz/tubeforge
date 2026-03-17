'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Editor skeleton: sidebar + main canvas area */
export default function EditorLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: 'flex', gap: 16, height: '80vh' }}>
      {/* Scene sidebar */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Skeleton height={36} width="100%" />
        <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Skeleton height={40} width={60} rounded />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton height={12} width={`${80 - i * 8}%`} />
              <Skeleton height={9} width={50} />
            </div>
          </div>
        ))}
      </div>
      {/* Main canvas */}
      <div
        style={{
          flex: 1,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton width="85%" height="75%" rounded />
      </div>
    </div>
  );
}
