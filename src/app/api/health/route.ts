import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check ALL auth-related env vars
  const envVars = [
    'AUTH_SECRET',
    'NEXTAUTH_SECRET',
    'AUTH_URL',
    'NEXTAUTH_URL',
    'AUTH_GOOGLE_ID',
    'AUTH_GOOGLE_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_APP_URL',
    'VERCEL_URL',
    'VERCEL_ENV',
    'VERCEL_BRANCH_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
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

  // 3. Check if User table exists
  try {
    const { db } = await import('@/server/db');
    const count = await db.user.count();
    checks['db_user_table'] = `OK: ${count} users`;
  } catch (e) {
    checks['db_user_table'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. Check if Account table exists
  try {
    const { db } = await import('@/server/db');
    const count = await db.account.count();
    checks['db_account_table'] = `OK: ${count} accounts`;
  } catch (e) {
    checks['db_account_table'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 5. Test Google OIDC discovery
  try {
    const res = await fetch('https://accounts.google.com/.well-known/openid-configuration');
    const data = await res.json();
    checks['google_oidc_discovery'] = `OK: token_endpoint=${data.token_endpoint}`;
  } catch (e) {
    checks['google_oidc_discovery'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 6. Check last auth error (if any)
  try {
    const { getLastAuthError } = await import('@/server/auth');
    const lastError = getLastAuthError();
    checks['last_auth_error'] = lastError ? JSON.stringify(lastError) : 'none';
  } catch (e) {
    checks['last_auth_error'] = `IMPORT ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 7. Check auth module loads
  try {
    const { auth } = await import('@/server/auth');
    checks['auth_module'] = 'OK: loaded';
  } catch (e) {
    checks['auth_module'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(checks, { status: 200 });
}
