import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Extract a YouTube video ID from various URL formats.
 *
 * Supported:
 *   - https://www.youtube.com/watch?v=XXXXXXXXXXX
 *   - https://youtu.be/XXXXXXXXXXX
 *   - https://www.youtube.com/shorts/XXXXXXXXXXX
 *   - https://www.youtube.com/embed/XXXXXXXXXXX
 *   - https://youtube.com/live/XXXXXXXXXXX
 *   - URLs with extra query params / timestamps
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

/** Shape of a format object inside ytInitialPlayerResponse.streamingData */
interface YtFormat {
  qualityLabel?: string;
  mimeType?: string;
  url?: string;
  contentLength?: string;
  bitrate?: number;
  width?: number;
  height?: number;
  audioQuality?: string;
}

/**
 * GET /api/tools/youtube-download?url=<youtube_url>
 *
 * Returns video metadata fetched via YouTube's free oEmbed endpoint.
 */
export async function GET(req: NextRequest) {
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

/**
 * POST /api/tools/youtube-download
 *
 * Proxies to our self-hosted yt-dlp API on VPS for real YouTube downloads.
 *
 * Body: { videoId: string, quality?: string, audioOnly?: boolean }
 */

const YT_API_BASE = process.env.YT_DLP_API_URL;

export async function POST(req: NextRequest) {
  let body: { videoId?: string; quality?: string; audioOnly?: boolean };
  try {
    body = (await req.json()) as { videoId?: string; quality?: string; audioOnly?: boolean };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { videoId, quality, audioOnly } = body;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Missing or invalid videoId' }, { status: 400 });
  }

  if (!YT_API_BASE) {
    return NextResponse.json(
      { error: 'Download service is not configured. Please set YT_DLP_API_URL.' },
      { status: 503 },
    );
  }

  try {
    // Build download URL on our VPS
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const downloadUrl = `${YT_API_BASE}/download?url=${encodeURIComponent(youtubeUrl)}&quality=${encodeURIComponent(quality ?? '720p')}&audioOnly=${audioOnly ? 'true' : 'false'}`;

    return NextResponse.json({
      downloadUrl,
      filename: `${videoId}.${audioOnly ? 'mp3' : 'mp4'}`,
      status: 'redirect',
    });
  } catch {
    return NextResponse.json({
      error: 'Сервис скачивания временно недоступен. Попробуйте позже.',
    }, { status: 502 });
  }
}
