import { NextRequest, NextResponse } from 'next/server';

// Promo codes with duration in hours
const PROMO_CODES: Record<string, { hours: number; label: string }> = {
  'SHORTS2026': { hours: 24, label: '24 часа полного доступа' },
  'TUBEFORGE': { hours: 24, label: '24 часа полного доступа' },
  'CREATOR': { hours: 168, label: '7 дней полного доступа' },  // 7 days
  '\u041F\u0415\u0420\u0412\u042B\u0419': { hours: 72, label: '3 дня полного доступа' },     // 3 days (ПЕРВЫЙ)
};

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const normalized = (code ?? '').toString().trim().toUpperCase();

  const promo = PROMO_CODES[normalized];
  if (!promo) {
    return NextResponse.json({ error: 'Промокод не найден' }, { status: 400 });
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
