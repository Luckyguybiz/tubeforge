'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TeamPage = dynamic(
  () => import('@/views/Team/TeamPage').then((m) => ({ default: m.TeamPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function TeamRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <TeamPage />
      </Suspense>
    </ErrorBoundary>
  );
}
