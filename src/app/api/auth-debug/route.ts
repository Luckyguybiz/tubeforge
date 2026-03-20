import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Always require admin auth — never expose debug info publicly
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Only admins can access debug info
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // In production, return minimal response even for admins
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ status: 'ok', user: session.user.email }, { status: 200 });
  }

  const checks: Record<string, unknown> = {};

  // 1. Test auth module loads
  checks['auth_module'] = 'OK (already loaded)';

  // 2. Test PrismaAdapter
  try {
    const { PrismaAdapter } = await import('@auth/prisma-adapter');
    const { db } = await import('@/server/db');
    PrismaAdapter(db);
    checks['prisma_adapter'] = 'OK';
  } catch (e) {
    checks['prisma_adapter'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Env presence only (no lengths — prevent brute-force info leakage)
  if (process.env.NODE_ENV === 'development') {
    const envVars = ['AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET', 'DATABASE_URL', 'STRIPE_SECRET_KEY'];
    for (const name of envVars) {
      checks[`env_${name}`] = process.env[name] ? 'SET' : 'MISSING';
    }
  }

  return NextResponse.json(checks, { status: 200 });
}
