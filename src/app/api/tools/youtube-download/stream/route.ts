import { NextRequest, NextResponse } from 'next/server';
import { decode } from '@auth/core/jwt';

export const dynamic = 'force-dynamic';
// Use Edge runtime for streaming — no body size limit & no execution timeout
// CRITICAL: innertube + download must happen in the SAME Edge request (same IP)
// because YouTube signs stream URLs to the requester's IP address.
//
// IMPORTANT: Do NOT use auth() here — it calls Prisma (db.user.findUnique)
// in the session callback, and Prisma does NOT work in Edge Runtime.
// Use decode() from @auth/core/jwt to manually decrypt the Auth.js v5 JWE cookie.
//
// Auth.js v5 changed cookie names:
//   Production (HTTPS): __Secure-authjs.session-token
//   Development (HTTP):  authjs.session-token
// The cookie value is encrypted with A256CBC-HS512 using AUTH_SECRET as key.
export const runtime = 'edge';

/* ─── Edge-compatible rate limiter (in-memory, best-effort) ──────── */
const edgeRateLimit = new Map<string, { count: number; reset: number }>();

/* ─── Innertube types ─────────────────────────────────────────────── */

interface InnertubeFormat {
  itag?: number;
  url?: string;
  mimeType?: string;
  bitrate?: number;
  width?: number;
  height?: number;
  contentLength?: string;
  qualityLabel?: string;
  audioQuality?: string;
  quality?: string;
  signatureCipher?: string;
}

interface InnertubeResponse {
  playabilityStatus?: { status?: string; reason?: string };
  streamingData?: {
    formats?: InnertubeFormat[];
    adaptiveFormats?: InnertubeFormat[];
  };
}

const VR_USER_AGENT =
  'com.google.android.apps.youtube.vr.oculus/1.56.21 (Linux; U; Android 12; eureka-user Build/SQ3A.220605.009.A1; Cronet/132.0.6834.14)';

/**
 * Fetch stream URLs via YouTube's Innertube player API (ANDROID_VR client).
 * Must be called from the SAME edge node that will fetch the stream URL,
 * because YouTube signs URLs to the requester's IP address.
 */
async function resolveYouTubeStream(
  videoId: string,
  quality: string,
  audioOnly: boolean,
): Promise<{ url: string; mimeType: string; contentLength?: string } | null> {
  try {
    const res = await fetch(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': VR_USER_AGENT,
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: 'ANDROID_VR',
              clientVersion: '1.56.21',
              deviceMake: 'Oculus',
              deviceModel: 'Quest 3',
              osName: 'Android',
              osVersion: '12.0',
              androidSdkVersion: 32,
            },
          },
          contentCheckOk: true,
          racyCheckOk: true,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as InnertubeResponse;
    if (data.playabilityStatus?.status !== 'OK') return null;

    const formats = data.streamingData?.formats ?? [];
    const adaptiveFormats = data.streamingData?.adaptiveFormats ?? [];

    // Audio-only: find best audio stream
    if (audioOnly) {
      const audioFormats = adaptiveFormats
        .filter((f) => f.url && f.mimeType?.startsWith('audio/') && !f.signatureCipher)
        .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

      if (audioFormats.length > 0) {
        return {
          url: audioFormats[0].url!,
          mimeType: audioFormats[0].mimeType ?? 'audio/mp4',
          contentLength: audioFormats[0].contentLength,
        };
      }
      return null;
    }

    // Video: prefer combined format (video + audio)
    const qualityMap: Record<string, number> = {
      '1080p': 1080,
      '720p': 720,
      '480p': 480,
      '360p': 360,
    };
    const targetHeight = qualityMap[quality] ?? 720;

    // Combined formats (video + audio together)
    const combinedFormats = formats
      .filter((f) => f.url && !f.signatureCipher)
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

    if (combinedFormats.length > 0) {
      let best = combinedFormats[0];
      for (const f of combinedFormats) {
        if ((f.height ?? 0) <= targetHeight) {
          best = f;
          break;
        }
      }
      return {
        url: best.url!,
        mimeType: best.mimeType ?? 'video/mp4',
        contentLength: best.contentLength,
      };
    }

    // Fallback: adaptive video only (no audio track)
    const videoFormats = adaptiveFormats
      .filter(
        (f) =>
          f.url &&
          f.mimeType?.startsWith('video/') &&
          f.mimeType?.includes('mp4') &&
          !f.signatureCipher,
      )
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

    if (videoFormats.length > 0) {
      let best = videoFormats[0];
      for (const f of videoFormats) {
        if ((f.height ?? 0) <= targetHeight) {
          best = f;
          break;
        }
      }
      return {
        url: best.url!,
        mimeType: best.mimeType ?? 'video/mp4',
        contentLength: best.contentLength,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
 * GET /api/tools/youtube-download/stream
 *
 * Two modes:
 *   A) ?videoId=<id>&quality=<q>&audioOnly=<bool>&filename=<name>
 *      → Resolves stream URL via innertube + immediately streams download
 *        (both in the same Edge request = same IP = URL is valid)
 *
 *   B) ?url=<encoded_download_url>&filename=<name>
 *      → Direct proxy (for pre-resolved URLs, TikTok, etc.)
 * ═══════════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  // Manually decrypt the Auth.js v5 JWE session cookie.
  // Cannot use auth() — it triggers Prisma DB calls that crash in Edge Runtime.
  // Cannot use getToken() — it looks for "next-auth.session-token" cookie name
  // but Auth.js v5 uses "authjs.session-token" and encrypts as JWE.
  const secret = process.env.AUTH_SECRET ?? '';
  const isSecure = req.url.startsWith('https');
  const cookieName = isSecure
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';
  const cookieValue = req.cookies.get(cookieName)?.value;

  if (!cookieValue) {
    return NextResponse.json(
      { error: 'Unauthorized — no session cookie' },
      { status: 401 },
    );
  }

  let userId: string | undefined;
  try {
    // decode() decrypts the JWE token using AUTH_SECRET + cookie name as salt
    const decoded = await decode({ token: cookieValue, secret, salt: cookieName });
    userId = (decoded?.id as string) ?? decoded?.sub;
  } catch (err) {
    console.error('[youtube-download/stream] JWT decode error:', err);
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized — invalid session' },
      { status: 401 },
    );
  }

  // Simple in-memory rate limiting (best-effort in Edge)
  const now = Date.now();
  const rlKey = `yt-dl:${userId}`;
  const rlEntry = edgeRateLimit.get(rlKey);
  if (rlEntry && now < rlEntry.reset && rlEntry.count >= 10) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  if (!rlEntry || now >= rlEntry.reset) {
    edgeRateLimit.set(rlKey, { count: 1, reset: now + 60_000 });
  } else {
    rlEntry.count++;
  }

  const videoId = req.nextUrl.searchParams.get('videoId');
  const quality = req.nextUrl.searchParams.get('quality') || '720p';
  const audioOnly = req.nextUrl.searchParams.get('audioOnly') === 'true';
  let downloadUrl = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'video.mp4';

  // ── Mode A: Resolve via innertube (same edge node = same IP) ──────
  if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    const stream = await resolveYouTubeStream(videoId, quality, audioOnly);
    if (!stream) {
      return NextResponse.json(
        {
          error: 'This video requires YouTube sign-in to download. Try a different video.',
          status: 'login_required',
        },
        { status: 503 },
      );
    }
    downloadUrl = stream.url;
  }

  if (!downloadUrl) {
    return NextResponse.json({ error: 'Missing url or videoId parameter' }, { status: 400 });
  }

  // ── URL validation ────────────────────────────────────────────────
  const YT_API_BASE = process.env.YT_DLP_API_URL || '';
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
    // Allow YouTube CDN
    if (parsedUrl.hostname.includes('googlevideo.com') || parsedUrl.hostname.includes('youtube.com')) {
      allowed = true;
    }
    // Allow TikTok CDN domains
    if (
      parsedUrl.hostname.includes('tiktok.com') ||
      parsedUrl.hostname.includes('tiktokcdn.com') ||
      parsedUrl.hostname.includes('musical.ly')
    ) {
      allowed = true;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!allowed) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  // ── Fetch and stream ──────────────────────────────────────────────
  try {
    const isGoogleVideo = downloadUrl.includes('googlevideo.com');
    const upstream = await fetch(downloadUrl, {
      signal: AbortSignal.timeout(300_000), // 5 minute timeout for large files
      headers: {
        'User-Agent': isGoogleVideo ? VR_USER_AGENT : 'TubeForge/1.0',
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
