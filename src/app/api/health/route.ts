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

  // 6. Test Google OIDC discovery (can Vercel reach Google?)
  try {
    const res = await fetch('https://accounts.google.com/.well-known/openid-configuration');
    const data = await res.json();
    checks['google_oidc_discovery'] = `OK: token_endpoint=${data.token_endpoint}`;
  } catch (e) {
    checks['google_oidc_discovery'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 7. Test NextAuth callback handler directly with fake request
  try {
    const { handlers } = await import('@/server/auth');
    const fakeReq = new Request('https://tubeforge-luckyguybizs-projects.vercel.app/api/auth/callback/google?code=test&state=test');
    const response = await handlers.GET(fakeReq as any);
    const location = response.headers.get('location') ?? '';
    const status = response.status;
    checks['auth_callback_test'] = `status=${status}, location=${location}`;
    if (status >= 400 || location.includes('error')) {
      // Try to read response body
      try {
        const body = await response.text();
        checks['auth_callback_body'] = body.substring(0, 500);
      } catch { /* */ }
    }
  } catch (e) {
    checks['auth_callback_test'] = `THREW: ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`;
    if (e instanceof Error && e.stack) {
      checks['auth_callback_stack'] = e.stack.split('\n').slice(0, 8).join(' | ');
    }
  }

  return NextResponse.json(checks, { status: 200 });
}
