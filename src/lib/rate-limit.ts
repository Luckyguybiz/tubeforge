/**
 * Rate limiting utility — per-function-instance, best-effort.
 *
 * IMPORTANT — SERVERLESS LIMITATION:
 * This module uses an in-memory Map. On Vercel (serverless / edge), each
 * function instance gets its own Map that is discarded on cold start. This
 * means the limiter is **best-effort only** within a single warm instance and
 * is NOT shared across concurrent serverless invocations.
 *
 * The primary line of defence for global IP-based rate limiting lives in the
 * root middleware.ts (edge runtime), which has longer-lived instances than
 * individual serverless functions and therefore provides better coverage.
 *
 * For cross-instance, production-grade rate limiting you need a shared store
 * such as @upstash/ratelimit + @upstash/redis:
 *
 *   import { Ratelimit } from '@upstash/ratelimit';
 *   import { Redis }     from '@upstash/redis';
 *
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(limit, `${window} s`),
 *   });
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  /** Last time this entry was accessed (used for LRU eviction) */
  lastAccess: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix‑ms timestamp when the window resets */
  reset: number;
}

interface RateLimitOptions {
  /** Unique key for the caller (e.g. userId, IP address) */
  identifier: string;
  /** Maximum number of requests allowed in the window */
  limit?: number;
  /** Window duration in seconds */
  window?: number;
}

const store = new Map<string, RateLimitEntry>();

/** Maximum number of entries in the rate-limit store */
const MAX_ENTRIES = 10_000;
/** Percentage of entries to evict when the store is full (LRU) */
const EVICT_PERCENT = 0.2;
/** Threshold for logging a warning */
const WARN_THRESHOLD = 5_000;
/** Flag indicating an emergency cleanup is already running */
let cleanupInProgress = false;

/**
 * LRU eviction when the store exceeds MAX_ENTRIES.
 * 1. Remove expired entries first (cheap).
 * 2. If still over limit, evict the oldest 20 % by lastAccess (LRU).
 *
 * Called inline during rateLimit() — no background timer needed.
 */
function emergencyCleanup(): void {
  if (cleanupInProgress) return;
  cleanupInProgress = true;
  try {
    const now = Date.now();

    // Step 1: remove expired entries
    for (const [key, entry] of store) {
      if (now >= entry.resetTime) {
        store.delete(key);
      }
    }

    // Step 2: if still >= MAX_ENTRIES, evict the least-recently-accessed 20 %
    if (store.size >= MAX_ENTRIES) {
      const entries = [...store.entries()].sort(
        (a, b) => a[1].lastAccess - b[1].lastAccess,
      );
      const toDelete = Math.ceil(entries.length * EVICT_PERCENT);
      for (let i = 0; i < toDelete; i++) {
        store.delete(entries[i][0]);
      }
    }
  } finally {
    cleanupInProgress = false;
  }
}

/**
 * Check (and consume) a rate-limit token for the given identifier.
 *
 * NOTE: Best-effort in serverless environments — see module-level comment.
 *
 * @example
 * ```ts
 * const { success, remaining, reset } = await rateLimit({
 *   identifier: userId,
 *   limit: 10,
 *   window: 60,
 * });
 *
 * if (!success) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 * ```
 */
export async function rateLimit({
  identifier,
  limit = 10,
  window = 60,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = window * 1000;

  const entry = store.get(identifier);

  // No previous record or the window has expired — start fresh.
  if (!entry || now >= entry.resetTime) {
    // Check store size before adding a new entry
    if (store.size >= MAX_ENTRIES) {
      emergencyCleanup();
    }
    if (store.size >= WARN_THRESHOLD) {
      console.warn(`[rate-limit] Store size: ${store.size} entries (warning threshold: ${WARN_THRESHOLD})`);
    }
    const resetTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime, lastAccess: now });
    return { success: true, remaining: limit - 1, reset: resetTime };
  }

  // Window still active — update LRU timestamp and increment.
  entry.lastAccess = now;
  entry.count += 1;

  if (entry.count > limit) {
    return { success: false, remaining: 0, reset: entry.resetTime };
  }

  return {
    success: true,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Periodically clean up expired entries so the Map does not grow unbounded.
 * Call once at module load; runs every 60 s.
 */
function startCleanup(intervalMs = 60_000) {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetTime) {
        store.delete(key);
      }
    }
  }, intervalMs);

  // Allow the Node process to exit even if the timer is still running.
  if (timer.unref) timer.unref();
}

startCleanup();
