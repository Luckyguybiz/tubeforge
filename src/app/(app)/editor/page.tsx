'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { useLocaleStore } from '@/stores/useLocaleStore';

const EditorPage = dynamic(
  () => import('@/views/Editor/EditorPage').then((m) => ({ default: m.EditorPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

function EditorContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const t = useLocaleStore((s) => s.t);

  // If projectId provided — show the video editor
  // Otherwise — show the project picker so the user selects a project first
  if (projectId) {
    return <EditorPage projectId={projectId} />;
  }

  return <ProjectPicker target="/editor" title={t('editor.videoGeneration')} />;
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
