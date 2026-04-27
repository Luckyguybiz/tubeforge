/**
 * Email OTP (one-time-password) code generation, hashing, and verification.
 *
 * Storage uses the existing Prisma `VerificationToken` table — no migration
 * required. The `token` column holds an HMAC-SHA256 hash; the plain code is
 * never persisted and is delivered only via email.
 *
 * Hashing scheme:
 *   token = hex( HMAC_SHA256( key=AUTH_SECRET, data=`${normalizedEmail}:${code}` ) )
 *
 * Email is included in the HMAC input so a leaked hash can't be reused for
 * a different email, and so identical codes for two users hash to different
 * values (defends against pre-computed lookup attacks even with a leaked DB).
 */
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { db } from '@/server/db';
import { env } from '@/lib/env';

/** Time-to-live for newly issued codes (15 minutes per plan spec). */
export const CODE_TTL_MS = 15 * 60 * 1000;
/** Maximum failed verify attempts per code lifecycle (rate limit handles per-email). */
export const MAX_VERIFY_ATTEMPTS = 5;

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Generates a uniformly random 6-digit numeric code as a zero-padded string.
 * Uses Node's `crypto.randomInt` (CSPRNG) — never `Math.random()`.
 */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * Returns the canonical hash for `(email, code)` keyed by AUTH_SECRET.
 * The same input always yields the same hash, allowing direct DB lookup
 * by hash without scanning rows.
 */
export function hashCode(email: string, code: string): string {
  const data = `${normalizeEmail(email)}:${code}`;
  return createHmac('sha256', env.AUTH_SECRET).update(data).digest('hex');
}

/**
 * Constant-time hex-string comparison. Both inputs must be hex (the hashCode
 * output format); length mismatch returns false without leaking which side
 * was longer.
 */
export function safeHashEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Persists a fresh code for `email`. Any previous unused codes for the same
 * email are deleted first — only the most recent code is valid at a time.
 * Returns the plain-text code so the caller can email it to the user.
 */
export async function issueCode(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const code = generateCode();
  const tokenHash = hashCode(normalizedEmail, code);
  const expires = new Date(Date.now() + CODE_TTL_MS);

  await db.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
  await db.verificationToken.create({
    data: { identifier: normalizedEmail, token: tokenHash, expires },
  });

  return code;
}

export type ConsumeCodeResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'invalid' | 'expired' };

/**
 * Verifies `code` against the stored hash for `email`. On success, the token
 * is deleted (one-time use) and `{ ok: true }` is returned. On failure, the
 * token is left in place so the user can retry with another code attempt
 * within the rate limit; the API caller is responsible for enforcing the
 * per-email retry budget via `rateLimit()`.
 */
export async function consumeCode(email: string, code: string): Promise<ConsumeCodeResult> {
  const normalizedEmail = normalizeEmail(email);

  // Reject obviously malformed codes early — no DB query.
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, reason: 'invalid' };
  }

  const expected = hashCode(normalizedEmail, code);
  const stored = await db.verificationToken.findFirst({
    where: { identifier: normalizedEmail },
    orderBy: { expires: 'desc' },
  });

  if (!stored) return { ok: false, reason: 'invalid' };

  if (stored.expires < new Date()) {
    await db.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
    return { ok: false, reason: 'expired' };
  }

  if (!safeHashEqual(stored.token, expected)) {
    return { ok: false, reason: 'invalid' };
  }

  // One-time use — delete on success.
  await db.verificationToken.delete({
    where: { identifier_token: { identifier: normalizedEmail, token: stored.token } },
  });

  return { ok: true, email: normalizedEmail };
}
