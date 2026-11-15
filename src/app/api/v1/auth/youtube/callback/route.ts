import { handleConnectCallback } from '@/lib/autopost/youtube-connect';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/auth/youtube/callback?code=…&state=…
 *
 * Dedicated return URI of the connect flow started by
 * /api/v1/auth/youtube/start. It is used only when YOUTUBE_CONNECT_CALLBACK_URL
 * points here and the URI is registered for the Google OAuth client; by
 * default the flow returns through /api/auth/callback/google, which hands
 * the request to the same handler.
 *
 * No API key required: auth is the signed state parameter.
 */
export async function GET(req: Request) {
  return handleConnectCallback(req);
}
