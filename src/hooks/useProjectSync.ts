'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useEditorStore } from '@/stores/useEditorStore';
import { toast } from '@/stores/useNotificationStore';
import { SCENE_SAVE_DEBOUNCE_MS, SAVE_STATUS_RESET_MS } from '@/lib/constants';
import type { Scene } from '@/lib/types';

/* ── stable debounce (fn stored in ref, not in deps) ────────── */
function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  ) as T;
}

/** Map client scene UI fields to server metadata JSON */
function toServerPatch(patch: Partial<Scene>) {
  const { ck, sf, ef, enh, snd, chars, transition, voiceoverUrl, voiceoverStatus, ...rest } = patch;
  const metadata: Record<string, unknown> = {};
  if (ck !== undefined) metadata.ck = ck;
  if (sf !== undefined) metadata.sf = sf;
  if (ef !== undefined) metadata.ef = ef;
  if (enh !== undefined) metadata.enh = enh;
  if (snd !== undefined) metadata.snd = snd;
  if (chars !== undefined) metadata.chars = chars;
  if (transition !== undefined) metadata.transition = transition;
  if (voiceoverUrl !== undefined) metadata.voiceoverUrl = voiceoverUrl;
  if (voiceoverStatus !== undefined) metadata.voiceoverStatus = voiceoverStatus;

  const serverData: Record<string, unknown> = { ...rest };
  if (Object.keys(metadata).length > 0) serverData.metadata = metadata;
  // Convert client status to server enum
  if (serverData.status && typeof serverData.status === 'string') {
    serverData.status = serverData.status.toUpperCase();
  }
  return serverData;
}

/** Build the create mutation payload from a client Scene */
function sceneToCreatePayload(projectId: string, scene: Scene) {
  return {
    projectId,
    prompt: scene.prompt,
    label: scene.label,
    model: scene.model as 'turbo' | 'standard' | 'pro' | 'cinematic',
    duration: scene.duration,
    metadata: { ck: scene.ck, sf: scene.sf, ef: scene.ef, enh: scene.enh, snd: scene.snd, chars: scene.chars, transition: scene.transition, voiceoverUrl: scene.voiceoverUrl, voiceoverStatus: scene.voiceoverStatus },
  };
}

export function useProjectSync(projectId: string | null) {
  const loadedRef = useRef(false);
  const saveResetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cleanup save-status timer on unmount
  useEffect(() => () => clearTimeout(saveResetTimer.current), []);

  const project = trpc.project.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId },
  );

  const onMutError = (err: { message: string }) => {
    toast.error(err.message);
    useEditorStore.getState().setSaveStatus('error');
  };
  const onMutSuccess = () => {
    useEditorStore.getState().setSaveStatus('saved');
    clearTimeout(saveResetTimer.current);
    saveResetTimer.current = setTimeout(() => {
      if (useEditorStore.getState().saveStatus === 'saved') {
        useEditorStore.getState().setSaveStatus('idle');
      }
    }, SAVE_STATUS_RESET_MS);
  };

  const createSceneMut = trpc.scene.create.useMutation({ onError: onMutError, onSuccess: onMutSuccess });
  const updateSceneMut = trpc.scene.update.useMutation({ onError: onMutError, onSuccess: onMutSuccess });
  const deleteSceneMut = trpc.scene.delete.useMutation({ onError: onMutError, onSuccess: onMutSuccess });
  const reorderScenesMut = trpc.scene.reorder.useMutation({ onError: onMutError, onSuccess: onMutSuccess });
  const updateProjectMut = trpc.project.update.useMutation({ onError: onMutError, onSuccess: onMutSuccess });

  // Load project data into store once
  useEffect(() => {
    if (project.data && !loadedRef.current) {
      useEditorStore.getState().loadProject(project.data);
      loadedRef.current = true;
    }
  }, [project.data]);

  // Debounced scene save (500ms)
  const debouncedSceneSave = useDebouncedCallback(
    (id: string, patch: Partial<Scene>) => {
      useEditorStore.getState().setSaveStatus('saving');
      const serverPatch = toServerPatch(patch);
      updateSceneMut.mutate({ id, ...serverPatch } as Parameters<typeof updateSceneMut.mutate>[0]);
    },
    SCENE_SAVE_DEBOUNCE_MS,
  );

  /** Create a scene on the server (without touching the store) and swap temp→server ID */
  const createOnServer = (scene: Scene) => {
    if (!projectId) return;
    const tempId = scene.id;
    createSceneMut.mutate(sceneToCreatePayload(projectId, scene), {
      onSuccess: (created) => {
        const store = useEditorStore.getState();
        // Update selId if it still points to the temp ID
        if (store.selId === tempId) store.setSelId(created.id);
        store.updScene(tempId, { id: created.id } as Partial<Scene>);
      },
    });
  };

  return {
    isLoading: project.isLoading,
    isError: project.isError,
    isSaving: updateSceneMut.isPending || createSceneMut.isPending,
    project: project.data,

    addScene: (afterId?: string) => {
      const ns = useEditorStore.getState().addScene(afterId);
      createOnServer(ns);
    },

    deleteScene: (id: string) => {
      useEditorStore.getState().delScene(id);
      if (projectId) deleteSceneMut.mutate({ id });
    },

    updateScene: (id: string, patch: Partial<Scene>) => {
      useEditorStore.getState().updScene(id, patch);
      debouncedSceneSave(id, patch);
    },

    /** Sync a scene that already exists in the store to the server (no store touch) */
    syncNewScene: createOnServer,

    duplicateScene: (id: string) => {
      // Snapshot IDs before dup
      const beforeIds = new Set(useEditorStore.getState().scenes.map((s) => s.id));
      useEditorStore.getState().dupScene(id);
      // Find the newly created scene by diffing IDs
      const dup = useEditorStore.getState().scenes.find((s) => !beforeIds.has(s.id));
      if (dup) createOnServer(dup);
    },

    splitScene: (id: string) => {
      // Snapshot IDs before split
      const beforeIds = new Set(useEditorStore.getState().scenes.map((s) => s.id));
      useEditorStore.getState().splitScene(id);
      if (projectId) {
        // Delete original on server
        deleteSceneMut.mutate({ id });
        // Create both new scenes
        const newScenes = useEditorStore.getState().scenes.filter((s) => !beforeIds.has(s.id));
        newScenes.forEach((s) => createOnServer(s));
      }
    },

    reorder: (fromId: string, toId: string) => {
      useEditorStore.getState().reorderScenes(fromId, toId);
      if (projectId) {
        const sceneIds = useEditorStore.getState().scenes.map((s) => s.id);
        reorderScenesMut.mutate({ projectId, sceneIds });
      }
    },

    saveCharacters: () => {
      if (projectId) {
        const chars = useEditorStore.getState().chars;
        updateProjectMut.mutate({ id: projectId, characters: chars });
      }
    },

    updateProjectTitle: (title: string) => {
      if (projectId) {
        useEditorStore.getState().setSaveStatus('saving');
        updateProjectMut.mutate({ id: projectId, title });
      }
    },

    refetch: () => {
      loadedRef.current = false;
      project.refetch();
    },
  };
}
