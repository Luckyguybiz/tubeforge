/**
 * Password hashing + verification utilities for the optional
 * email-password sign-in path.
 *
 * Choices:
 *   - bcryptjs (pure JS) over bcrypt (native binding) so the build
 *     doesn't need a C++ toolchain on every deploy.
 *   - 12 rounds — ~250ms on modern CPU, well above OWASP minimum (10),
 *     resistant to GPU brute-force, still under the rate-limit window.
 *   - Min password length 8, no upper-bound — rate-limit handles
 *     resource exhaustion attacks against `compare`.
 */
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordValidation =
  | { ok: true }
  | { ok: false; reason: 'too_short' | 'too_long' | 'empty' };

export function validatePassword(password: unknown): PasswordValidation {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, reason: 'too_short' };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }
  return { ok: true };
}

/** Hashes a plain password with bcrypt. Throws on invalid input. */
export async function hashPassword(plain: string): Promise<string> {
  const v = validatePassword(plain);
  if (!v.ok) {
    throw new Error(`Invalid password: ${v.reason}`);
  }
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verifies a candidate password against a stored bcrypt hash. Always
 * runs the full compare even on missing hashes, to keep the timing
 * profile uniform between "no account" and "wrong password" responses.
 */
export async function verifyPassword(
  plain: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  // If there's no hash, run a dummy compare so attackers can't time the
  // existence of the account.
  const hash = storedHash ?? '$2b$12$0000000000000000000000000000000000000000000000000000';
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
