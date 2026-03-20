import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('yt-download');

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/* ═══════════════════════════════════════════════════════════════════════
 * YouTube Download Stream API
 *
 * Strategy order (fastest → slowest):
 *   1. Self-hosted Cobalt (localhost:9000) — local, no auth needed
 *   2. VPS get-url   — yt-dlp extracts direct CDN URL
 *   3. Public Cobalt  — api.cobalt.tools (requires JWT if configured)
 *   4. VPS full download — yt-dlp downloads the file on VPS
 *   5. Innertube     — direct YouTube API, often blocked from datacenter IPs
 * ═══════════════════════════════════════════════════════════════════════ */

/* ─── Cobalt API ─────────────────────────────────────────────────────── */

/** Known Cobalt API instances (tried in order) */
const COBALT_INSTANCES: { url: string; needsAuth: boolean }[] = [
  // Self-hosted takes priority — no auth needed
  ...(process.env.COBALT_API_URL
    ? [{ url: process.env.COBALT_API_URL, needsAuth: false }]
    : []),
  // Public instance — requires JWT auth via COBALT_API_KEY env var
  { url: 'https://api.cobalt.tools', needsAuth: true },
];

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

  for (const instance of COBALT_INSTANCES) {
    try {
      log.debug('Trying Cobalt instance', { instance: instance.url, needsAuth: instance.needsAuth });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // Add Authorization header for instances that require JWT auth
      if (instance.needsAuth) {
        const apiKey = process.env.COBALT_API_KEY;
        if (!apiKey) {
          log.debug('Skipping authed Cobalt instance — no COBALT_API_KEY set', { instance: instance.url });
          continue;
        }
        headers['Authorization'] = `Api-Key ${apiKey}`;
      }

      const res = await fetch(instance.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        log.debug('Cobalt returned non-OK status', { instance: instance.url, status: res.status, body: text.slice(0, 200) });
        continue;
      }

      const data = (await res.json()) as CobaltResponse;
      log.debug('Cobalt response', { status: data.status });

      if (data.status === 'error') {
        log.debug('Cobalt error response', { error: data.error });
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
      log.debug('Cobalt instance failed', { instance: instance.url, error: err instanceof Error ? err.message : 'unknown' });
      continue;
    }
  }
  return null;
}

/* ─── VPS get-url (extracts direct CDN URL via yt-dlp) ────────────── */

async function resolveViaVPSGetUrl(
  videoId: string,
  quality: string,
  audioOnly: boolean,
): Promise<string | null> {
  const vpsBase = process.env.YT_DLP_API_URL;
  if (!vpsBase) return null;

  try {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const params = new URLSearchParams({
      url: youtubeUrl,
      quality,
      audioOnly: audioOnly ? 'true' : 'false',
    });

    const res = await fetch(`${vpsBase}/get-url?${params}`, {
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      log.debug('VPS get-url returned error', { status: res.status });
      return null;
    }

    const data = await res.json();
    if (data.videoUrl) {
      log.debug('VPS get-url resolved', { urlCount: data.count });
      return data.videoUrl;
    }

    return null;
  } catch (err) {
    log.debug('VPS get-url failed', { error: err instanceof Error ? err.message : 'unknown' });
    return null;
  }
}

/* ─── VPS full download ─────────────────────────────────────────────── */

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
      log.debug('Trying Innertube client', { client: client.name });
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
        log.debug('Innertube playability not OK', {
          client: client.name,
          status: data.playabilityStatus?.status,
          reason: data.playabilityStatus?.reason,
        });
        continue;
      }

      const formats = data.streamingData?.formats ?? [];
      const adaptiveFormats = data.streamingData?.adaptiveFormats ?? [];
      if (formats.length === 0 && adaptiveFormats.length === 0) continue;

      const result = pickBestFormat(formats, adaptiveFormats, quality, audioOnly);
      if (result) {
        log.debug('Innertube resolved successfully', { client: client.name });
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
    log.info('Resolving video', { videoId, quality, audioOnly });

    // Strategy 1: Cobalt API (self-hosted first, then public with auth)
    const cobaltUrl = await resolveViaCobalt(videoId, quality, audioOnly);
    if (cobaltUrl) {
      downloadUrl = cobaltUrl;
      downloadUserAgent = 'TubeForge/1.0';
      strategySummary = 'cobalt';
    }

    // Strategy 2: VPS get-url (yt-dlp extracts direct CDN URL)
    if (!downloadUrl) {
      const cdnUrl = await resolveViaVPSGetUrl(videoId, quality, audioOnly);
      if (cdnUrl) {
        downloadUrl = cdnUrl;
        downloadUserAgent = 'TubeForge/1.0';
        strategySummary = 'vps-get-url';
      }
    }

    // Strategy 3: VPS full download (yt-dlp downloads the whole file)
    if (!downloadUrl) {
      const vpsUrl = await resolveViaVPS(videoId, quality, audioOnly, format);
      if (vpsUrl) {
        downloadUrl = vpsUrl;
        downloadUserAgent = 'TubeForge/1.0';
        strategySummary = 'vps';
      }
    }

    // Strategy 4: Innertube (often blocked from datacenter IPs)
    if (!downloadUrl) {
      const innertube = await resolveViaInnertube(videoId, quality, audioOnly);
      if (innertube) {
        downloadUrl = innertube.url;
        downloadUserAgent = innertube.userAgent;
        strategySummary = 'innertube';
      }
    }

    log.info('Resolution result', { strategy: strategySummary || 'FAILED', videoId });

    if (!downloadUrl) {
      return NextResponse.json(
        {
          error: 'Could not find a download source. YouTube blocks this content from servers.',
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
  const COBALT_BASE = process.env.COBALT_API_URL || '';
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

    // Self-hosted Cobalt (localhost / configured URL)
    if (COBALT_BASE) {
      try {
        const cobaltParsed = new URL(COBALT_BASE);
        if (h === cobaltParsed.hostname) allowed = true;
      } catch { /* invalid Cobalt URL */ }
    }
    // Always allow localhost (self-hosted Cobalt)
    if (h === 'localhost' || h === '127.0.0.1') allowed = true;

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
    log.warn('URL not on allowlist', { hostname: new URL(downloadUrl).hostname });
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
            rh === 'localhost' || rh === '127.0.0.1' ||
            rh.endsWith('.tiktok.com') || rh === 'tiktok.com' ||
            rh.endsWith('.tiktokcdn.com');
          if (redirectAllowed) {
            // Re-fetch the redirect target
            const redirected = await fetch(redir.toString(), {
              signal: AbortSignal.timeout(300_000),
              headers: fetchHeaders,
              redirect: 'manual',
            });
            if (redirected.ok || redirected.status === 206) {
              return buildStreamResponse(redirected, filename);
            }
          }
        } catch { /* invalid redirect URL */ }
      }
      return NextResponse.json({ error: 'Redirect to disallowed host' }, { status: 403 });
    }

    if (!upstream.ok && upstream.status !== 206) {
      log.warn('Upstream returned error', { status: upstream.status, strategy: strategySummary });
      return NextResponse.json(
        { error: 'Download source returned an error' },
        { status: 502 },
      );
    }

    return buildStreamResponse(upstream, filename);
  } catch (err) {
    log.error('Stream error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'File download failed' }, { status: 502 });
  }
}
