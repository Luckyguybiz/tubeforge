/**
 * App Store and Google Play reviewers cannot read our users' inboxes. When
 * AUTOPOST_REVIEW_EMAIL and AUTOPOST_REVIEW_CODE are set, that one address
 * signs in with that fixed code and no email is sent. Both unset = off.
 */
import { timingSafeEqual } from 'node:crypto';
import { normalizeEmail } from '@/lib/email-code';

export function isReviewEmail(email: string): boolean {
  const review = process.env.AUTOPOST_REVIEW_EMAIL;
  const code = process.env.AUTOPOST_REVIEW_CODE;
  return !!review && !!code && /^\d{6}$/.test(code) && normalizeEmail(review) === normalizeEmail(email);
}

export function checkReviewCode(email: string, code: string): boolean {
  if (!isReviewEmail(email)) return false;
  const expected = Buffer.from(process.env.AUTOPOST_REVIEW_CODE as string);
  const given = Buffer.from(code);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
