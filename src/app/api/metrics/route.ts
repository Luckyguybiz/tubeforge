import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { getMetrics, getErrorSummary } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Admin-only metrics endpoint.
 * Returns: total requests, error rate, avg response time, top endpoints,
 * memory usage, and recent error summary.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const metrics = getMetrics();
  const errors = getErrorSummary();

  return NextResponse.json({
    ...metrics,
    errors,
    generatedAt: new Date().toISOString(),
  });
}
