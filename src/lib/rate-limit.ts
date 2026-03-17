/**
 * Rate limiting utility.
 *
 * Uses an in-memory Map for development / testing.
 * In production swap this out for @upstash/ratelimit + Redis:
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

/**
 * Check (and consume) a rate-limit token for the given identifier.
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
    const resetTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: limit - 1, reset: resetTime };
  }

  // Window still active — increment.
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
