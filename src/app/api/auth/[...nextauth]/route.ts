import { handlers } from '@/server/auth';
import { NextRequest } from 'next/server';

// Wrap handlers to catch and log any errors during OAuth callback
async function wrappedGET(req: NextRequest) {
  try {
    return await handlers.GET(req);
  } catch (error) {
    console.error('[auth][GET] Unhandled error:', error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return Response.json(
      { error: 'Auth handler failed', message, stack: stack?.split('\n').slice(0, 5) },
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
    return Response.json(
      { error: 'Auth handler failed', message },
      { status: 500 }
    );
  }
}

export { wrappedGET as GET, wrappedPOST as POST };
