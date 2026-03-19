import { useEffect, useRef, useCallback } from 'react';
import { usePresenceStore } from '@/stores/usePresenceStore';

/* ═══════════════════════════════════════════════════════════════════
   useCollaboration

   Hook that manages the SSE collaboration connection lifecycle.
   Connects when a projectId is provided, disconnects on cleanup.
   ═══════════════════════════════════════════════════════════════════ */

export function useCollaboration(projectId: string | null) {
  const connect = usePresenceStore((s) => s.connect);
  const disconnect = usePresenceStore((s) => s.disconnect);
  const connectedProjectId = usePresenceStore((s) => s.projectId);

  useEffect(() => {
    if (!projectId) return;

    // Only connect if not already connected to this project
    if (connectedProjectId !== projectId) {
      connect(projectId);
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
}

/**
 * Hook that tracks cursor position on a canvas element
 * and broadcasts it to collaborators.
 */
export function useCollaborationCursor(canvasRef: React.RefObject<HTMLElement | null>) {
  const sendCursorMove = usePresenceStore((s) => s.sendCursorMove);
  const connected = usePresenceStore((s) => s.connected);
  const rafRef = useRef<number | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!connected || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const canvasW = canvasRef.current.getAttribute('data-canvas-w');
      const canvasH = canvasRef.current.getAttribute('data-canvas-h');

      if (!canvasW || !canvasH) {
        // Fallback: use element dimensions
        lastPos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      } else {
        // Scale to canvas coordinates
        const scaleX = parseFloat(canvasW) / rect.width;
        const scaleY = parseFloat(canvasH) / rect.height;
        lastPos.current = {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      }

      // Throttle via rAF
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        sendCursorMove(lastPos.current.x, lastPos.current.y);
        rafRef.current = null;
      });
    },
    [connected, canvasRef, sendCursorMove],
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [canvasRef, handleMouseMove]);
}

/**
 * Hook for scene editing with auto-lock/unlock.
 * Locks the scene when the user starts editing,
 * auto-releases after 2 minutes of inactivity.
 */
export function useSceneEditLock(sceneId: string | null) {
  const sendSceneLock = usePresenceStore((s) => s.sendSceneLock);
  const sendSceneUnlock = usePresenceStore((s) => s.sendSceneUnlock);
  const connected = usePresenceStore((s) => s.connected);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedSceneRef = useRef<string | null>(null);

  const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!lockedSceneRef.current) return;

    timerRef.current = setTimeout(() => {
      if (lockedSceneRef.current) {
        sendSceneUnlock(lockedSceneRef.current);
        lockedSceneRef.current = null;
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [sendSceneUnlock, INACTIVITY_TIMEOUT_MS]);

  const acquireLock = useCallback(
    async (id: string) => {
      if (!connected) return false;
      if (lockedSceneRef.current === id) {
        resetInactivityTimer();
        return true;
      }
      // Release previous lock
      if (lockedSceneRef.current) {
        sendSceneUnlock(lockedSceneRef.current);
      }
      const success = await sendSceneLock(id);
      if (success) {
        lockedSceneRef.current = id;
        resetInactivityTimer();
      }
      return success;
    },
    [connected, sendSceneLock, sendSceneUnlock, resetInactivityTimer],
  );

  const releaseLock = useCallback(() => {
    if (lockedSceneRef.current) {
      sendSceneUnlock(lockedSceneRef.current);
      lockedSceneRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [sendSceneUnlock]);

  // Auto-lock when sceneId changes
  useEffect(() => {
    if (sceneId && connected) {
      acquireLock(sceneId);
    }
    return () => {
      releaseLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, connected]);

  return { acquireLock, releaseLock, resetInactivityTimer };
}
