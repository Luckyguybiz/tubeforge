import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Promo codes with duration in hours.
 *
 * Set the PROMO_CODES env var as a JSON object to override, e.g.:
 *   PROMO_CODES='{"SHORTS2026":{"hours":24,"label":"24h access"}}'
 *
 * Falls back to built-in defaults when the env var is not set.
 * TODO: migrate promo codes to a database table for runtime management.
 */
const DEFAULT_PROMO_CODES: Record<string, { hours: number; label: string }> = {
  'SHORTS2026': { hours: 24, label: '24 часа полного доступа' },
  'TUBEFORGE': { hours: 24, label: '24 часа полного доступа' },
  'CREATOR': { hours: 168, label: '7 дней полного доступа' },
  '\u041F\u0415\u0420\u0412\u042B\u0419': { hours: 72, label: '3 дня полного доступа' },
};

const PROMO_CODES: Record<string, { hours: number; label: string }> = (() => {
  const raw = process.env.PROMO_CODES;
  if (!raw) return DEFAULT_PROMO_CODES;
  try {
    return JSON.parse(raw) as Record<string, { hours: number; label: string }>;
  } catch {
    console.error('[promo] Failed to parse PROMO_CODES env var, using defaults');
    return DEFAULT_PROMO_CODES;
  }
})();

const promoSchema = z.object({
  code: z.string().min(1).max(30),
});

export async function POST(req: NextRequest) {
  // Auth required
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: max 3 attempts per minute per user
  const { success, reset } = await rateLimit({ identifier: `promo:${session.user.id}`, limit: 3, window: 60 });
  if (!success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = promoSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid promo code format', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const normalized = parsed.data.code.trim().toUpperCase();

  // Validate format before lookup to prevent prototype pollution / abuse
  if (!/^[\p{L}\p{N}]+$/u.test(normalized)) {
    return NextResponse.json({ error: 'Invalid promo code format' }, { status: 400 });
  }

  const promo = Object.prototype.hasOwnProperty.call(PROMO_CODES, normalized) ? PROMO_CODES[normalized] : undefined;
  if (!promo) {
    return NextResponse.json({ error: 'Promo code not found' }, { status: 400 });
  }

  const expiresAt = Date.now() + promo.hours * 60 * 60 * 1000;

  return NextResponse.json({
    success: true,
    code: normalized,
    hours: promo.hours,
    label: promo.label,
    expiresAt,
  });
}
