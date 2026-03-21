/**
 * Dashboard Activity Log
 *
 * Stores and retrieves recent user actions in localStorage.
 * Used to display a "Recent Activity" feed on the dashboard.
 */

export type ActivityType =
  | 'project_created'
  | 'project_deleted'
  | 'project_renamed'
  | 'project_duplicated'
  | 'video_generated'
  | 'project_exported'
  | 'project_imported';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  label: string;       // e.g. project title
  timestamp: number;   // Date.now()
}

const STORAGE_KEY = 'tf_activity_log';
const MAX_ENTRIES = 20;

function readEntries(): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ActivityEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: ActivityEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function logActivity(type: ActivityType, label: string): void {
  const entry: ActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    label,
    timestamp: Date.now(),
  };
  const entries = readEntries();
  entries.unshift(entry);
  writeEntries(entries);
}

export function getRecentActivity(limit = 5): ActivityEntry[] {
  return readEntries().slice(0, limit);
}
