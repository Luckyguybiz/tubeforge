import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('video-translate');

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min timeout for large uploads

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English', ru: 'Русский', es: 'Español', fr: 'Français',
  de: 'Deutsch', it: 'Italiano', pt: 'Português', ja: '日本語',
  ko: '한국어', zh: '中文', ar: 'العربية', hi: 'हिन्दी',
  tr: 'Türkçe', pl: 'Polski', nl: 'Nederlands', sv: 'Svenska',
  cs: 'Čeština', ro: 'Română', el: 'Ελληνικά', hu: 'Magyar',
  uk: 'Українська', id: 'Bahasa Indonesia', vi: 'Tiếng Việt',
  th: 'ไทย', ms: 'Bahasa Melayu', fil: 'Filipino', da: 'Dansk',
  fi: 'Suomi', no: 'Norsk', bg: 'Български', hr: 'Hrvatski',
  sk: 'Slovenčina', ta: 'தமிழ்',
};

/* ── POST: Start dubbing ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = await rateLimit({ identifier: session.user.id ?? "anon", limit: 5, window: 60 });
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API not configured' }, { status: 503 });
    }

    const contentType = req.headers.get('content-type') ?? '';

    let sourceUrl: string | undefined;
    let sourceLang = 'auto';
    let targetLang = 'en';
    let file: Blob | undefined;
    let fileName: string | undefined;
    let watermark = false;
    let dropBgAudio = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      sourceUrl = formData.get('source_url') as string | undefined;
      sourceLang = (formData.get('source_lang') as string) || 'auto';
      targetLang = (formData.get('target_lang') as string) || 'en';
      watermark = formData.get('watermark') === 'true';
      dropBgAudio = formData.get('drop_background_audio') === 'true';
      const uploadedFile = formData.get('file') as File | null;
      if (uploadedFile && uploadedFile.size > 0) {
        file = uploadedFile;
        fileName = uploadedFile.name;
      }
    } else {
      const body = await req.json();
      sourceUrl = body.source_url;
      sourceLang = body.source_lang || 'auto';
      targetLang = body.target_lang || 'en';
      watermark = body.watermark ?? false;
      dropBgAudio = body.drop_background_audio ?? false;
    }

    if (!sourceUrl && !file) {
      return NextResponse.json({ error: 'Provide source_url or upload a file' }, { status: 400 });
    }

    if (!SUPPORTED_LANGUAGES[targetLang]) {
      return NextResponse.json({ error: `Unsupported target language: ${targetLang}` }, { status: 400 });
    }

    // Build multipart form for ElevenLabs
    const elForm = new FormData();
    elForm.append('target_lang', targetLang);
    elForm.append('source_lang', sourceLang);
    elForm.append('num_speakers', '0'); // auto-detect
    elForm.append('watermark', String(watermark));
    elForm.append('drop_background_audio', String(dropBgAudio));
    elForm.append('highest_resolution', 'true');

    if (file) {
      elForm.append('file', file, fileName ?? 'video.mp4');
    } else if (sourceUrl) {
      elForm.append('source_url', sourceUrl);
    }

    log.info('Starting dubbing', { targetLang, sourceLang, hasFile: !!file, sourceUrl: sourceUrl?.slice(0, 60) });

    const dubRes = await fetch(`${ELEVENLABS_API}/dubbing`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: elForm,
    });

    if (!dubRes.ok) {
      const errBody = await dubRes.text();
      log.error('ElevenLabs dubbing failed', { status: dubRes.status, body: errBody.slice(0, 500) });
      return NextResponse.json(
        { error: `Dubbing failed: ${dubRes.status}` },
        { status: dubRes.status >= 500 ? 502 : dubRes.status },
      );
    }

    const dubData = await dubRes.json();
    const dubbingId = dubData.dubbing_id;
    const expectedDuration = dubData.expected_duration_sec;

    log.info('Dubbing started', { dubbingId, expectedDuration });

    return NextResponse.json({
      dubbing_id: dubbingId,
      expected_duration_sec: expectedDuration,
      target_lang: targetLang,
      source_lang: sourceLang,
      status: 'processing',
    });
  } catch (err) {
    log.error('Video translate error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ── GET: Check status / download ─────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const dubbingId = searchParams.get('dubbing_id');
    const targetLang = searchParams.get('target_lang');
    const download = searchParams.get('download') === 'true';

    if (!dubbingId) {
      return NextResponse.json({ error: 'dubbing_id required' }, { status: 400 });
    }

    // Check status
    const statusRes = await fetch(`${ELEVENLABS_API}/dubbing/${dubbingId}`, {
      headers: { 'xi-api-key': apiKey },
    });

    if (!statusRes.ok) {
      return NextResponse.json({ error: `Status check failed: ${statusRes.status}` }, { status: 502 });
    }

    const statusData = await statusRes.json();

    if (!download || statusData.status !== 'dubbed') {
      return NextResponse.json({
        dubbing_id: dubbingId,
        status: statusData.status,
        error: statusData.error ?? null,
        source_language: statusData.source_language ?? null,
        target_languages: statusData.target_languages ?? [],
        created_at: statusData.created_at ?? null,
        media_metadata: statusData.media_metadata ?? null,
      });
    }

    // Download dubbed file
    if (!targetLang) {
      return NextResponse.json({ error: 'target_lang required for download' }, { status: 400 });
    }

    const audioRes = await fetch(
      `${ELEVENLABS_API}/dubbing/${dubbingId}/audio/${targetLang}`,
      { headers: { 'xi-api-key': apiKey } },
    );

    if (!audioRes.ok) {
      return NextResponse.json({ error: `Download failed: ${audioRes.status}` }, { status: 502 });
    }

    const audioBuffer = await audioRes.arrayBuffer();
    const contentTypeHeader = audioRes.headers.get('content-type') ?? 'video/mp4';

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentTypeHeader,
        'Content-Disposition': `attachment; filename="dubbed_${targetLang}.mp4"`,
        'Content-Length': String(audioBuffer.byteLength),
      },
    });
  } catch (err) {
    log.error('Status/download error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
