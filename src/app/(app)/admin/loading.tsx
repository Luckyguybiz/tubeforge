'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Admin page skeleton: stat cards + table */
export default function AdminLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Skeleton height={28} width={260} />
        <Skeleton height={16} width={360} style={{ marginTop: 8 }} />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ flex: 1 }}>
            <Skeleton height={110} rounded />
          </div>
        ))}
      </div>
      <Skeleton height={320} rounded />
    </div>
  );
}
