'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const Metadata = dynamic(
  () => import('@/views/Metadata/Metadata').then((m) => ({ default: m.Metadata })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

function MetadataContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  return <Metadata projectId={projectId} />;
}

export default function MetadataPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <MetadataContent />
      </Suspense>
    </ErrorBoundary>
  );
}
