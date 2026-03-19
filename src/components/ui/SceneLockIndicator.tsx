'use client';

import { useMemo } from 'react';
import { usePresenceStore } from '@/stores/usePresenceStore';
import { useThemeStore } from '@/stores/useThemeStore';

/* ═══════════════════════════════════════════════════════════════════
   SceneLockIndicator

   Shows a lock icon with the editing user's name when a scene
   is being edited by a team member. Prevents simultaneous editing
   of the same scene.
   ═══════════════════════════════════════════════════════════════════ */

export function SceneLockIndicator({ sceneId }: { sceneId: string }) {
  const C = useThemeStore((s) => s.theme);
  const sceneLocks = usePresenceStore((s) => s.sceneLocks);
  const selfUser = usePresenceStore((s) => s.selfUser);

  const lock = useMemo(() => sceneLocks.get(sceneId), [sceneLocks, sceneId]);

  if (!lock) return null;

  const isSelf = lock.user.id === selfUser?.id;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 6,
        background: isSelf ? lock.user.color + '15' : lock.user.color + '20',
        border: `1px solid ${lock.user.color}33`,
        fontSize: 10,
        fontWeight: 600,
        color: lock.user.color,
        whiteSpace: 'nowrap',
      }}
      title={isSelf ? 'You are editing' : `${lock.user.name} is editing`}
    >
      {/* Lock icon */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
      <span>{isSelf ? 'You' : lock.user.name}</span>
    </div>
  );
}

/**
 * Hook to check if a scene is locked by someone else.
 * Returns the lock info if locked by another user, or null.
 */
export function useSceneLock(sceneId: string) {
  const sceneLocks = usePresenceStore((s) => s.sceneLocks);
  const selfUser = usePresenceStore((s) => s.selfUser);

  return useMemo(() => {
    const lock = sceneLocks.get(sceneId);
    if (!lock) return null;
    if (lock.user.id === selfUser?.id) return null; // Own lock doesn't block
    return lock;
  }, [sceneLocks, sceneId, selfUser]);
}
