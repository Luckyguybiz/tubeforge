'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Dashboard skeleton: stat cards + project list */
export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Skeleton height={32} width={240} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={100} rounded />
        ))}
      </div>
      <Skeleton height={24} width={180} style={{ marginTop: 12 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={72} rounded />
        ))}
      </div>
    </div>
  );
}
