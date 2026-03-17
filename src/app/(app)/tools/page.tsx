'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const ToolsHub = dynamic(
  () => import('@/views/Editor/ToolsHub').then((m) => ({ default: m.ToolsHub })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function ToolsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <ToolsHub />
      </Suspense>
    </ErrorBoundary>
  );
}
