'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Editor skeleton: sidebar + main canvas area */
export default function EditorLoading() {
  return (
    <div style={{ display: 'flex', gap: 16, height: '80vh' }}>
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton height={36} width="100%" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={48} />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <Skeleton width="100%" height="100%" rounded />
      </div>
    </div>
  );
}
