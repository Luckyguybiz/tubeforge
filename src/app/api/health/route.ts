import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Health check returns only basic status — no env vars, no secrets, no internals
  let dbOk = false;
  try {
    const { db } = await import('@/server/db');
    await db.$queryRaw`SELECT 1 as ok`;
    dbOk = true;
  } catch {
    // DB connection failed
  }

  return NextResponse.json(
    { status: dbOk ? 'ok' : 'degraded', db: dbOk, timestamp: new Date().toISOString() },
    { status: dbOk ? 200 : 503 },
  );
}
