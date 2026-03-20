import { handlers, getLastAuthError } from '@/server/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('auth-route');

/**
 * Ensure the request is a proper NextRequest with nextUrl.
 * Next.js 16 may pass different request types to route handlers,
 * and NextAuth's reqWithEnvURL() requires nextUrl.
 */
function ensureNextRequest(req: NextRequest): NextRequest {
  if (req.nextUrl) return req;
  // Wrap plain Request as NextRequest to add nextUrl
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(req.url, req as any);
}

async function wrappedHandler(req: NextRequest, method: 'GET' | 'POST') {
  // Safety: ensure AUTH_URL stays deleted even if module cache is stale
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;

  const safeReq = ensureNextRequest(req);
  const url = new URL(req.url);
  const isCallback = url.pathname.includes('/callback/');

  // Log domain info on callbacks so we can verify cookie domain matches
  if (isCallback) {
    log.debug('Callback domain check', {
      hostname: url.hostname,
      authCookies: req.cookies.getAll().map(c => c.name).filter(n => n.includes('auth')).join(', ') || 'none',
    });
  }

  try {
    const response = await handlers[method](safeReq);

    // If callback redirected to error, intercept and show real error for debugging
    if (isCallback) {
      const location = response.headers.get('location') ?? '';
      if (location.includes('error=Configuration') || location.includes('error=InvalidCheck')) {
        const lastError = getLastAuthError();
        log.error('Callback failed', {
          location,
          lastError: lastError ? JSON.stringify(lastError) : 'none',
        });

        // Never expose internal auth details to client
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
      }
    }

    return response;
  } catch (error) {
    log.error('Unhandled error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Authentication service error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return wrappedHandler(req, 'GET');
}

export async function POST(req: NextRequest) {
  return wrappedHandler(req, 'POST');
}
