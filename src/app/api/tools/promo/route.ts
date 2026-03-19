import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

// Promo codes with duration in hours
const PROMO_CODES: Record<string, { hours: number; label: string }> = {
  'SHORTS2026': { hours: 24, label: '24 часа полного доступа' },
  'TUBEFORGE': { hours: 24, label: '24 часа полного доступа' },
  'CREATOR': { hours: 168, label: '7 дней полного доступа' },  // 7 days
  '\u041F\u0415\u0420\u0412\u042B\u0419': { hours: 72, label: '3 дня полного доступа' },     // 3 days (ПЕРВЫЙ)
};

export async function POST(req: NextRequest) {
  // Rate limit: max 3 attempts per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, reset } = await rateLimit({ identifier: `promo:${ip}`, limit: 3, window: 60 });
  if (!success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  let code: unknown;
  try {
    const body = await req.json();
    code = body?.code;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const normalized = (code ?? '').toString().trim().toUpperCase();

  const promo = PROMO_CODES[normalized];
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
