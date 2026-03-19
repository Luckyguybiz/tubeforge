'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const BillingPage = dynamic(
  () => import('@/views/Billing/BillingPage').then((m) => ({ default: m.BillingPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function BillingRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <BillingPage />
      </Suspense>
    </ErrorBoundary>
  );
}
