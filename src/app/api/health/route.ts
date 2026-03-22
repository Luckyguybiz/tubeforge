import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Health check returns minimal public status — no internals, no memory, no uptime
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';

  try {
    const { db } = await import('@/server/db');
    await db.$queryRaw`SELECT 1 as ok`;
    dbStatus = 'connected';
  } catch {
    // DB connection failed — status remains 'disconnected'
  }

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 },
  );
}
