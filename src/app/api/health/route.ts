import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check env vars
  const envVars = [
    'AUTH_SECRET',
    'NEXTAUTH_SECRET',
    'AUTH_GOOGLE_ID',
    'AUTH_GOOGLE_SECRET',
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_APP_URL',
  ];
  for (const name of envVars) {
    const val = process.env[name];
    checks[`env_${name}`] = val ? `SET (${val.length} chars)` : 'MISSING';
  }

  // 2. Check database connection
  try {
    const { db } = await import('@/server/db');
    const result = await db.$queryRaw`SELECT 1 as ok`;
    checks['db_connection'] = `OK: ${JSON.stringify(result)}`;
  } catch (e) {
    checks['db_connection'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Check if Session table exists
  try {
    const { db } = await import('@/server/db');
    const count = await db.session.count();
    checks['db_session_table'] = `OK: ${count} sessions`;
  } catch (e) {
    checks['db_session_table'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. Check if User table exists
  try {
    const { db } = await import('@/server/db');
    const count = await db.user.count();
    checks['db_user_table'] = `OK: ${count} users`;
  } catch (e) {
    checks['db_user_table'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 5. Check if Account table exists
  try {
    const { db } = await import('@/server/db');
    const count = await db.account.count();
    checks['db_account_table'] = `OK: ${count} accounts`;
  } catch (e) {
    checks['db_account_table'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(checks, { status: 200 });
}
