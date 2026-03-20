'use client';

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useEditorStore } from '@/stores/useEditorStore';
import { toast } from '@/stores/useNotificationStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

export function useVideoGeneration(sceneId: string | null) {
  const sceneStatus = useEditorStore((s) => {
    const sc = s.scenes.find((sc) => sc.id === sceneId);
    return sc?.status ?? null;
  });
  const sceneTaskId = useEditorStore((s) => {
    const sc = s.scenes.find((sc) => sc.id === sceneId);
    return sc?.taskId ?? null;
  });
  const updScene = useEditorStore((s) => s.updScene);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const updateScene = trpc.scene.update.useMutation();
  const updateSceneRef = useRef(updateScene);
  updateSceneRef.current = updateScene;

  // On mount, restore taskId from DB if scene is still generating
  useEffect(() => {
    if (sceneId && sceneStatus === 'generating' && sceneTaskId && !activeTaskId) {
      setActiveTaskId(sceneTaskId);
    }
  }, [sceneId, sceneStatus, sceneTaskId, activeTaskId]);

  const generateVideo = trpc.ai.generateVideo.useMutation({
    onSuccess: (data) => {
      if (sceneId) {
        setActiveTaskId(data.taskId);
        updScene(sceneId, { status: 'generating', taskId: data.taskId });
        // Persist taskId to DB so polling survives page refresh
        updateSceneRef.current.mutate({ id: sceneId, taskId: data.taskId, status: 'GENERATING' });
      }
    },
    onError: (err) => {
      if (sceneId) updScene(sceneId, { status: 'error' });
      setLastError(err.message);
      toast.error(err.message);
    },
  });

  // Poll task status every 3 seconds while generating
  const taskStatus = trpc.videoTask.checkStatus.useQuery(
    { taskId: activeTaskId! },
    {
      enabled: !!activeTaskId && sceneStatus === 'generating',
      refetchInterval: 3000,
    },
  );

  useEffect(() => {
    if (!taskStatus.data || !sceneId) return;

    if (taskStatus.data.status === 'SUCCEEDED' && taskStatus.data.output) {
      const output = taskStatus.data.output;
      updScene(sceneId, { status: 'ready', videoUrl: output, taskId: null });
      setActiveTaskId(null);
      // Persist videoUrl and clear taskId in DB
      updateSceneRef.current.mutate({ id: sceneId, videoUrl: output, status: 'READY', taskId: null });
      toast.success(useLocaleStore.getState().t('videoGen.success'));
    }

    if (taskStatus.data.status === 'FAILED') {
      const errMsg = taskStatus.data.error || useLocaleStore.getState().t('videoGen.error');
      updScene(sceneId, { status: 'error', taskId: null });
      setActiveTaskId(null);
      setLastError(errMsg);
      updateSceneRef.current.mutate({ id: sceneId, status: 'ERROR', taskId: null });
      toast.error(errMsg);
    }
  }, [taskStatus.data, sceneId, updScene]);

  const start = (prompt: string, model: string, duration: number) => {
    if (!sceneId) return;
    setLastError(null);
    updScene(sceneId, { status: 'generating' });
    generateVideo.mutate({
      prompt,
      model: model as 'turbo' | 'standard' | 'pro' | 'cinematic',
      duration,
    });
  };

  return {
    start,
    isGenerating: generateVideo.isPending || sceneStatus === 'generating',
    progress: taskStatus.data?.progress,
    taskStatus: taskStatus.data?.status,
    lastError,
  };
}
