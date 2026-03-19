import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
// Use Edge runtime for streaming — no body size limit & no execution timeout
export const runtime = 'edge';

/**
 * GET /api/tools/youtube-download/stream?url=<encoded_download_url>&filename=<name>
 *
 * Server-side proxy that fetches the download from the VPS (which may be HTTP)
 * and streams it to the client over HTTPS. This bypasses Mixed Content blocking.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 downloads per minute
  const { success: rlOk } = await rateLimit({
    identifier: `yt-dl-stream:${session.user.id}`,
    limit: 5,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const downloadUrl = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'video.mp4';

  if (!downloadUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate the URL — only allow our known VPS domains or cobalt API
  const YT_API_BASE = process.env.YT_DLP_API_URL || '';
  const COBALT_API = process.env.COBALT_API_URL || 'https://api.cobalt.tools';
  let allowed = false;

  try {
    const parsedUrl = new URL(downloadUrl);
    // Allow our VPS
    if (YT_API_BASE) {
      const vpsUrl = new URL(YT_API_BASE);
      if (parsedUrl.hostname === vpsUrl.hostname) allowed = true;
    }
    // Allow cobalt domains
    if (parsedUrl.hostname.includes('cobalt.tools') || parsedUrl.hostname.includes('co.wuk.sh')) {
      allowed = true;
    }
    // Allow common CDN/media domains used by cobalt
    if (parsedUrl.hostname.includes('googlevideo.com') || parsedUrl.hostname.includes('youtube.com')) {
      allowed = true;
    }
    // Allow TikTok CDN domains
    if (parsedUrl.hostname.includes('tiktok.com') || parsedUrl.hostname.includes('tiktokcdn.com') || parsedUrl.hostname.includes('musical.ly')) {
      allowed = true;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!allowed) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  try {
    // For googlevideo.com URLs (YouTube CDN), mimic the VR client user-agent
    // to match the session that generated the URL
    const isGoogleVideo = downloadUrl.includes('googlevideo.com');
    const upstream = await fetch(downloadUrl, {
      signal: AbortSignal.timeout(300_000), // 5 minute timeout for large files
      headers: {
        'User-Agent': isGoogleVideo
          ? 'com.google.android.apps.youtube.vr.oculus/1.56.21 (Linux; U; Android 12; eureka-user Build/SQ3A.220605.009.A1; Cronet/132.0.6834.14)'
          : 'TubeForge/1.0',
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status}` },
        { status: 502 },
      );
    }

    // Stream the response back to the client
    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/octet-stream');
    if (upstream.headers.get('Content-Length')) {
      headers.set('Content-Length', upstream.headers.get('Content-Length')!);
    }
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set('Cache-Control', 'no-cache, no-store');

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[youtube-download/stream] Error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch download' },
      { status: 502 },
    );
  }
}
