'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton, ErrorBoundary } from '@/components/ui';

const EditorPage = dynamic(
  () => import('@/views/Editor/EditorPage').then((m) => ({ default: m.EditorPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

function EditorContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  return <EditorPage projectId={projectId} />;
}

export default function EditorRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <EditorContent />
      </Suspense>
    </ErrorBoundary>
  );
}
