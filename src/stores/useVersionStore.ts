import { create } from 'zustand';

/**
 * Version History Store
 *
 * Tracks explicit save snapshots of project state (scenes JSON).
 * Stores in localStorage with a max of 20 versions per project.
 * Allows restoring any previous version.
 */

export interface VersionSnapshot {
  id: string;
  timestamp: string;
  sceneCount: number;
  /** Stringified scenes array */
  scenesJson: string;
  /** Stringified characters array */
  charsJson: string;
  label: string;
}

interface VersionState {
  versions: VersionSnapshot[];
  projectId: string | null;

  /** Load versions from localStorage for a project */
  loadVersions: (projectId: string) => void;
  /** Save a new version snapshot */
  saveVersion: (projectId: string, scenes: unknown[], chars: unknown[], label?: string) => void;
  /** Get a specific version's data */
  getVersion: (versionId: string) => VersionSnapshot | undefined;
  /** Delete a specific version */
  deleteVersion: (versionId: string) => void;
  /** Clear all versions for current project */
  clearVersions: () => void;
}

const MAX_VERSIONS = 20;
const STORAGE_PREFIX = 'tf-versions-';

function readFromStorage(projectId: string): VersionSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as VersionSnapshot[];
  } catch {
    return [];
  }
}

function writeToStorage(projectId: string, versions: VersionSnapshot[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(versions));
  } catch {
    // Storage full — remove oldest versions and retry
    if (versions.length > 5) {
      const trimmed = versions.slice(-5);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(trimmed));
      } catch {
        // Give up silently
      }
    }
  }
}

export const useVersionStore = create<VersionState>((set, get) => ({
  versions: [],
  projectId: null,

  loadVersions: (projectId: string) => {
    const versions = readFromStorage(projectId);
    set({ versions, projectId });
  },

  saveVersion: (projectId: string, scenes: unknown[], chars: unknown[], label?: string) => {
    const snapshot: VersionSnapshot = {
      id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      sceneCount: scenes.length,
      scenesJson: JSON.stringify(scenes),
      charsJson: JSON.stringify(chars),
      label: label || `Version ${get().versions.length + 1}`,
    };

    const existing = get().projectId === projectId ? get().versions : readFromStorage(projectId);
    const updated = [...existing, snapshot];
    // Trim to max versions
    while (updated.length > MAX_VERSIONS) {
      updated.shift();
    }

    writeToStorage(projectId, updated);
    set({ versions: updated, projectId });
  },

  getVersion: (versionId: string) => {
    return get().versions.find((v) => v.id === versionId);
  },

  deleteVersion: (versionId: string) => {
    const { versions, projectId } = get();
    const updated = versions.filter((v) => v.id !== versionId);
    if (projectId) writeToStorage(projectId, updated);
    set({ versions: updated });
  },

  clearVersions: () => {
    const { projectId } = get();
    if (projectId) {
      writeToStorage(projectId, []);
    }
    set({ versions: [] });
  },
}));
