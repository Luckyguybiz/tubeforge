'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const AdminPage = dynamic(
  () => import('@/views/Admin/AdminPage').then((m) => ({ default: m.AdminPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function AdminRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <AdminPage />
      </Suspense>
    </ErrorBoundary>
  );
}
