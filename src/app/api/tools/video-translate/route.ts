import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { db } from '@/server/db';
import { writeFile, mkdir, stat } from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

const log = createLogger('video-translate');

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min timeout for large uploads

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

/** Maximum upload file size: 500 MB */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

/** Minimum video duration warning threshold (seconds) */
const MIN_DURATION_WARNING_SEC = 10;

/** MIME types considered valid video/audio uploads */
const VALID_MIME_PREFIXES = ['video/', 'audio/'];

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

/**
 * Background-save the dubbed file from ElevenLabs to local disk + create Asset record.
 * This runs async (fire-and-forget) so it doesn't block the response.
 */
async function backgroundSaveTranslation(
  dubbingId: string,
  targetLang: string,
  userId: string,
  apiKey: string,
  sourceLang: string | null,
): Promise<void> {
  try {
    const relDir = `uploads/translations/${userId}`;
    const absDir = join(process.cwd(), 'public', relDir);
    const filename = `${dubbingId}_${targetLang}.mp4`;
    const absPath = join(absDir, filename);

    // Skip if already saved
    if (existsSync(absPath)) {
      log.info('Translation already saved on disk', { dubbingId, targetLang });
      return;
    }

    await mkdir(absDir, { recursive: true });

    const downloadUrl = `${ELEVENLABS_API}/dubbing/${dubbingId}/audio/${targetLang}`;
    const res = await fetch(downloadUrl, {
      headers: { 'xi-api-key': apiKey },
    });

    if (!res.ok || !res.body) {
      log.error('Background save: download failed', { dubbingId, status: res.status });
      return;
    }

    // Stream to disk using chunks
    const chunks: Uint8Array[] = [];
    const reader = res.body.getReader();
    let totalSize = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.byteLength;
    }

    const buffer = Buffer.concat(chunks);
    await writeFile(absPath, buffer);

    const relPath = `/${relDir}/${filename}`;

    // Check if asset already exists for this dubbing
    const existing = await db.asset.findFirst({
      where: {
        userId,
        url: relPath,
      },
    });

    if (!existing) {
      await db.asset.create({
        data: {
          url: relPath,
          filename: `Translation_${targetLang}_${new Date().toISOString().slice(0, 10)}.mp4`,
          type: 'video',
          size: totalSize,
          userId,
        },
      });

      await db.auditLog.create({
        data: {
          userId,
          action: 'TOOL_USAGE',
          target: 'video-translate',
          metadata: {
            tool: 'video-translate',
            dubbingId,
            targetLang,
            sourceLang,
            fileSize: totalSize,
            savedPath: relPath,
          },
        },
      });

      log.info('Translation saved to cabinet (background)', { userId, path: relPath, size: totalSize });
    }
  } catch (err) {
    log.error('Background save failed', {
      dubbingId,
      error: err instanceof Error ? err.message : String(err),
    });
    // Non-blocking – don't rethrow
  }
}

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
    let fileType: string | undefined;
    let fileSize = 0;
    let watermark = false;
    let dropBgAudio = true;
    let numSpeakers = 1;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      sourceUrl = formData.get('source_url') as string | undefined;
      sourceLang = (formData.get('source_lang') as string) || 'auto';
      targetLang = (formData.get('target_lang') as string) || 'en';
      watermark = formData.get('watermark') === 'true';
      dropBgAudio = formData.get('drop_background_audio') !== 'false'; // default true
      numSpeakers = parseInt(formData.get('num_speakers') as string || '1', 10) || 1;
      const uploadedFile = formData.get('file') as File | null;
      if (uploadedFile && uploadedFile.size > 0) {
        file = uploadedFile;
        fileName = uploadedFile.name;
        fileType = uploadedFile.type;
        fileSize = uploadedFile.size;
      }
    } else {
      const body = await req.json();
      sourceUrl = body.source_url;
      sourceLang = body.source_lang || 'auto';
      targetLang = body.target_lang || 'en';
      watermark = body.watermark ?? false;
      dropBgAudio = body.drop_background_audio ?? true;
      numSpeakers = body.num_speakers ?? 1;
    }

    if (!sourceUrl && !file) {
      return NextResponse.json({ error: 'Provide source_url or upload a file' }, { status: 400 });
    }

    if (!SUPPORTED_LANGUAGES[targetLang]) {
      return NextResponse.json({ error: `Unsupported target language: ${targetLang}` }, { status: 400 });
    }

    /* ── File validation ────────────────────────────────────────── */
    if (file) {
      // Check MIME type
      if (fileType && !VALID_MIME_PREFIXES.some((p) => fileType!.startsWith(p))) {
        return NextResponse.json(
          { error: `Invalid file type: ${fileType}. Please upload a video or audio file.` },
          { status: 400 },
        );
      }

      // Check file size (500 MB max)
      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large (${(fileSize / 1024 / 1024).toFixed(0)} MB). Maximum is 500 MB.` },
          { status: 400 },
        );
      }
    }

    /* ── Build multipart form for ElevenLabs ────────────────────── */
    const elForm = new FormData();
    elForm.append('target_lang', targetLang);
    elForm.append('source_lang', sourceLang);
    elForm.append('num_speakers', String(numSpeakers));
    elForm.append('watermark', String(watermark));

    // --- Voice cloning quality parameters ---
    // Always use highest resolution for best voice cloning fidelity
    elForm.append('highest_resolution', 'true');
    // Drop background audio for cleaner voice extraction & better cloning
    elForm.append('drop_background_audio', String(dropBgAudio));
    // Explicitly ensure voice cloning is ENABLED (not using library voices)
    elForm.append('disable_voice_cloning', 'false');
    // Disable profanity filter for accurate, unaltered translations
    elForm.append('use_profanity_filter', 'false');

    if (file) {
      elForm.append('file', file, fileName ?? 'video.mp4');
    } else if (sourceUrl) {
      elForm.append('source_url', sourceUrl);
    }

    log.info('Starting dubbing', {
      targetLang,
      sourceLang,
      numSpeakers,
      dropBgAudio,
      hasFile: !!file,
      fileSize: fileSize || undefined,
      sourceUrl: sourceUrl?.slice(0, 60),
      highestResolution: true,
      disableVoiceCloning: false,
      useProfanityFilter: false,
    });

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
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { component: 'video-translate' } });
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

    // When dubbing is complete, proactively save in the background
    if (statusData.status === 'dubbed' && targetLang && session.user.id) {
      // Fire-and-forget: save the file to disk + create Asset record
      backgroundSaveTranslation(
        dubbingId,
        targetLang,
        session.user.id,
        apiKey,
        statusData.source_language ?? null,
      ).catch(() => {
        // Already logged inside the function
      });
    }

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

    // ── Download dubbed file ──────────────────────────────────────
    if (!targetLang) {
      return NextResponse.json({ error: 'target_lang required for download' }, { status: 400 });
    }

    // Try to serve from local disk first (if background save already completed)
    if (session.user.id) {
      const relDir = `uploads/translations/${session.user.id}`;
      const absDir = join(process.cwd(), 'public', relDir);
      const filename = `${dubbingId}_${targetLang}.mp4`;
      const absPath = join(absDir, filename);

      if (existsSync(absPath)) {
        try {
          const fileStat = await stat(absPath);
          const nodeStream = createReadStream(absPath);
          const webStream = Readable.toWeb(nodeStream) as ReadableStream;

          const headers = new Headers();
          headers.set('Content-Type', 'video/mp4');
          headers.set('Content-Disposition', `attachment; filename="translation_${targetLang}_${dubbingId}.mp4"`);
          headers.set('Content-Length', String(fileStat.size));

          log.info('Serving translation from local disk', { dubbingId, targetLang, size: fileStat.size });
          return new Response(webStream, { headers });
        } catch (fsErr) {
          log.error('Failed to read local file, falling back to ElevenLabs stream', {
            error: fsErr instanceof Error ? fsErr.message : String(fsErr),
          });
          // Fall through to stream from ElevenLabs
        }
      }
    }

    // Stream directly from ElevenLabs (no buffering in memory)
    const downloadUrl = `${ELEVENLABS_API}/dubbing/${dubbingId}/audio/${targetLang}`;
    const dubbedRes = await fetch(downloadUrl, {
      headers: { 'xi-api-key': apiKey },
    });

    if (!dubbedRes.ok || !dubbedRes.body) {
      return NextResponse.json(
        { error: `Download failed: ${dubbedRes.status}` },
        { status: 502 },
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="translation_${targetLang}_${dubbingId}.mp4"`);
    if (dubbedRes.headers.get('content-length')) {
      headers.set('Content-Length', dubbedRes.headers.get('content-length')!);
    }

    log.info('Streaming translation from ElevenLabs', { dubbingId, targetLang });

    // Also trigger background save for future downloads / history
    if (session.user.id) {
      backgroundSaveTranslation(
        dubbingId,
        targetLang,
        session.user.id,
        apiKey,
        statusData.source_language ?? null,
      ).catch(() => {});
    }

    return new Response(dubbedRes.body, { headers });
  } catch (err) {
    log.error('Status/download error', { error: err instanceof Error ? err.message : String(err) });
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { component: 'video-translate' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
