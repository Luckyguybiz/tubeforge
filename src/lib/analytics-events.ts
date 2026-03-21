/**
 * Client-side event tracking.
 *
 * Events are buffered in sessionStorage and logged in dev mode.
 * Key events: sign_up, project_create, video_generate, upgrade_click, share_project
 */

export type AnalyticsEvent =
  | 'sign_up'
  | 'project_create'
  | 'video_generate'
  | 'upgrade_click'
  | 'share_project'
  | 'page_view'
  | (string & {});

interface StoredEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

const STORAGE_KEY = 'tf-events';
const MAX_EVENTS = 500;

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const events: StoredEvent[] = raw ? (JSON.parse(raw) as StoredEvent[]) : [];

    events.push({ event, properties, timestamp: Date.now() });

    // Prevent unbounded growth
    const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // sessionStorage may be unavailable (private browsing, quota exceeded)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event, properties);
  }
}

/**
 * Read all stored events (useful for batch sending later).
 */
export function getStoredEvents(): StoredEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredEvent[]) : [];
  } catch {
    return [];
  }
}

/**
 * Clear stored events after successful batch send.
 */
export function clearStoredEvents(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
