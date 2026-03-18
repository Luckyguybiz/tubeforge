'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const ShortsAnalytics = dynamic(
  () => import('@/views/ShortsAnalytics/ShortsAnalytics').then((m) => ({ default: m.ShortsAnalytics })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function ShortsAnalyticsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <ShortsAnalytics />
      </Suspense>
    </ErrorBoundary>
  );
}
