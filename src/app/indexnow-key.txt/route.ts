import { NextResponse } from 'next/server';

/**
 * GET /indexnow-key.txt
 *
 * Serves the IndexNow verification key as a plain-text response.
 * This acts as a fallback in case the static file in /public/ is not served
 * correctly (e.g., behind certain reverse-proxy configurations).
 *
 * Search engines fetch this file to verify ownership of the IndexNow key.
 */

const INDEXNOW_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';

export function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
