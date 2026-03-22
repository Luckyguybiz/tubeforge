/**
 * Database-backed API key management.
 *
 * Keys are stored as SHA-256 hashes in the ApiKey table. The full key is
 * returned only once at generation time. Verification hashes the incoming
 * key and looks it up in the database.
 */

import { createHash, randomBytes } from 'crypto';
import { db } from '@/server/db';

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key for a user.
 * Returns the full key (only shown once) and the stored entry.
 */
export async function generateApiKey(
  userId: string,
  label: string,
): Promise<{ fullKey: string; entry: { id: string; last4: string; label: string; createdAt: Date } }> {
  const raw = randomBytes(32).toString('hex');
  const fullKey = `tf_${raw}`;
  const keyH = hashKey(fullKey);
  const prefix = fullKey.slice(0, 7); // "tf_" + first 4 hex chars

  const record = await db.apiKey.create({
    data: {
      userId,
      name: label || 'Default',
      keyHash: keyH,
      prefix,
    },
    select: { id: true, name: true, createdAt: true },
  });

  return {
    fullKey,
    entry: {
      id: record.id,
      last4: fullKey.slice(-4),
      label: record.name,
      createdAt: record.createdAt,
    },
  };
}

/**
 * Look up a user by their raw API key.
 * Updates lastUsed and usageCount on match. Returns userId or null.
 */
export async function lookupApiKey(rawKey: string): Promise<string | null> {
  const h = hashKey(rawKey);
  const entry = await db.apiKey.findUnique({
    where: { keyHash: h },
    select: { userId: true, id: true },
  });
  if (!entry) return null;

  // Fire-and-forget: update lastUsed and usageCount
  db.apiKey
    .update({
      where: { id: entry.id },
      data: { lastUsed: new Date(), usageCount: { increment: 1 } },
    })
    .catch(() => {
      // Non-critical - don't block the request if the update fails
    });

  return entry.userId;
}

/** List all keys for a user (prefix only, never the full key). */
export async function listApiKeys(
  userId: string,
): Promise<Array<{ id: string; last4: string; label: string; createdAt: Date; lastUsed: Date | null; usageCount: number }>> {
  const keys = await db.apiKey.findMany({
    where: { userId },
    select: { id: true, name: true, prefix: true, createdAt: true, lastUsed: true, usageCount: true },
    orderBy: { createdAt: 'desc' },
  });

  return keys.map((k) => ({
    id: k.id,
    last4: k.prefix.slice(-4),
    label: k.name,
    createdAt: k.createdAt,
    lastUsed: k.lastUsed,
    usageCount: k.usageCount,
  }));
}

/** Revoke (delete) an API key by its id. Returns true if found and deleted. */
export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  const key = await db.apiKey.findFirst({
    where: { id: keyId, userId },
    select: { id: true },
  });
  if (!key) return false;

  await db.apiKey.delete({ where: { id: keyId } });
  return true;
}

/** Get API usage count for a user (sum of all key usageCounts). */
export async function getApiUsage(userId: string): Promise<number> {
  const result = await db.apiKey.aggregate({
    where: { userId },
    _sum: { usageCount: true },
  });
  return result._sum.usageCount ?? 0;
}

/**
 * Increment API usage counter for a user.
 * This is now handled automatically by lookupApiKey, but kept for
 * backward compatibility with the REST API route.
 */
export async function incrementApiUsage(_userId: string): Promise<number> {
  // Usage is tracked per-key in lookupApiKey now.
  // This function is kept as a no-op for backward compatibility.
  return 0;
}
