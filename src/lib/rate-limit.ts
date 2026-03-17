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

/** Максимальное количество записей в хранилище rate-limit */
const MAX_ENTRIES = 10_000;
/** Порог для логирования предупреждения */
const WARN_THRESHOLD = 5_000;
/** Флаг, указывающий что аварийная очистка уже выполняется */
let cleanupInProgress = false;

/**
 * Аварийная очистка хранилища при превышении MAX_ENTRIES.
 * Сначала удаляет просроченные записи, затем — старейшие 20%.
 */
function emergencyCleanup(): void {
  if (cleanupInProgress) return;
  cleanupInProgress = true;
  try {
    const now = Date.now();

    // Шаг 1: удалить просроченные записи
    for (const [key, entry] of store) {
      if (now >= entry.resetTime) {
        store.delete(key);
      }
    }

    // Шаг 2: если размер всё ещё >= MAX_ENTRIES, удалить старейшую половину
    if (store.size >= MAX_ENTRIES) {
      const entries = [...store.entries()].sort((a, b) => a[1].resetTime - b[1].resetTime);
      const toDelete = Math.ceil(entries.length * 0.5);
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
    // Проверка лимита записей перед добавлением новой
    if (store.size >= MAX_ENTRIES) {
      emergencyCleanup();
    }
    if (store.size >= WARN_THRESHOLD) {
      console.warn(`[rate-limit] Размер хранилища: ${store.size} записей (порог предупреждения: ${WARN_THRESHOLD})`);
    }
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
