import { create } from 'zustand';

/**
 * Activity Feed Store
 *
 * Tracks recent user actions on a project.
 * Stores last 20 activities per project in localStorage.
 */

export interface ActivityEntry {
  id: string;
  type: 'scene_add' | 'scene_delete' | 'scene_edit' | 'scene_duplicate' |
        'description_edit' | 'title_edit' | 'version_save' | 'comment_add' |
        'project_share' | 'scene_reorder' | 'scene_generate';
  label: string;
  timestamp: string;
  sceneId?: string;
}

interface ActivityState {
  activities: ActivityEntry[];
  projectId: string | null;

  /** Load activities from localStorage for a project */
  loadActivities: (projectId: string) => void;
  /** Log a new activity */
  logActivity: (projectId: string, type: ActivityEntry['type'], label: string, sceneId?: string) => void;
  /** Clear all activities for current project */
  clearActivities: () => void;
}

const MAX_ACTIVITIES = 20;
const STORAGE_PREFIX = 'tf-activity-';

function readFromStorage(projectId: string): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ActivityEntry[];
  } catch {
    return [];
  }
}

function writeToStorage(projectId: string, activities: ActivityEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(activities));
  } catch {
    // Storage full — keep only recent entries
    const trimmed = activities.slice(-10);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(trimmed));
    } catch {
      // Give up silently
    }
  }
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  projectId: null,

  loadActivities: (projectId: string) => {
    const activities = readFromStorage(projectId);
    set({ activities, projectId });
  },

  logActivity: (projectId: string, type: ActivityEntry['type'], label: string, sceneId?: string) => {
    const entry: ActivityEntry = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      timestamp: new Date().toISOString(),
      sceneId,
    };

    const existing = get().projectId === projectId ? get().activities : readFromStorage(projectId);
    const updated = [...existing, entry];
    while (updated.length > MAX_ACTIVITIES) {
      updated.shift();
    }

    writeToStorage(projectId, updated);
    set({ activities: updated, projectId });
  },

  clearActivities: () => {
    const { projectId } = get();
    if (projectId) writeToStorage(projectId, []);
    set({ activities: [] });
  },
}));
