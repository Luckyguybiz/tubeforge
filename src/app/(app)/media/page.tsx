'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

const MediaLibrary = dynamic(
  () => import('@/views/Media/MediaLibrary').then((m) => ({ default: m.MediaLibrary })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function MediaPage() {
  return (
    <ErrorBoundary fallback={({ error, reset }) => <ErrorFallback error={error} reset={reset} />}>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <MediaLibrary />
      </Suspense>
    </ErrorBoundary>
  );
}
