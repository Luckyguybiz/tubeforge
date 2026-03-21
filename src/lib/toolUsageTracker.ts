/**
 * Tool Usage Tracker
 *
 * Tracks how many times each tool is used via localStorage.
 * Tool labels are human-readable names shown in the analytics dashboard.
 *
 * Usage:
 *   import { trackToolUsage, getToolUsageCounts, flushToolUsage } from '@/lib/toolUsageTracker';
 *   trackToolUsage('mp3-converter');
 *   const counts = getToolUsageCounts(); // { 'MP3 Converter': 5, ... }
 */

const STORAGE_KEY = 'tf-tool-usage';

/** Tool ID -> Display label mapping */
const TOOL_LABELS: Record<string, string> = {
  'mp3-converter': 'MP3 Converter',
  'video-compressor': 'Video Compressor',
  'thumbnail-generator': 'Thumbnail Generator',
  'ai-scriptwriter': 'AI Scriptwriter',
  'subtitle-generator': 'Subtitle Generator',
  'video-trimmer': 'Video Trimmer',
  'audio-extractor': 'Audio Extractor',
  'format-converter': 'Format Converter',
  'gif-maker': 'GIF Maker',
  'youtube-downloader': 'YouTube Video Analyzer',
  'shorts-maker': 'Shorts Maker',
  'voice-generator': 'Voice Generator',
};

function readCounters(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeCounters(counters: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
  } catch {
    // localStorage full or not available — silently ignore
  }
}

/**
 * Increment usage counter for a tool.
 * @param toolId - The tool identifier (e.g., 'mp3-converter')
 */
export function trackToolUsage(toolId: string): void {
  const counters = readCounters();
  counters[toolId] = (counters[toolId] ?? 0) + 1;
  writeCounters(counters);
}

/**
 * Get all usage counts with display labels.
 * Returns an object mapping display labels to counts.
 */
export function getToolUsageCounts(): Record<string, number> {
  const counters = readCounters();
  const result: Record<string, number> = {};
  for (const [toolId, count] of Object.entries(counters)) {
    const label = TOOL_LABELS[toolId] ?? toolId;
    result[label] = count;
  }
  return result;
}

/**
 * Get raw counters (toolId -> count).
 */
export function getRawToolUsageCounts(): Record<string, number> {
  return readCounters();
}

/**
 * Reset all tool usage counters.
 */
export function resetToolUsage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently ignore
  }
}

/**
 * Flush/sync tool usage to server.
 * Call this periodically or on page unload.
 * Returns the counters that were flushed.
 */
export function flushToolUsage(): Record<string, number> {
  const counters = readCounters();
  // Return the current state — caller is responsible for sending to server
  return counters;
}

/**
 * Set up automatic flush on page unload using sendBeacon.
 * Should be called once on app init.
 */
export function setupToolUsageAutoFlush(): void {
  if (typeof window === 'undefined') return;

  const flush = () => {
    const counters = flushToolUsage();
    if (Object.keys(counters).length === 0) return;

    // Use sendBeacon for reliable delivery on page unload
    try {
      const payload = JSON.stringify({
        json: { counters },
      });
      navigator.sendBeacon(
        '/api/trpc/analytics.syncToolUsage',
        new Blob([payload], { type: 'application/json' }),
      );
    } catch {
      // Best effort — if sendBeacon fails, data stays in localStorage
    }
  };

  window.addEventListener('beforeunload', flush);
  // Also flush periodically every 5 minutes
  const interval = setInterval(flush, 5 * 60 * 1000);

  // Return cleanup function (for completeness, though usually not needed)
  return void interval;
}
