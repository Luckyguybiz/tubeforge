import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

export async function GET() {
  // Health check returns system status — no env vars, no secrets, no internals
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  let dbLatencyMs: number | null = null;

  try {
    const { db } = await import('@/server/db');
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1 as ok`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch {
    // DB connection failed — status remains 'disconnected'
  }

  const mem = process.memoryUsage();
  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      version: APP_VERSION,
      db: dbStatus,
      dbLatencyMs,
      uptime: process.uptime(),
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
      },
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 },
  );
}
