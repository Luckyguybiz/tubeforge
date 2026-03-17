'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const PreviewSave = dynamic(
  () => import('@/views/Preview/PreviewSave').then((m) => ({ default: m.PreviewSave })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

function PreviewContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  return <PreviewSave projectId={projectId} />;
}

export default function PreviewPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <PreviewContent />
      </Suspense>
    </ErrorBoundary>
  );
}
