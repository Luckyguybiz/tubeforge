'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const KeywordsPage = dynamic(
  () => import('@/views/Keywords/KeywordsPage').then((m) => ({ default: m.KeywordsPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <KeywordsPage />
      </Suspense>
    </ErrorBoundary>
  );
}
