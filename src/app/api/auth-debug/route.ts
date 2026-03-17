import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Test NextAuth import
  try {
    const authModule = await import('@/server/auth');
    checks['auth_import'] = 'OK';
    checks['auth_exports'] = Object.keys(authModule);
  } catch (e) {
    checks['auth_import'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    checks['auth_stack'] = e instanceof Error ? e.stack?.split('\n').slice(0, 8) : undefined;
  }

  // 2. Test auth() function (session check)
  try {
    const { auth } = await import('@/server/auth');
    const session = await auth();
    checks['auth_session'] = session ? { user: session.user?.email } : 'no session (expected if not logged in)';
  } catch (e) {
    checks['auth_session'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    checks['auth_session_stack'] = e instanceof Error ? e.stack?.split('\n').slice(0, 5) : undefined;
  }

  // 3. Test PrismaAdapter
  try {
    const { PrismaAdapter } = await import('@auth/prisma-adapter');
    const { db } = await import('@/server/db');
    const adapter = PrismaAdapter(db);
    checks['prisma_adapter'] = 'OK';
    checks['adapter_methods'] = Object.keys(adapter).slice(0, 10);
  } catch (e) {
    checks['prisma_adapter'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. Test env module
  try {
    const { env } = await import('@/lib/env');
    checks['env_module'] = {
      AUTH_GOOGLE_ID: env.AUTH_GOOGLE_ID ? `SET (${env.AUTH_GOOGLE_ID.length} chars)` : 'MISSING',
      AUTH_GOOGLE_SECRET: env.AUTH_GOOGLE_SECRET ? `SET (${env.AUTH_GOOGLE_SECRET.length} chars)` : 'MISSING',
    };
  } catch (e) {
    checks['env_module'] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 5. Check NextAuth version
  try {
    const pkg = await import('next-auth/package.json');
    checks['nextauth_version'] = pkg.version;
  } catch {
    checks['nextauth_version'] = 'unknown';
  }

  return NextResponse.json(checks, { status: 200 });
}
