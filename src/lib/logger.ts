/**
 * Lightweight structured logger — zero dependencies.
 *
 * - JSON output in production (one line per entry), human-readable in dev
 * - Filterable via LOG_LEVEL env var (default: 'info' in prod, 'debug' in dev)
 * - Never log sensitive data (tokens, secrets, passwords)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDev = process.env.NODE_ENV !== 'production';

function getMinLevel(): LogLevel {
  const envLevel = (process.env.LOG_LEVEL ?? '').toLowerCase();
  if (envLevel in LEVEL_ORDER) return envLevel as LogLevel;
  return isDev ? 'debug' : 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[getMinLevel()];
}

function formatDev(entry: LogEntry): string {
  const ts = entry.timestamp.slice(11, 23); // HH:mm:ss.SSS
  const lvl = entry.level.toUpperCase().padEnd(5);
  const base = `${ts} ${lvl} [${entry.module}] ${entry.message}`;
  if (entry.data && Object.keys(entry.data).length > 0) {
    return `${base} ${JSON.stringify(entry.data)}`;
  }
  return base;
}

function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    module,
    message,
    timestamp: new Date().toISOString(),
    ...(data && Object.keys(data).length > 0 ? { data } : {}),
  };

  const output = isDev ? formatDev(entry) : JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(output);
      recordError(module, message);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: Record<string, unknown>) => log('debug', module, msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log('info', module, msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log('warn', module, msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log('error', module, msg, data),
  };
}

/** Default logger for ad-hoc usage without a dedicated module name */
export const logger = createLogger('app');

/* ── Request metrics (in-memory, resets on restart) ───────────── */

const processStartTime = Date.now();

interface RequestMetrics {
  totalRequests: number;
  totalErrors: number;
  /** Rolling sum of response times in ms (for computing average) */
  totalResponseTimeMs: number;
  /** Per-endpoint hit counts (path -> count) */
  endpointCounts: Map<string, number>;
}

const metrics: RequestMetrics = {
  totalRequests: 0,
  totalErrors: 0,
  totalResponseTimeMs: 0,
  endpointCounts: new Map(),
};

/** Maximum distinct endpoint keys to track (prevent unbounded memory growth) */
const MAX_ENDPOINT_KEYS = 500;

/**
 * Record a completed request for metrics tracking.
 * Call this from tRPC middleware, API routes, etc.
 */
export function recordRequest(path: string, durationMs: number, isError: boolean): void {
  metrics.totalRequests++;
  metrics.totalResponseTimeMs += durationMs;
  if (isError) {
    metrics.totalErrors++;
  }
  // Track per-endpoint counts (bounded)
  if (metrics.endpointCounts.size < MAX_ENDPOINT_KEYS || metrics.endpointCounts.has(path)) {
    metrics.endpointCounts.set(path, (metrics.endpointCounts.get(path) ?? 0) + 1);
  }
}

/**
 * Returns a snapshot of current request metrics (safe for JSON serialization).
 */
export function getMetrics() {
  const uptimeMs = Date.now() - processStartTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const secs = uptimeSeconds % 60;
  const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${secs}s`;

  const memUsage = process.memoryUsage();

  // Top endpoints by hit count
  const topEndpoints = [...metrics.endpointCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, count]) => ({ path, count }));

  return {
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    errorRate: metrics.totalRequests > 0
      ? Number(((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(2))
      : 0,
    avgResponseTimeMs: metrics.totalRequests > 0
      ? Number((metrics.totalResponseTimeMs / metrics.totalRequests).toFixed(1))
      : 0,
    uptime: uptimeFormatted,
    uptimeMs,
    memory: {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)} MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(1)} MB`,
    },
    topEndpoints,
  };
}

/* ── Error aggregation ────────────────────────────────────────── */

interface ErrorBucket {
  count: number;
  firstSeen: number;
  lastSeen: number;
}

/** In-memory error counts keyed by "module:message_prefix" per hour window. */
const errorBuckets = new Map<string, ErrorBucket>();
let currentHourKey = '';

function getHourKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}`;
}

function rotateIfNeeded(): void {
  const hk = getHourKey();
  if (hk !== currentHourKey) {
    errorBuckets.clear();
    currentHourKey = hk;
  }
}

/**
 * Record an error for aggregation. Called automatically by loggers created
 * via createLogger when level === 'error', but can also be called manually.
 */
export function recordError(module: string, message: string): void {
  rotateIfNeeded();
  // Use first 80 chars of message as the bucket key to group similar errors
  const prefix = message.slice(0, 80);
  const key = `${module}:${prefix}`;
  const now = Date.now();
  const existing = errorBuckets.get(key);
  if (existing) {
    existing.count++;
    existing.lastSeen = now;
  } else {
    errorBuckets.set(key, { count: 1, firstSeen: now, lastSeen: now });
  }
}

/**
 * Returns a summary of errors from the current hour window.
 */
export function getErrorSummary(): Array<{ key: string; count: number; firstSeen: string; lastSeen: string }> {
  rotateIfNeeded();
  return [...errorBuckets.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 50)
    .map(([key, bucket]) => ({
      key,
      count: bucket.count,
      firstSeen: new Date(bucket.firstSeen).toISOString(),
      lastSeen: new Date(bucket.lastSeen).toISOString(),
    }));
}

