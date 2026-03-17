'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const EditorPage = dynamic(
  () => import('@/views/Editor/EditorPage').then((m) => ({ default: m.EditorPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

const ToolsHub = dynamic(
  () => import('@/views/Editor/ToolsHub').then((m) => ({ default: m.ToolsHub })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

function EditorContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  // If projectId provided — show the video editor
  // Otherwise — show the tools hub / catalog
  if (projectId) {
    return <EditorPage projectId={projectId} />;
  }

  return <ToolsHub />;
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
