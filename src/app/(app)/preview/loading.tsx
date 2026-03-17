'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Preview page skeleton: video player + info */
export default function PreviewLoading() {
  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Skeleton height={32} width={260} />
      <Skeleton width="100%" height={420} rounded />
      <div style={{ display: 'flex', gap: 12 }}>
        <Skeleton height={40} width={120} rounded />
        <Skeleton height={40} width={120} rounded />
      </div>
    </div>
  );
}
