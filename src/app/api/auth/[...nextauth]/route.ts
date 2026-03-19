import { handlers, getLastAuthError } from '@/server/auth';
import { NextRequest, NextResponse } from 'next/server';

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
    console.log('[auth-route] Callback domain:', url.hostname,
      'cookies:', req.cookies.getAll().map(c => c.name).filter(n => n.includes('auth')).join(', ') || 'none');
  }

  try {
    const response = await handlers[method](safeReq);

    // If callback redirected to error, intercept and show real error for debugging
    if (isCallback) {
      const location = response.headers.get('location') ?? '';
      if (location.includes('error=Configuration') || location.includes('error=InvalidCheck')) {
        const lastError = getLastAuthError();
        console.error('[auth-route] Callback failed. Location:', location, 'Last error:', lastError);

        // Show real error in non-production only
        if (process.env.VERCEL_ENV !== 'production') {
          return NextResponse.json({
            error: 'Auth callback failed',
            redirect: location,
            lastAuthError: lastError,
            hasNextUrl: !!req.nextUrl,
            cookies: Object.fromEntries(
              req.cookies.getAll().map(c => [c.name, c.value.substring(0, 20) + '...'])
            ),
          }, { status: 500 });
        }
      }
    }

    return response;
  } catch (error) {
    console.error('[auth-route] Unhandled error:', error);
    const lastError = getLastAuthError();
    return NextResponse.json({
      error: 'Auth handler threw',
      message: error instanceof Error ? error.message : String(error),
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
        lastAuthError: lastError,
        hasNextUrl: !!req.nextUrl,
      }),
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return wrappedHandler(req, 'GET');
}

export async function POST(req: NextRequest) {
  return wrappedHandler(req, 'POST');
}
