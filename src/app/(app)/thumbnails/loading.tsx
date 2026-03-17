'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Thumbnail editor skeleton: toolbar + canvas */
export default function ThumbnailsLoading() {
  return (
    <div style={{ display: 'flex', gap: 12, height: '80vh' }}>
      <div style={{ width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={40} width={40} rounded />
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton width="80%" height="70%" rounded />
      </div>
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton height={36} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={44} />
        ))}
      </div>
    </div>
  );
}
