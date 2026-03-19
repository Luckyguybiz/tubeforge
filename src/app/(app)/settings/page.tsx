'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SettingsPage = dynamic(
  () => import('@/views/Settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function SettingsRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <SettingsPage />
      </Suspense>
    </ErrorBoundary>
  );
}
