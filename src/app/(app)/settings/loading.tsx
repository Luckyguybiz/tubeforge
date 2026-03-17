'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Settings page skeleton: section cards */
export default function SettingsLoading() {
  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Skeleton height={16} width={320} />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} height={140} rounded />
      ))}
    </div>
  );
}
