'use client';

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

const EditorPage = dynamic(
  () => import('@/views/Editor/EditorPage').then((m) => ({ default: m.EditorPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

function EditorContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const router = useRouter();
  const C = useThemeStore((s) => s.theme);

  // If no projectId in URL, create one silently and redirect
  const autoCreate = trpc.project.create.useMutation();

  useEffect(() => {
    if (!projectId && !autoCreate.isPending && !autoCreate.isSuccess) {
      autoCreate.mutate({ title: 'Untitled' }, {
        onSuccess: (data) => {
          router.replace(`/editor?projectId=${data.id}`);
        },
        onError: () => {
          toast.error('Failed to create workspace');
        },
      });
    }
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!projectId) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

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
