'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Team page skeleton: member list */
export default function TeamLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Skeleton height={32} width={200} />
      <Skeleton height={16} width={300} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={64} rounded />
        ))}
      </div>
    </div>
  );
}
