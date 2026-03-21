import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const ytLog = createLogger('youtube-download');

export const dynamic = 'force-dynamic';

/**
 * Extract a YouTube video ID from various URL formats.
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

interface OEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

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
  audioSampleRate?: string;
  quality?: string;
  signatureCipher?: string;
}

interface InnertubeResponse {
  playabilityStatus?: {
    status?: string;
    reason?: string;
  };
  streamingData?: {
    formats?: InnertubeFormat[];
    adaptiveFormats?: InnertubeFormat[];
    expiresInSeconds?: string;
  };
  videoDetails?: {
    videoId?: string;
    title?: string;
    lengthSeconds?: string;
    channelId?: string;
    shortDescription?: string;
    author?: string;
  };
}

/* ─── Innertube client configs to try (in order of reliability) ──── */

const INNERTUBE_CLIENTS = [
  {
    name: 'ANDROID_VR',
    body: {
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
    },
    userAgent:
      'com.google.android.apps.youtube.vr.oculus/1.56.21 (Linux; U; Android 12; eureka-user Build/SQ3A.220605.009.A1; Cronet/132.0.6834.14)',
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
];

/**
 * Fetch stream URLs via YouTube's Innertube player API.
 * Tries multiple client configurations for best success rate.
 */
async function fetchInnertubeStreams(
  videoId: string,
): Promise<{ formats: InnertubeFormat[]; adaptiveFormats: InnertubeFormat[] } | null> {
  for (const client of INNERTUBE_CLIENTS) {
    try {
      const payload = {
        ...client.body,
        videoId,
      };

      const res = await fetch(
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': client.userAgent,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!res.ok) continue;

      const data = (await res.json()) as InnertubeResponse;

      if (data.playabilityStatus?.status !== 'OK') continue;

      const formats = data.streamingData?.formats ?? [];
      const adaptiveFormats = data.streamingData?.adaptiveFormats ?? [];

      if (formats.length === 0 && adaptiveFormats.length === 0) continue;

      return { formats, adaptiveFormats };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Find the best matching format for requested quality.
 */
function findBestFormat(
  formats: InnertubeFormat[],
  adaptiveFormats: InnertubeFormat[],
  quality: string,
  audioOnly: boolean,
): { url: string; mimeType: string; contentLength?: string } | null {
  // Audio-only: find best audio stream
  if (audioOnly) {
    const audioFormats = adaptiveFormats
      .filter(
        (f) =>
          f.url &&
          f.mimeType?.startsWith('audio/') &&
          !f.signatureCipher,
      )
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

  // Video: try to find matching quality in adaptive formats first (higher quality)
  const qualityMap: Record<string, number> = {
    '1080p': 1080,
    '720p': 720,
    '480p': 480,
    '360p': 360,
  };

  const targetHeight = qualityMap[quality] ?? 720;

  // First try adaptive formats (video-only, but higher quality available)
  // For adaptive, we'd need to merge audio+video which is complex.
  // So prefer combined formats (video+audio) first.

  // Combined formats (video + audio together — simpler, no merge needed)
  const combinedFormats = formats
    .filter((f) => f.url && !f.signatureCipher)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  if (combinedFormats.length > 0) {
    // Find closest quality match
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

  // Fallback: use adaptive video (no audio, but at least something)
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
}

/* ══════════════════════════════════════════════════════════════════════
 * GET /api/tools/youtube-download?url=<youtube_url>
 *
 * Returns video metadata fetched via YouTube's free oEmbed endpoint.
 * ══════════════════════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rlOk, reset } = await rateLimit({
    identifier: `yt-dl-info:${session.user.id}`,
    limit: 10,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing "url" query parameter' },
      { status: 400 },
    );
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.' },
      { status: 400 },
    );
  }

  try {
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

    const oembedRes = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'TubeForge/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!oembedRes.ok) {
      if (oembedRes.status === 401 || oembedRes.status === 403) {
        return NextResponse.json(
          { error: 'This video is private or restricted.' },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: 'Video not found. Please check the URL and try again.' },
        { status: 404 },
      );
    }

    const data = (await oembedRes.json()) as OEmbedResponse;

    return NextResponse.json({
      videoId,
      title: data.title,
      channel: data.author_name,
      channelUrl: data.author_url,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnailHq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailMq: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      watchUrl: canonicalUrl,
      formats: [
        { quality: '1080p', ext: 'mp4', label: 'Full HD' },
        { quality: '720p', ext: 'mp4', label: 'HD' },
        { quality: '480p', ext: 'mp4', label: 'SD' },
        { quality: '360p', ext: 'mp4', label: 'Low' },
        { quality: 'Audio', ext: 'mp3', label: 'Audio Only' },
      ],
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Request timed out. YouTube may be slow — please try again.'
        : 'Failed to fetch video information. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/* ══════════════════════════════════════════════════════════════════════
 * POST /api/tools/youtube-download
 *
 * Multi-strategy YouTube download:
 *   1. YouTube Innertube API (ANDROID_VR client) — no external deps
 *   2. Self-hosted yt-dlp VPS (if YT_DLP_API_URL is set)
 *   3. Cobalt API (if COBALT_API_URL is set)
 *   4. Fallback error with watch URL
 *
 * Body: { videoId: string, quality?: string, format?: string, audioOnly?: boolean }
 * ══════════════════════════════════════════════════════════════════════ */

const YT_API_BASE = process.env.YT_DLP_API_URL;
const COBALT_API_URL = process.env.COBALT_API_URL;

const youtubeDownloadSchema = z.object({
  videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid videoId'),
  quality: z.enum(['1080p', '720p', '480p', '360p', 'Audio']).optional(),
  format: z.string().max(10).optional(),
  audioOnly: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rlOk, reset } = await rateLimit({
    identifier: `yt-dl-download:${session.user.id}`,
    limit: 5,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = youtubeDownloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { videoId, quality, format, audioOnly } = parsed.data;

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // ── Strategy 1: YouTube Innertube API (ANDROID_VR) ────────────────
  try {
    const streams = await fetchInnertubeStreams(videoId);

    if (streams) {
      const bestFormat = findBestFormat(
        streams.formats,
        streams.adaptiveFormats,
        quality ?? '720p',
        audioOnly ?? false,
      );

      if (bestFormat) {
        const ext = audioOnly ? 'mp3' : (format?.toLowerCase() ?? 'mp4');
        return NextResponse.json({
          downloadUrl: bestFormat.url,
          filename: `${videoId}.${ext}`,
          contentLength: bestFormat.contentLength,
          mimeType: bestFormat.mimeType,
          status: 'redirect',
          source: 'innertube',
        });
      }
    }
  } catch (err) {
    ytLog.error('Innertube error', { error: err instanceof Error ? err.message : String(err) });
    // Fall through to next strategy
  }

  // ── Strategy 2: Self-hosted yt-dlp VPS ────────────────────────────
  if (YT_API_BASE) {
    try {
      const downloadUrl = `${YT_API_BASE}/download?url=${encodeURIComponent(youtubeUrl)}&quality=${encodeURIComponent(quality ?? '720p')}&format=${encodeURIComponent(format ?? 'mp4')}&audioOnly=${audioOnly ? 'true' : 'false'}`;

      // Verify the VPS is reachable before returning the URL
      const healthCheck = await fetch(`${YT_API_BASE}/health`, {
        signal: AbortSignal.timeout(3_000),
      }).catch(() => null);

      if (healthCheck?.ok) {
        return NextResponse.json({
          downloadUrl,
          filename: `${videoId}.${audioOnly ? 'mp3' : format ?? 'mp4'}`,
          status: 'redirect',
          source: 'vps',
        });
      }
    } catch {
      // Fall through to cobalt API
    }
  }

  // ── Strategy 3: Cobalt API ────────────────────────────────────────
  if (COBALT_API_URL) {
    try {
      const qualityMap: Record<string, string> = {
        '1080p': '1080',
        '720p': '720',
        '480p': '480',
        '360p': '360',
        audio: '128',
      };

      const cobaltBody: Record<string, unknown> = {
        url: youtubeUrl,
        videoQuality: qualityMap[quality ?? '720p'] ?? '720',
        filenameStyle: 'pretty',
      };

      if (audioOnly) {
        cobaltBody.isAudioOnly = true;
        cobaltBody.audioFormat = 'mp3';
      }

      const cobaltRes = await fetch(COBALT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(cobaltBody),
        signal: AbortSignal.timeout(15_000),
      });

      if (cobaltRes.ok) {
        const cobaltData = (await cobaltRes.json()) as { status?: string; url?: string };
        if (cobaltData.url) {
          return NextResponse.json({
            downloadUrl: cobaltData.url,
            filename: `${videoId}.${audioOnly ? 'mp3' : format ?? 'mp4'}`,
            status: cobaltData.status ?? 'redirect',
            source: 'cobalt',
          });
        }
      }
    } catch {
      // Fall through to error
    }
  }

  // ── Strategy 4: Fallback error ────────────────────────────────────
  return NextResponse.json(
    {
      error:
        'This video requires YouTube sign-in to download. Please try a different video or use a browser extension.',
      watchUrl: youtubeUrl,
    },
    { status: 503 },
  );
}
