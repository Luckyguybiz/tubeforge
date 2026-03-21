/**
 * In-memory API key store.
 *
 * Since there is no ApiKey model in the Prisma schema, we store API keys
 * in memory. Keys survive process lifetime only (PM2 restart clears them).
 *
 * Each entry maps a SHA-256 hash of the full key to metadata.
 * The full key is returned only once at generation time.
 *
 * Production upgrade: add an ApiKey model to Prisma and persist to DB.
 */

import { createHash, randomBytes } from 'crypto';

export interface ApiKeyEntry {
  id: string;
  userId: string;
  keyHash: string;
  /** Last 4 characters of the key (for display) */
  last4: string;
  label: string;
  createdAt: Date;
}

/** Map from keyHash -> ApiKeyEntry */
const keyStore = new Map<string, ApiKeyEntry>();

/** Map from userId -> Set of keyHashes */
const userKeys = new Map<string, Set<string>>();

/** Simple API usage counter: userId -> count this month */
const usageCounters = new Map<string, { count: number; month: string }>();

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key for a user.
 * Returns the full key (only shown once) and the stored entry.
 */
export function generateApiKey(userId: string, label: string): { fullKey: string; entry: ApiKeyEntry } {
  const raw = randomBytes(32).toString('hex');
  const fullKey = `tf_${raw}`;
  const keyH = hashKey(fullKey);
  const id = randomBytes(8).toString('hex');

  const entry: ApiKeyEntry = {
    id,
    userId,
    keyHash: keyH,
    last4: fullKey.slice(-4),
    label: label || 'Default',
    createdAt: new Date(),
  };

  keyStore.set(keyH, entry);

  if (!userKeys.has(userId)) {
    userKeys.set(userId, new Set());
  }
  userKeys.get(userId)!.add(keyH);

  return { fullKey, entry };
}

/** Look up a user by their raw API key. Returns userId or null. */
export function lookupApiKey(rawKey: string): string | null {
  const h = hashKey(rawKey);
  const entry = keyStore.get(h);
  return entry?.userId ?? null;
}

/** List all keys for a user (last4 only, never the full key). */
export function listApiKeys(userId: string): Omit<ApiKeyEntry, 'keyHash'>[] {
  const hashes = userKeys.get(userId);
  if (!hashes) return [];
  const result: Omit<ApiKeyEntry, 'keyHash'>[] = [];
  for (const h of hashes) {
    const entry = keyStore.get(h);
    if (entry) {
      const { keyHash: _kh, ...rest } = entry;
      result.push(rest);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Revoke (delete) an API key by its id. Returns true if found. */
export function revokeApiKey(userId: string, keyId: string): boolean {
  const hashes = userKeys.get(userId);
  if (!hashes) return false;
  for (const h of hashes) {
    const entry = keyStore.get(h);
    if (entry && entry.id === keyId) {
      keyStore.delete(h);
      hashes.delete(h);
      return true;
    }
  }
  return false;
}

/** Increment API usage counter for a user. Returns new count. */
export function incrementApiUsage(userId: string): number {
  const month = currentMonth();
  const existing = usageCounters.get(userId);
  if (existing && existing.month === month) {
    existing.count += 1;
    return existing.count;
  }
  usageCounters.set(userId, { count: 1, month });
  return 1;
}

/** Get API usage count for a user this month. */
export function getApiUsage(userId: string): number {
  const month = currentMonth();
  const existing = usageCounters.get(userId);
  if (existing && existing.month === month) {
    return existing.count;
  }
  return 0;
}
