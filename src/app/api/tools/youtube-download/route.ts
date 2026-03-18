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
 * Fetches the YouTube watch page, extracts ytInitialPlayerResponse,
 * and returns available streaming formats with direct URLs (where available).
 *
 * Body: { videoId: string }
 */
export async function POST(req: NextRequest) {
  let body: { videoId?: string };
  try {
    body = (await req.json()) as { videoId?: string };
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { videoId } = body;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json(
      { error: 'Missing or invalid videoId' },
      { status: 400 },
    );
  }

  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const pageRes = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!pageRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch YouTube page' },
        { status: 502 },
      );
    }

    const html = await pageRes.text();

    // Extract the ytInitialPlayerResponse JSON blob from the page HTML
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
    if (!match?.[1]) {
      return NextResponse.json(
        { error: 'Could not parse video data from YouTube page' },
        { status: 400 },
      );
    }

    let playerData: {
      streamingData?: {
        formats?: YtFormat[];
        adaptiveFormats?: YtFormat[];
      };
      videoDetails?: {
        lengthSeconds?: string;
        title?: string;
      };
      playabilityStatus?: {
        status?: string;
        reason?: string;
      };
    };

    try {
      playerData = JSON.parse(match[1]);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse player response JSON' },
        { status: 400 },
      );
    }

    // Check playability
    const status = playerData.playabilityStatus?.status;
    if (status && status !== 'OK') {
      return NextResponse.json(
        {
          error:
            playerData.playabilityStatus?.reason ??
            'This video is not available for download',
        },
        { status: 403 },
      );
    }

    const rawFormats = playerData.streamingData?.formats ?? [];
    const rawAdaptive = playerData.streamingData?.adaptiveFormats ?? [];
    const allFormats = [...rawFormats, ...rawAdaptive];

    const formats = allFormats
      .map((f) => ({
        quality: f.qualityLabel ?? (f.audioQuality ? 'Audio' : 'unknown'),
        mimeType: f.mimeType ?? '',
        url: f.url ?? null,
        hasAudio: !!(f.mimeType?.includes('audio') || f.audioQuality),
        hasVideo: !!f.mimeType?.includes('video'),
        contentLength: f.contentLength ?? null,
        bitrate: f.bitrate ?? null,
        width: f.width ?? null,
        height: f.height ?? null,
      }))
      .filter((f) => f.url); // Only include formats with direct (non-encrypted) URLs

    const duration = playerData.videoDetails?.lengthSeconds
      ? parseInt(playerData.videoDetails.lengthSeconds, 10)
      : null;

    return NextResponse.json({
      videoId,
      duration,
      formats,
      encrypted: allFormats.length > 0 && formats.length === 0,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Request timed out while fetching video streams.'
        : 'Failed to extract video streams. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
