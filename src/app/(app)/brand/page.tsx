'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

const BrandKit = dynamic(
  () => import('@/views/Brand/BrandKit').then((m) => ({ default: m.BrandKit })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function BrandPage() {
  return (
    <ErrorBoundary fallback={({ error, reset }) => <ErrorFallback error={error} reset={reset} />}>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <BrandKit />
      </Suspense>
    </ErrorBoundary>
  );
}
