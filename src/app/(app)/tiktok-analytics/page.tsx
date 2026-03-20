'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TiktokAnalytics = dynamic(
  () => import('@/views/TiktokAnalytics/TiktokAnalytics').then((m) => ({ default: m.TiktokAnalytics })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function TiktokAnalyticsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <TiktokAnalytics />
      </Suspense>
    </ErrorBoundary>
  );
}
