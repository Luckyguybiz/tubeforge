import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/* ═══════════════════════════════════════════════════════════════════════
 * YouTube Download Stream API
 *
 * Strategy order (fastest → slowest):
 *   1. Cobalt API  — public service, works from any IP, fast (~2-5s)
 *   2. VPS yt-dlp  — self-hosted, if configured
 *   3. Innertube   — direct YouTube API, often blocked from datacenter IPs
 *
 * Key insight: YouTube blocks Vercel/AWS/GCP datacenter IPs from the
 * Innertube API. Cobalt runs on its own infrastructure with IPs that
 * YouTube doesn't block. So Cobalt should be the PRIMARY strategy.
 * ═══════════════════════════════════════════════════════════════════════ */

/* ─── Cobalt API ─────────────────────────────────────────────────────── */

/** Known public Cobalt API instances (tried in order) */
const COBALT_INSTANCES = [
  process.env.COBALT_API_URL, // user-configured takes priority
  'https://api.cobalt.tools',
].filter(Boolean) as string[];

interface CobaltResponse {
  status?: 'tunnel' | 'redirect' | 'stream' | 'picker' | 'error';
  url?: string;
  picker?: { url: string; type: string }[];
  error?: string;
}

/**
 * Try Cobalt API instances. Returns a direct download URL.
 * Cobalt handles YouTube downloads reliably from its own infrastructure.
 */
async function resolveViaCobalt(
  videoId: string,
  quality: string,
  audioOnly: boolean,
): Promise<string | null> {
  const qualityMap: Record<string, string> = {
    '1080p': '1080', '720p': '720', '480p': '480', '360p': '360',
  };

  const body: Record<string, unknown> = {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    videoQuality: qualityMap[quality] ?? '720',
    filenameStyle: 'pretty',
  };
  if (audioOnly) {
    body.downloadMode = 'audio';
    body.audioFormat = 'mp3';
  }

  for (const cobaltUrl of COBALT_INSTANCES) {
    try {
      console.log(`[yt-download] Trying Cobalt: ${cobaltUrl}`);
      const res = await fetch(cobaltUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        console.log(`[yt-download] Cobalt ${cobaltUrl} returned ${res.status}`);
        continue;
      }

      const data = (await res.json()) as CobaltResponse;
      console.log(`[yt-download] Cobalt response status: ${data.status}`);

      if (data.status === 'error') {
        console.log(`[yt-download] Cobalt error: ${data.error}`);
        continue;
      }

      // Direct URL (tunnel, redirect, or stream)
      if (data.url) {
        return data.url;
      }

      // Picker mode — pick the first video option
      if (data.status === 'picker' && data.picker && data.picker.length > 0) {
        return data.picker[0].url;
      }
    } catch (err) {
      console.log(`[yt-download] Cobalt ${cobaltUrl} failed:`, err instanceof Error ? err.message : 'unknown');
      continue;
    }
  }
  return null;
}

/* ─── VPS yt-dlp ─────────────────────────────────────────────────────── */

async function resolveViaVPS(
  videoId: string,
  quality: string,
  audioOnly: boolean,
  format: string,
): Promise<string | null> {
  const vpsBase = process.env.YT_DLP_API_URL;
  if (!vpsBase) return null;

  try {
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

/* ─── Innertube (last resort) ────────────────────────────────────────── */

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
    userAgent: 'com.google.android.apps.youtube.vr.oculus/1.57.29 (Linux; U; Android 12; eureka-user Build/SQ3A.220605.009.A1; Cronet/132.0.6834.14)',
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
    userAgent: 'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1 like Mac OS X)',
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

async function resolveViaInnertube(
  videoId: string,
  quality: string,
  audioOnly: boolean,
): Promise<{ url: string; mimeType: string; contentLength?: string; userAgent: string } | null> {
  for (const client of INNERTUBE_CLIENTS) {
    try {
      console.log(`[yt-download] Trying Innertube client: ${client.name}`);
      const res = await fetch(
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': client.userAgent,
          },
          body: JSON.stringify({ ...client.body, videoId }),
          signal: AbortSignal.timeout(5_000), // reduced from 8s
        },
      );

      if (!res.ok) continue;

      const data = (await res.json()) as InnertubeResponse;
      if (data.playabilityStatus?.status !== 'OK') {
        console.log(`[yt-download] Innertube ${client.name}: ${data.playabilityStatus?.status} - ${data.playabilityStatus?.reason}`);
        continue;
      }

      const formats = data.streamingData?.formats ?? [];
      const adaptiveFormats = data.streamingData?.adaptiveFormats ?? [];
      if (formats.length === 0 && adaptiveFormats.length === 0) continue;

      const result = pickBestFormat(formats, adaptiveFormats, quality, audioOnly);
      if (result) {
        console.log(`[yt-download] Innertube ${client.name} success!`);
        return { ...result, userAgent: client.userAgent };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function pickBestFormat(
  formats: InnertubeFormat[],
  adaptiveFormats: InnertubeFormat[],
  quality: string,
  audioOnly: boolean,
): { url: string; mimeType: string; contentLength?: string } | null {
  if (audioOnly) {
    const audioFmts = adaptiveFormats
      .filter((f) => f.url && f.mimeType?.startsWith('audio/') && !f.signatureCipher)
      .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
    if (audioFmts.length > 0) {
      return { url: audioFmts[0].url!, mimeType: audioFmts[0].mimeType ?? 'audio/mp4', contentLength: audioFmts[0].contentLength };
    }
    return null;
  }

  const qualityMap: Record<string, number> = { '1080p': 1080, '720p': 720, '480p': 480, '360p': 360 };
  const targetHeight = qualityMap[quality] ?? 720;

  // Prefer combined (muxed) formats — they have audio
  const combined = formats.filter((f) => f.url && !f.signatureCipher).sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  if (combined.length > 0) {
    let best = combined[0];
    for (const f of combined) {
      if ((f.height ?? 0) <= targetHeight) { best = f; break; }
    }
    return { url: best.url!, mimeType: best.mimeType ?? 'video/mp4', contentLength: best.contentLength };
  }

  // Adaptive video-only (no audio)
  const videoFmts = adaptiveFormats
    .filter((f) => f.url && f.mimeType?.startsWith('video/') && !f.signatureCipher)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  if (videoFmts.length > 0) {
    let best = videoFmts[0];
    for (const f of videoFmts) {
      if ((f.height ?? 0) <= targetHeight) { best = f; break; }
    }
    return { url: best.url!, mimeType: best.mimeType ?? 'video/mp4', contentLength: best.contentLength };
  }

  return null;
}

/** Build a streaming download response from an upstream fetch result */
function buildStreamResponse(upstream: Response, filename: string): Response {
  const headers = new Headers();
  headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/octet-stream');

  const contentRange = upstream.headers.get('Content-Range');
  if (contentRange) {
    const match = contentRange.match(/\/(\d+)$/);
    if (match) headers.set('Content-Length', match[1]);
  } else if (upstream.headers.get('Content-Length')) {
    headers.set('Content-Length', upstream.headers.get('Content-Length')!);
  }

  headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  headers.set('Cache-Control', 'no-cache, no-store');

  return new Response(upstream.body, { status: 200, headers });
}

/* ═══════════════════════════════════════════════════════════════════════
 * GET /api/tools/youtube-download/stream
 * ═══════════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  let downloadUserAgent = 'TubeForge/1.0';
  let strategySummary = '';

  // ── Mode A: Resolve videoId → download URL ─────────────────────────
  if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    console.log(`[yt-download] Resolving videoId=${videoId} quality=${quality} audioOnly=${audioOnly}`);

    // Strategy 1: Cobalt API (FASTEST — works from any IP)
    const cobaltUrl = await resolveViaCobalt(videoId, quality, audioOnly);
    if (cobaltUrl) {
      downloadUrl = cobaltUrl;
      downloadUserAgent = 'TubeForge/1.0';
      strategySummary = 'cobalt';
    }

    // Strategy 2: VPS yt-dlp (if configured)
    if (!downloadUrl) {
      const vpsUrl = await resolveViaVPS(videoId, quality, audioOnly, format);
      if (vpsUrl) {
        downloadUrl = vpsUrl;
        downloadUserAgent = 'TubeForge/1.0';
        strategySummary = 'vps';
      }
    }

    // Strategy 3: Innertube (often blocked from datacenter IPs)
    if (!downloadUrl) {
      const innertube = await resolveViaInnertube(videoId, quality, audioOnly);
      if (innertube) {
        downloadUrl = innertube.url;
        downloadUserAgent = innertube.userAgent;
        strategySummary = 'innertube';
      }
    }

    console.log(`[yt-download] Resolution result: ${strategySummary || 'FAILED'}`);

    if (!downloadUrl) {
      return NextResponse.json(
        {
          error: 'Не удалось найти источник для скачивания. YouTube блокирует этот контент с серверов.',
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
    const h = parsedUrl.hostname;

    // VPS
    if (YT_API_BASE) {
      try {
        const vpsUrl = new URL(YT_API_BASE);
        if (h === vpsUrl.hostname) allowed = true;
      } catch { /* invalid VPS URL */ }
    }

    // Cobalt CDN domains — use endsWith to prevent subdomain spoofing
    if (
      h === 'api.cobalt.tools' || h.endsWith('.cobalt.tools') ||
      h === 'co.wuk.sh' || h.endsWith('.co.wuk.sh') ||
      h.endsWith('.imput.net')
    ) allowed = true;

    // YouTube / Google — endsWith prevents googlevideo.com.evil.com bypass
    if (
      h.endsWith('.googlevideo.com') ||
      h.endsWith('.youtube.com') || h === 'youtube.com' ||
      h.endsWith('.googleusercontent.com')
    ) allowed = true;

    // TikTok — endsWith for safety
    if (
      h.endsWith('.tiktok.com') || h === 'tiktok.com' ||
      h.endsWith('.tiktokcdn.com') ||
      h.endsWith('.musical.ly')
    ) allowed = true;
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!allowed) {
    console.log(`[yt-download] URL not allowed: ${downloadUrl}`);
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  // ── Fetch and stream ──────────────────────────────────────────────
  try {
    const isGoogleVideo = downloadUrl.includes('googlevideo.com');

    const fetchHeaders: Record<string, string> = {
      'User-Agent': downloadUserAgent,
    };
    if (isGoogleVideo) {
      fetchHeaders['Range'] = 'bytes=0-';
    }

    const upstream = await fetch(downloadUrl, {
      signal: AbortSignal.timeout(300_000),
      headers: fetchHeaders,
      redirect: 'manual', // prevent SSRF via redirect to internal IPs
    });

    // Handle redirects safely — only follow if target is also on allowlist
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (location) {
        try {
          const redir = new URL(location, downloadUrl);
          const rh = redir.hostname;
          const redirectAllowed =
            rh.endsWith('.googlevideo.com') ||
            rh.endsWith('.youtube.com') || rh === 'youtube.com' ||
            rh.endsWith('.googleusercontent.com') ||
            rh === 'api.cobalt.tools' || rh.endsWith('.cobalt.tools') ||
            rh.endsWith('.imput.net') ||
            rh.endsWith('.tiktok.com') || rh === 'tiktok.com' ||
            rh.endsWith('.tiktokcdn.com');
          if (redirectAllowed && redir.protocol === 'https:') {
            // Re-fetch the redirect target
            const redirected = await fetch(redir.toString(), {
              signal: AbortSignal.timeout(300_000),
              headers: fetchHeaders,
              redirect: 'manual',
            });
            if (redirected.ok || redirected.status === 206) {
              // Continue with redirected response (fall through to streaming logic below)
              // We replace upstream reference via a wrapper
              return buildStreamResponse(redirected, filename);
            }
          }
        } catch { /* invalid redirect URL */ }
      }
      return NextResponse.json({ error: 'Redirect to disallowed host' }, { status: 403 });
    }

    if (!upstream.ok && upstream.status !== 206) {
      console.log(`[yt-download] Upstream returned ${upstream.status} from ${strategySummary}`);
      return NextResponse.json(
        { error: 'Download source returned an error' },
        { status: 502 },
      );
    }

    return buildStreamResponse(upstream, filename);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[yt-download] Stream error:', message);
    return NextResponse.json({ error: 'Ошибка при загрузке файла' }, { status: 502 });
  }
}
