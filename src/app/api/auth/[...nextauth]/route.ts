import { handlers } from '@/server/auth';
import { NextRequest } from 'next/server';

async function wrappedGET(req: NextRequest) {
  try {
    const response = await handlers.GET(req);

    // Intercept: if NextAuth redirects to error=Configuration, expose the real error
    const location = response.headers.get('Location') ?? '';
    if (location.includes('error=Configuration')) {
      // Return debug info instead of redirecting to error page
      return Response.json({
        intercepted: true,
        message: 'NextAuth redirected to error=Configuration. This means an internal error occurred during the OAuth callback.',
        redirect_url: location,
        request_url: req.url,
        request_path: req.nextUrl.pathname,
        search_params: Object.fromEntries(req.nextUrl.searchParams),
        hint: 'Check Vercel Function Logs for the actual error (logged by NextAuth logger.error before this redirect)',
      }, { status: 500 });
    }

    return response;
  } catch (error) {
    console.error('[auth][GET] Unhandled error:', error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return Response.json(
      { error: 'Auth handler threw', message, stack: stack?.split('\n').slice(0, 10) },
      { status: 500 }
    );
  }
}

async function wrappedPOST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (error) {
    console.error('[auth][POST] Unhandled error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: 'Auth POST handler threw', message }, { status: 500 });
  }
}

export { wrappedGET as GET, wrappedPOST as POST };
