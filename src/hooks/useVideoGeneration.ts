'use client';

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useEditorStore } from '@/stores/useEditorStore';
import { toast } from '@/stores/useNotificationStore';

export function useVideoGeneration(sceneId: string | null) {
  const scene = useEditorStore((s) => s.scenes.find((sc) => sc.id === sceneId));
  const updScene = useEditorStore((s) => s.updScene);
  const taskIdRef = useRef<string | null>(null);

  const generateVideo = trpc.ai.generateVideo.useMutation({
    onSuccess: (data) => {
      if (sceneId) {
        taskIdRef.current = data.taskId;
        // Store taskId in scene metadata for server-side tracking
        updScene(sceneId, { status: 'generating' });
      }
    },
    onError: (err) => {
      if (sceneId) updScene(sceneId, { status: 'error' });
      toast.error(err.message);
    },
  });

  // Poll task status every 3 seconds while generating
  const taskStatus = trpc.videoTask.checkStatus.useQuery(
    { taskId: taskIdRef.current! },
    {
      enabled: !!taskIdRef.current && scene?.status === 'generating',
      refetchInterval: 3000,
    },
  );

  useEffect(() => {
    if (!taskStatus.data || !sceneId) return;

    if (taskStatus.data.status === 'SUCCEEDED' && taskStatus.data.output) {
      updScene(sceneId, { status: 'ready' });
      taskIdRef.current = null;
      toast.success('Видео сгенерировано!');
    }

    if (taskStatus.data.status === 'FAILED') {
      updScene(sceneId, { status: 'error' });
      taskIdRef.current = null;
      toast.error(taskStatus.data.error || 'Ошибка генерации видео');
    }
  }, [taskStatus.data, sceneId, updScene]);

  const start = (prompt: string, model: string, duration: number) => {
    if (!sceneId) return;
    updScene(sceneId, { status: 'generating' });
    generateVideo.mutate({
      prompt,
      model: model as 'turbo' | 'standard' | 'pro' | 'cinematic',
      duration,
    });
  };

  return {
    start,
    isGenerating: generateVideo.isPending || scene?.status === 'generating',
    progress: taskStatus.data?.progress,
    taskStatus: taskStatus.data?.status,
  };
}
