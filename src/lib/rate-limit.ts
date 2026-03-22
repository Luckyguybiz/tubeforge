/**
 * Rate limiting utility — Redis (Upstash) with in-memory fallback.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set,
 * uses @upstash/ratelimit with a sliding window for production-grade,
 * cross-instance rate limiting.
 *
 * Otherwise, falls back to in-memory rate limiting (best-effort,
 * per-process only). Suitable for single-instance PM2 deployments.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/* ── Types ──────────────────────────────────────────────────── */

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix-ms timestamp when the window resets */
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

/* ── Redis backend (preferred) ──────────────────────────────── */

const useRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

/** Cache of Ratelimit instances keyed by "limit:window" */
const rlCache = new Map<string, Ratelimit>();

function getRatelimiter(limit: number, window: number): Ratelimit {
  const key = `${limit}:${window}`;
  let rl = rlCache.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, `${window} s`),
      prefix: 'tf_rl',
    });
    rlCache.set(key, rl);
  }
  return rl;
}

async function rateLimitRedis({
  identifier,
  limit = 10,
  window = 60,
}: RateLimitOptions): Promise<RateLimitResult> {
  const rl = getRatelimiter(limit, window);
  const result = await rl.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/* ── In-memory backend (fallback) ───────────────────────────── */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 10_000;
const EVICT_PERCENT = 0.2;
const WARN_THRESHOLD = 5_000;
let cleanupInProgress = false;

function emergencyCleanup(): void {
  if (cleanupInProgress) return;
  cleanupInProgress = true;
  try {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetTime) store.delete(key);
    }
    if (store.size >= MAX_ENTRIES) {
      const entries = [...store.entries()].sort(
        (a, b) => a[1].lastAccess - b[1].lastAccess,
      );
      const toDelete = Math.ceil(entries.length * EVICT_PERCENT);
      for (let i = 0; i < toDelete; i++) store.delete(entries[i][0]);
    }
  } finally {
    cleanupInProgress = false;
  }
}

async function rateLimitMemory({
  identifier,
  limit = 10,
  window = 60,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = window * 1000;
  const entry = store.get(identifier);

  if (!entry || now >= entry.resetTime) {
    if (store.size >= MAX_ENTRIES) emergencyCleanup();
    if (store.size >= WARN_THRESHOLD) {
      console.warn(`[rate-limit] Store size: ${store.size} entries`);
    }
    const resetTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime, lastAccess: now });
    return { success: true, remaining: limit - 1, reset: resetTime };
  }

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

/* ── Periodic cleanup for in-memory store ───────────────────── */

function startCleanup(intervalMs = 60_000) {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetTime) store.delete(key);
    }
  }, intervalMs);
  if (timer.unref) timer.unref();
}

if (!useRedis) startCleanup();

/* ── Public API ─────────────────────────────────────────────── */

/**
 * Check (and consume) a rate-limit token for the given identifier.
 *
 * Uses Redis when UPSTASH_REDIS_REST_URL is set, otherwise in-memory.
 */
export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  if (useRedis) {
    try {
      return await rateLimitRedis(opts);
    } catch (err) {
      // Redis failure — fall back to in-memory so the app doesn't crash
      console.error('[rate-limit] Redis error, falling back to in-memory:', err);
      return rateLimitMemory(opts);
    }
  }
  return rateLimitMemory(opts);
}
