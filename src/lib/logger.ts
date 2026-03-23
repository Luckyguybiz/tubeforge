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

