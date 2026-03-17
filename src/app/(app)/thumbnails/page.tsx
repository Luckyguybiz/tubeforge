'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton, ErrorBoundary } from '@/components/ui';

const ThumbnailEditor = dynamic(
  () => import('@/views/Thumbnails/ThumbnailEditor').then((m) => ({ default: m.ThumbnailEditor })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

function ThumbnailsContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  return <ThumbnailEditor projectId={projectId} />;
}

export default function ThumbnailsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <ThumbnailsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
