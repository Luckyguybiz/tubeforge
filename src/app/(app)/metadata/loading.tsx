'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Metadata page skeleton: form fields */
export default function MetadataLoading() {
  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Skeleton height={32} width={280} />
      <Skeleton height={16} width={380} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
        <Skeleton height={44} />
        <Skeleton height={120} />
        <Skeleton height={44} />
        <div style={{ display: 'flex', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={32} width={80} rounded />
          ))}
        </div>
      </div>
    </div>
  );
}
