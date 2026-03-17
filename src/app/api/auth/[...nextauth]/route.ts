import { handlers, getLastAuthError } from '@/server/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Wrap NextAuth handlers to capture and expose the real error
 * instead of the opaque "Configuration" redirect.
 *
 * Once auth is working, this can be simplified back to:
 *   export const { GET, POST } = handlers;
 */

async function wrappedHandler(req: NextRequest, method: 'GET' | 'POST') {
  const url = new URL(req.url);
  const isCallback = url.pathname.includes('/callback/');

  try {
    const response = await handlers[method](req);

    // If this is a callback and it redirected to error=Configuration,
    // intercept and show the real error for debugging
    if (isCallback) {
      const location = response.headers.get('location') ?? '';
      if (location.includes('error=Configuration') || location.includes('error=InvalidCheck')) {
        const lastError = getLastAuthError();
        console.error('[auth-route] Callback failed. Location:', location, 'Last error:', lastError);

        // In development or if ?debug is present, show the real error
        if (process.env.NODE_ENV !== 'production' || url.searchParams.has('debug')) {
          return NextResponse.json({
            error: 'Auth callback failed',
            redirect: location,
            lastAuthError: lastError,
            cookies: Object.fromEntries(
              req.cookies.getAll().map(c => [c.name, c.value.substring(0, 20) + '...'])
            ),
          }, { status: 500 });
        }
      }
    }

    return response;
  } catch (error) {
    // NextAuth internal error that escaped the catch block
    console.error('[auth-route] Unhandled error:', error);
    const lastError = getLastAuthError();
    return NextResponse.json({
      error: 'Auth handler threw',
      message: error instanceof Error ? error.message : String(error),
      lastAuthError: lastError,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return wrappedHandler(req, 'GET');
}

export async function POST(req: NextRequest) {
  return wrappedHandler(req, 'POST');
}
