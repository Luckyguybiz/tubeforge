import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Validate a TikTok URL. Accepts:
 *   - https://www.tiktok.com/@user/video/1234567890
 *   - https://vm.tiktok.com/XXXXXXXXX
 *   - https://www.tiktok.com/t/XXXXXXXXX
 */
function isValidTiktokUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.|vm\.)?tiktok\.com\/(@[\w.-]+\/video\/\d+|[\w]+)/i.test(
    url.trim(),
  );
}

interface OEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

/**
 * GET /api/tools/tiktok-download?url=<tiktok_url>
 *
 * Returns video metadata fetched via TikTok's free oEmbed endpoint.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 10 requests per minute per user
  const { success: rlOk, reset } = await rateLimit({
    identifier: `tt-dl-info:${session.user.id}`,
    limit: 10,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing "url" query parameter' },
      { status: 400 },
    );
  }

  if (!isValidTiktokUrl(url)) {
    return NextResponse.json(
      {
        error:
          'Invalid TikTok URL. Please provide a valid tiktok.com or vm.tiktok.com link.',
      },
      { status: 400 },
    );
  }

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

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
      title: data.title || 'TikTok Video',
      author: data.author_name,
      authorUrl: data.author_url,
      thumbnail: data.thumbnail_url,
      thumbnailWidth: data.thumbnail_width,
      thumbnailHeight: data.thumbnail_height,
      originalUrl: url,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Request timed out. TikTok may be slow — please try again.'
        : 'Failed to fetch video information. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * POST /api/tools/tiktok-download
 *
 * Returns a download URL for the TikTok video via Cobalt API.
 *
 * Body: { url: string, quality?: 'hd' | 'sd', audioOnly?: boolean }
 */

const COBALT_API_URL =
  process.env.COBALT_API_URL || 'https://api.cobalt.tools';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 requests per minute per user
  const { success: rlOk, reset } = await rateLimit({
    identifier: `tt-dl-download:${session.user.id}`,
    limit: 5,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  let body: {
    url?: string;
    quality?: string;
    audioOnly?: boolean;
    removeWatermark?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url, quality, audioOnly, removeWatermark } = body;

  if (!url || !isValidTiktokUrl(url)) {
    return NextResponse.json(
      { error: 'Missing or invalid TikTok URL' },
      { status: 400 },
    );
  }

  // Use Cobalt API for download
  try {
    const cobaltBody: Record<string, unknown> = {
      url,
      videoQuality: quality === 'sd' ? '480' : '1080',
      filenameStyle: 'pretty',
    };

    if (audioOnly) {
      cobaltBody.isAudioOnly = true;
      cobaltBody.audioFormat = 'mp3';
    }

    // Request without watermark by default
    if (removeWatermark !== false) {
      cobaltBody.tiktokH265 = false;
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
      const cobaltData = (await cobaltRes.json()) as {
        status?: string;
        url?: string;
      };
      if (cobaltData.url) {
        return NextResponse.json({
          downloadUrl: cobaltData.url,
          status: cobaltData.status ?? 'redirect',
        });
      }
    }

    // If cobalt returned an error, try to extract the message
    const errorText = await cobaltRes.text().catch(() => '');
    let errorMsg = 'Download service temporarily unavailable.';
    try {
      const errorData = JSON.parse(errorText) as {
        text?: string;
        error?: { code?: string };
      };
      if (errorData.text) errorMsg = errorData.text;
    } catch {
      // ignore parse error
    }

    return NextResponse.json({ error: errorMsg }, { status: 503 });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Request timed out. Please try again.'
        : 'Failed to get download link. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
