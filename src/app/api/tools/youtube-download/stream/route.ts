import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// ── Node runtime (NOT Edge) ──────────────────────────────────────────
// We intentionally use Node runtime because:
// 1. YouTube blocks Innertube API calls from Edge/CloudFlare IPs
// 2. Innertube works fine from AWS Lambda IPs (Node serverless)
// 3. YouTube signs stream URLs to the requester's IP — resolution and
//    download MUST happen from the same runtime (same IP)
// 4. auth() with Prisma works in Node runtime
//
// Vercel serverless streaming: once the first byte is sent, the
// connection stays alive beyond the initial function timeout.
export const maxDuration = 300; // 5 minutes max (Pro plan)

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

/* ─── Multiple Innertube clients to try ───────────────────────────── */

const INNERTUBE_CLIENTS = [
  {
    name: 'ANDROID_VR',
    body: {
      context: {
        client: {
          clientName: 'ANDROID_VR',
          clientVersion: '1.57.29',
          deviceMake: 'Oculus',
          deviceModel: 'Quest 3',
          osName: 'Android',
          osVersion: '12.0',
          androidSdkVersion: 32,
        },
      },
      contentCheckOk: true,
      racyCheckOk: true,
    },
    userAgent:
      'com.google.android.apps.youtube.vr.oculus/1.57.29 (Linux; U; Android 12; eureka-user Build/SQ3A.220605.009.A1; Cronet/132.0.6834.14)',
  },
  {
    name: 'ANDROID_TESTSUITE',
    body: {
      context: {
        client: {
          clientName: 'ANDROID_TESTSUITE',
          clientVersion: '1.9',
          androidSdkVersion: 31,
          osName: 'Android',
          osVersion: '12',
        },
      },
      contentCheckOk: true,
      racyCheckOk: true,
    },
    userAgent:
      'com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip',
  },
  {
    name: 'IOS',
    body: {
      context: {
        client: {
          clientName: 'IOS',
          clientVersion: '19.45.4',
          deviceMake: 'Apple',
          deviceModel: 'iPhone16,2',
          osName: 'iPhone',
          osVersion: '18.1.0.22B83',
        },
      },
      contentCheckOk: true,
      racyCheckOk: true,
    },
    userAgent:
      'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1 like Mac OS X)',
  },
  {
    name: 'TV_EMBEDDED',
    body: {
      context: {
        client: {
          clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
          clientVersion: '2.0',
        },
      },
      contentCheckOk: true,
      racyCheckOk: true,
    },
    userAgent: 'Mozilla/5.0',
  },
];

/**
 * Try all Innertube clients to resolve stream URLs.
 * Returns the first successful result with playable URLs.
 */
async function resolveViaInnertube(
  videoId: string,
  quality: string,
  audioOnly: boolean,
): Promise<{ url: string; mimeType: string; contentLength?: string; userAgent: string } | null> {
  for (const client of INNERTUBE_CLIENTS) {
    try {
      const res = await fetch(
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': client.userAgent,
          },
          body: JSON.stringify({ ...client.body, videoId }),
          signal: AbortSignal.timeout(8_000),
        },
      );

      if (!res.ok) continue;

      const data = (await res.json()) as InnertubeResponse;
      if (data.playabilityStatus?.status !== 'OK') continue;

      const formats = data.streamingData?.formats ?? [];
      const adaptiveFormats = data.streamingData?.adaptiveFormats ?? [];

      if (formats.length === 0 && adaptiveFormats.length === 0) continue;

      const result = pickBestFormat(formats, adaptiveFormats, quality, audioOnly);
      if (result) {
        return { ...result, userAgent: client.userAgent };
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Pick the best format matching the requested quality.
 */
function pickBestFormat(
  formats: InnertubeFormat[],
  adaptiveFormats: InnertubeFormat[],
  quality: string,
  audioOnly: boolean,
): { url: string; mimeType: string; contentLength?: string } | null {
  // Audio-only
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

  const qualityMap: Record<string, number> = {
    '1080p': 1080, '720p': 720, '480p': 480, '360p': 360,
  };
  const targetHeight = qualityMap[quality] ?? 720;

  // Combined formats (video + audio together — preferred)
  const combined = formats
    .filter((f) => f.url && !f.signatureCipher)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  if (combined.length > 0) {
    let best = combined[0];
    for (const f of combined) {
      if ((f.height ?? 0) <= targetHeight) { best = f; break; }
    }
    return {
      url: best.url!,
      mimeType: best.mimeType ?? 'video/mp4',
      contentLength: best.contentLength,
    };
  }

  // Adaptive video only (no audio)
  const videoFormats = adaptiveFormats
    .filter((f) => f.url && f.mimeType?.startsWith('video/') && !f.signatureCipher)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  if (videoFormats.length > 0) {
    let best = videoFormats[0];
    for (const f of videoFormats) {
      if ((f.height ?? 0) <= targetHeight) { best = f; break; }
    }
    return {
      url: best.url!,
      mimeType: best.mimeType ?? 'video/mp4',
      contentLength: best.contentLength,
    };
  }

  return null;
}

/**
 * Try VPS (yt-dlp) as fallback. Returns a direct download URL.
 */
async function resolveViaVPS(
  videoId: string,
  quality: string,
  audioOnly: boolean,
  format: string,
): Promise<string | null> {
  const vpsBase = process.env.YT_DLP_API_URL;
  if (!vpsBase) return null;

  try {
    // Check health first
    const health = await fetch(`${vpsBase}/health`, {
      signal: AbortSignal.timeout(3_000),
    }).catch(() => null);
    if (!health?.ok) return null;

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return `${vpsBase}/download?url=${encodeURIComponent(youtubeUrl)}&quality=${encodeURIComponent(quality)}&format=${encodeURIComponent(format)}&audioOnly=${audioOnly ? 'true' : 'false'}`;
  } catch {
    return null;
  }
}

/**
 * Try Cobalt API as fallback. Returns a direct download URL.
 */
async function resolveViaCobalt(
  videoId: string,
  quality: string,
  audioOnly: boolean,
): Promise<string | null> {
  const cobaltUrl = process.env.COBALT_API_URL;
  if (!cobaltUrl) return null;

  try {
    const qualityMap: Record<string, string> = {
      '1080p': '1080', '720p': '720', '480p': '480', '360p': '360',
    };

    const body: Record<string, unknown> = {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoQuality: qualityMap[quality] ?? '720',
      filenameStyle: 'pretty',
    };
    if (audioOnly) {
      body.isAudioOnly = true;
      body.audioFormat = 'mp3';
    }

    const res = await fetch(cobaltUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { url?: string };
      if (data.url) return data.url;
    }
  } catch {
    // ignore
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
 * GET /api/tools/youtube-download/stream
 *
 * Multi-strategy YouTube download with streaming proxy.
 * All resolution + download happens from the SAME Node serverless
 * function (same IP), solving YouTube's IP-signed URL problem.
 *
 * Strategies (in order):
 *   1. Innertube (ANDROID_VR → ANDROID_TESTSUITE → IOS → TV_EMBEDDED)
 *   2. Self-hosted yt-dlp VPS (if YT_DLP_API_URL env is set)
 *   3. Cobalt API (if COBALT_API_URL env is set)
 *
 * Modes:
 *   A) ?videoId=<id>&quality=<q> → resolve + stream
 *   B) ?url=<direct_url> → proxy only (TikTok, pre-resolved, etc.)
 * ═══════════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  // auth() works in Node runtime (Prisma available)
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 10 downloads per minute
  const { success: rlOk } = await rateLimit({
    identifier: `yt-dl-stream:${session.user.id}`,
    limit: 10,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const videoId = req.nextUrl.searchParams.get('videoId');
  const quality = req.nextUrl.searchParams.get('quality') || '720p';
  const audioOnly = req.nextUrl.searchParams.get('audioOnly') === 'true';
  const format = req.nextUrl.searchParams.get('format') || 'mp4';
  let downloadUrl = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'video.mp4';

  // User-Agent to use when fetching the resolved URL
  let downloadUserAgent = 'TubeForge/1.0';

  // ── Mode A: Resolve videoId → download URL ─────────────────────────
  if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    // Strategy 1: Innertube (multiple clients)
    const innertube = await resolveViaInnertube(videoId, quality, audioOnly);
    if (innertube) {
      downloadUrl = innertube.url;
      downloadUserAgent = innertube.userAgent;
    }

    // Strategy 2: VPS (yt-dlp)
    if (!downloadUrl) {
      const vpsUrl = await resolveViaVPS(videoId, quality, audioOnly, format);
      if (vpsUrl) {
        downloadUrl = vpsUrl;
        downloadUserAgent = 'TubeForge/1.0';
      }
    }

    // Strategy 3: Cobalt API
    if (!downloadUrl) {
      const cobaltUrl = await resolveViaCobalt(videoId, quality, audioOnly);
      if (cobaltUrl) {
        downloadUrl = cobaltUrl;
        downloadUserAgent = 'TubeForge/1.0';
      }
    }

    if (!downloadUrl) {
      return NextResponse.json(
        {
          error: 'Could not find a download source for this video. YouTube may be blocking this content.',
          watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        },
        { status: 503 },
      );
    }
  }

  // ── Mode B: Direct proxy ────────────────────────────────────────────
  if (!downloadUrl) {
    return NextResponse.json({ error: 'Missing url or videoId parameter' }, { status: 400 });
  }

  // ── URL validation ──────────────────────────────────────────────────
  const YT_API_BASE = process.env.YT_DLP_API_URL || '';
  let allowed = false;

  try {
    const parsedUrl = new URL(downloadUrl);
    if (YT_API_BASE) {
      try {
        const vpsUrl = new URL(YT_API_BASE);
        if (parsedUrl.hostname === vpsUrl.hostname) allowed = true;
      } catch { /* invalid VPS URL */ }
    }
    if (parsedUrl.hostname.includes('cobalt.tools') || parsedUrl.hostname.includes('co.wuk.sh'))
      allowed = true;
    if (parsedUrl.hostname.includes('googlevideo.com') || parsedUrl.hostname.includes('youtube.com'))
      allowed = true;
    if (
      parsedUrl.hostname.includes('tiktok.com') ||
      parsedUrl.hostname.includes('tiktokcdn.com') ||
      parsedUrl.hostname.includes('musical.ly')
    )
      allowed = true;
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!allowed) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  // ── Fetch and stream ────────────────────────────────────────────────
  try {
    const upstream = await fetch(downloadUrl, {
      signal: AbortSignal.timeout(300_000), // 5 min timeout for large files
      headers: {
        'User-Agent': downloadUserAgent,
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Download source returned ${upstream.status}` },
        { status: 502 },
      );
    }

    // Stream the response back to the client
    const headers = new Headers();
    headers.set(
      'Content-Type',
      upstream.headers.get('Content-Type') || 'application/octet-stream',
    );
    if (upstream.headers.get('Content-Length')) {
      headers.set('Content-Length', upstream.headers.get('Content-Length')!);
    }
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    headers.set('Cache-Control', 'no-cache, no-store');

    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[youtube-download/stream] Error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch download' },
      { status: 502 },
    );
  }
}
