import { create } from 'zustand';

/* ═══════════════════════════════════════════════════════════════════
   Presence Store

   Tracks real-time collaboration state:
   - Who is online on the current project
   - Remote cursor positions
   - Scene locks (who is editing which scene)

   Connects via SSE to /api/collaboration/stream
   ═══════════════════════════════════════════════════════════════════ */

export interface PresenceUser {
  id: string;
  name: string;
  image: string | null;
  color: string;
}

export interface RemoteCursor {
  userId: string;
  user: PresenceUser;
  x: number;
  y: number;
  /** Target position for smooth interpolation */
  targetX: number;
  targetY: number;
  lastUpdate: number;
}

export interface SceneLock {
  sceneId: string;
  user: PresenceUser;
  lockedAt: number;
}

interface PresenceState {
  /** Currently connected project ID */
  projectId: string | null;
  /** Users currently online on this project */
  onlineUsers: PresenceUser[];
  /** Remote cursor positions (keyed by userId) */
  remoteCursors: Map<string, RemoteCursor>;
  /** Scene locks (keyed by sceneId) */
  sceneLocks: Map<string, SceneLock>;
  /** Current user's info as seen by others */
  selfUser: PresenceUser | null;
  /** Connection status */
  connected: boolean;

  // Actions
  connect: (projectId: string) => void;
  disconnect: () => void;
  addUser: (user: PresenceUser) => void;
  removeUser: (userId: string) => void;
  setOnlineUsers: (users: PresenceUser[]) => void;
  updateCursor: (userId: string, user: PresenceUser, x: number, y: number) => void;
  lockScene: (sceneId: string, user: PresenceUser) => void;
  unlockScene: (sceneId: string) => void;
  setActiveLocks: (locks: Record<string, PresenceUser>) => void;
  setSelfUser: (user: PresenceUser) => void;
  setConnected: (v: boolean) => void;

  // Sending actions (requires active connection)
  sendCursorMove: (x: number, y: number) => void;
  sendSceneLock: (sceneId: string) => Promise<boolean>;
  sendSceneUnlock: (sceneId: string) => void;
  sendContentUpdated: (data?: Record<string, unknown>) => void;
}

/** Active EventSource reference */
let eventSource: EventSource | null = null;
/** Cursor interpolation animation frame */
let cursorAnimFrame: number | null = null;
/** Throttle for cursor moves (every 50ms) */
let lastCursorSend = 0;
const CURSOR_THROTTLE_MS = 50;
/** Stale cursor timeout (5 seconds) */
const CURSOR_STALE_MS = 5000;

async function postEvent(projectId: string, type: string, data?: Record<string, unknown>) {
  try {
    const res = await fetch('/api/collaboration/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, type, data }),
    });
    return res;
  } catch {
    return null;
  }
}

/** Interpolate cursor positions smoothly */
function startCursorInterpolation() {
  if (cursorAnimFrame) return;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const tick = () => {
    const state = usePresenceStore.getState();
    const cursors = state.remoteCursors;
    const now = Date.now();
    let changed = false;
    const updated = new Map(cursors);

    for (const [uid, cursor] of updated) {
      // Remove stale cursors
      if (now - cursor.lastUpdate > CURSOR_STALE_MS) {
        updated.delete(uid);
        changed = true;
        continue;
      }
      // Smooth interpolation toward target
      const dx = cursor.targetX - cursor.x;
      const dy = cursor.targetY - cursor.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        updated.set(uid, {
          ...cursor,
          x: lerp(cursor.x, cursor.targetX, 0.3),
          y: lerp(cursor.y, cursor.targetY, 0.3),
        });
        changed = true;
      }
    }

    if (changed) {
      usePresenceStore.setState({ remoteCursors: updated });
    }

    cursorAnimFrame = requestAnimationFrame(tick);
  };
  cursorAnimFrame = requestAnimationFrame(tick);
}

function stopCursorInterpolation() {
  if (cursorAnimFrame) {
    cancelAnimationFrame(cursorAnimFrame);
    cursorAnimFrame = null;
  }
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  projectId: null,
  onlineUsers: [],
  remoteCursors: new Map(),
  sceneLocks: new Map(),
  selfUser: null,
  connected: false,

  connect: (projectId: string) => {
    const state = get();
    // Disconnect from previous project if any
    if (eventSource) {
      state.disconnect();
    }

    set({ projectId, connected: false, onlineUsers: [], remoteCursors: new Map(), sceneLocks: new Map() });

    const es = new EventSource(`/api/collaboration/stream?projectId=${encodeURIComponent(projectId)}`);
    eventSource = es;

    es.onopen = () => {
      set({ connected: true });
      startCursorInterpolation();
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          user: PresenceUser;
          data?: Record<string, unknown>;
          timestamp: number;
        };

        const store = usePresenceStore.getState();

        switch (data.type) {
          case 'user_joined': {
            if (data.data?.isInitial) {
              // Initial state payload from server
              store.setSelfUser(data.user);
              const onlineUsers = (data.data.onlineUsers as PresenceUser[]) || [];
              store.setOnlineUsers(onlineUsers);
              const locks = (data.data.activeLocks as Record<string, PresenceUser>) || {};
              store.setActiveLocks(locks);
            } else {
              store.addUser(data.user);
            }
            break;
          }
          case 'user_left': {
            store.removeUser(data.user.id);
            break;
          }
          case 'cursor_move': {
            const x = (data.data?.x as number) ?? 0;
            const y = (data.data?.y as number) ?? 0;
            store.updateCursor(data.user.id, data.user, x, y);
            break;
          }
          case 'scene_locked': {
            if (data.data?.sceneId) {
              store.lockScene(data.data.sceneId as string, data.user);
            }
            break;
          }
          case 'scene_unlocked': {
            if (data.data?.sceneId) {
              store.unlockScene(data.data.sceneId as string);
            }
            break;
          }
          case 'content_updated': {
            // Can be used for conflict detection — for now just an event
            break;
          }
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      set({ connected: false });
      // EventSource will auto-reconnect
    };
  },

  disconnect: () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    stopCursorInterpolation();
    set({
      projectId: null,
      connected: false,
      onlineUsers: [],
      remoteCursors: new Map(),
      sceneLocks: new Map(),
      selfUser: null,
    });
  },

  addUser: (user) => {
    set((s) => {
      // Don't add duplicates
      if (s.onlineUsers.some((u) => u.id === user.id)) return s;
      return { onlineUsers: [...s.onlineUsers, user] };
    });
  },

  removeUser: (userId) => {
    set((s) => {
      const updated = new Map(s.remoteCursors);
      updated.delete(userId);
      // Also release any locks held by this user
      const updatedLocks = new Map(s.sceneLocks);
      for (const [sceneId, lock] of updatedLocks) {
        if (lock.user.id === userId) updatedLocks.delete(sceneId);
      }
      return {
        onlineUsers: s.onlineUsers.filter((u) => u.id !== userId),
        remoteCursors: updated,
        sceneLocks: updatedLocks,
      };
    });
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  updateCursor: (userId, user, x, y) => {
    set((s) => {
      const updated = new Map(s.remoteCursors);
      const existing = updated.get(userId);
      updated.set(userId, {
        userId,
        user,
        x: existing?.x ?? x,
        y: existing?.y ?? y,
        targetX: x,
        targetY: y,
        lastUpdate: Date.now(),
      });
      return { remoteCursors: updated };
    });
  },

  lockScene: (sceneId, user) => {
    set((s) => {
      const updated = new Map(s.sceneLocks);
      updated.set(sceneId, { sceneId, user, lockedAt: Date.now() });
      return { sceneLocks: updated };
    });
  },

  unlockScene: (sceneId) => {
    set((s) => {
      const updated = new Map(s.sceneLocks);
      updated.delete(sceneId);
      return { sceneLocks: updated };
    });
  },

  setActiveLocks: (locks) => {
    const lockMap = new Map<string, SceneLock>();
    for (const [sceneId, user] of Object.entries(locks)) {
      lockMap.set(sceneId, { sceneId, user, lockedAt: Date.now() });
    }
    set({ sceneLocks: lockMap });
  },

  setSelfUser: (user) => set({ selfUser: user }),
  setConnected: (v) => set({ connected: v }),

  // ─── Sending actions ──────────────────────────────────────────

  sendCursorMove: (x: number, y: number) => {
    const now = Date.now();
    if (now - lastCursorSend < CURSOR_THROTTLE_MS) return;
    lastCursorSend = now;
    const { projectId } = get();
    if (!projectId) return;
    postEvent(projectId, 'cursor_move', { x, y });
  },

  sendSceneLock: async (sceneId: string) => {
    const { projectId, selfUser } = get();
    if (!projectId) return false;
    const res = await postEvent(projectId, 'scene_locked', { sceneId });
    if (res?.ok) {
      // Optimistically set the lock locally
      if (selfUser) {
        get().lockScene(sceneId, selfUser);
      }
      return true;
    }
    return false;
  },

  sendSceneUnlock: (sceneId: string) => {
    const { projectId, selfUser } = get();
    if (!projectId) return;
    postEvent(projectId, 'scene_unlocked', { sceneId });
    // Optimistically remove local lock
    if (selfUser) {
      get().unlockScene(sceneId);
    }
  },

  sendContentUpdated: (data?: Record<string, unknown>) => {
    const { projectId } = get();
    if (!projectId) return;
    postEvent(projectId, 'content_updated', data);
  },
}));
