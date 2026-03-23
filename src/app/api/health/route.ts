import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';

  try {
    const { db } = await import('@/server/db');
    await db.$queryRaw`SELECT 1 as ok`;
    dbStatus = 'connected';
  } catch {
    // DB connection failed — status remains 'disconnected'
  }

  const isHealthy = dbStatus === 'connected';
  const m = getMetrics();

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: m.uptime,
      requests: m.totalRequests,
      errors: m.totalErrors,
      avgResponseMs: m.avgResponseTimeMs,
      memory: m.memory,
    },
    { status: isHealthy ? 200 : 503 },
  );
}
