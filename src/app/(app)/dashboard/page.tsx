'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const Dashboard = dynamic(
  () => import('@/views/Dashboard/Dashboard').then((m) => ({ default: m.Dashboard })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <Dashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
