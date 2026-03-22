import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { db } from '@/server/db';
import { writeFile, mkdir, readFile, unlink, stat } from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { getPlanLimits } from '@/lib/constants';

const execAsync = promisify(exec);
const log = createLogger('video-translate');

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';
const TEMP_DIR = '/tmp/tubeforge-translate';
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const VALID_MIME_PREFIXES = ['video/', 'audio/'];

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English', ru: 'Russian', es: 'Spanish', fr: 'French',
  de: 'German', it: 'Italian', pt: 'Portuguese', ja: 'Japanese',
  ko: 'Korean', zh: 'Chinese', ar: 'Arabic', hi: 'Hindi',
  tr: 'Turkish', pl: 'Polish', nl: 'Dutch', sv: 'Swedish',
  cs: 'Czech', ro: 'Romanian', el: 'Greek', hu: 'Hungarian',
  uk: 'Ukrainian', id: 'Indonesian', vi: 'Vietnamese',
  th: 'Thai', ms: 'Malay', fil: 'Filipino', da: 'Danish',
  fi: 'Finnish', no: 'Norwegian', bg: 'Bulgarian', hr: 'Croatian',
  sk: 'Slovak', ta: 'Tamil',
};

/* ── Job State ───────────────────────────────────────────────── */

type JobStatus = 'extracting' | 'transcribing' | 'translating' | 'cloning' | 'generating_tts' | 'merging' | 'done' | 'error';

interface JobState {
  status: JobStatus;
  progress: number;
  outputPath?: string;
  error?: string;
  userId: string;
  targetLang: string;
  sourceLang: string;
  createdAt: number;
}

const jobs = new Map<string, JobState>();

// Cleanup stale jobs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TIMEOUT_MS * 2) {
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000);

/* ── Pipeline (runs in background) ───────────────────────────── */

async function runTranslationPipeline(
  jobId: string,
  inputPath: string,
  sourceLang: string,
  targetLang: string,
  userId: string,
) {
  const job = jobs.get(jobId);
  if (!job) return;

  const jobDir = join(TEMP_DIR, jobId);
  const audioPath = join(jobDir, 'audio.wav');
  const ttsPath = join(jobDir, 'translated_audio.mp3');
  const outputPath = join(jobDir, 'output.mp4');
  let clonedVoiceId: string | null = null;

  const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY!;
  const OPENAI_KEY = process.env.OPENAI_API_KEY!;

  try {
    // ── Stage 1: Extract audio with FFmpeg ──────────────────────
    log.info('Stage 1: Extracting audio', { jobId });
    job.status = 'extracting';
    job.progress = 5;

    await execAsync(
      `ffmpeg -y -i "${inputPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`,
      { timeout: 120000 },
    );

    const audioStat = await stat(audioPath);
    log.info('Audio extracted', { jobId, audioSize: audioStat.size });
    job.progress = 15;

    // ── Stage 2: Transcribe with OpenAI Whisper ─────────────────
    log.info('Stage 2: Transcribing with Whisper', { jobId, sourceLang });
    job.status = 'transcribing';
    job.progress = 20;

    const openai = new OpenAI({ apiKey: OPENAI_KEY });

    // Whisper API needs a File-like object; use the node fs approach
    const audioFile = await readFile(audioPath);
    const audioBlob = new File([audioFile], 'audio.wav', { type: 'audio/wav' });

    const transcriptionParams: Record<string, unknown> = {
      file: audioBlob,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    };
    // Only set language if not auto-detect
    if (sourceLang && sourceLang !== 'auto') {
      transcriptionParams.language = sourceLang;
    }

    const transcription = await openai.audio.transcriptions.create(transcriptionParams as any);

    const segments = (transcription as unknown as { segments?: Array<{ text: string; start: number; end: number }> }).segments ?? [];
    const fullText = segments.map((s) => s.text).join(' ').trim() || (transcription as unknown as { text?: string }).text || '';

    log.info('Transcription complete', { jobId, segments: segments.length, textLength: fullText.length });
    job.progress = 40;

    if (!fullText) {
      throw new Error('No speech detected in the audio. Please ensure the video contains clear speech.');
    }

    // ── Stage 3: Translate with GPT-4o ──────────────────────────
    log.info('Stage 3: Translating with GPT-4o', { jobId, targetLang });
    job.status = 'translating';
    job.progress = 45;

    const srcLangName = SUPPORTED_LANGUAGES[sourceLang] ?? sourceLang;
    const tgtLangName = SUPPORTED_LANGUAGES[targetLang] ?? targetLang;

    const translation = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional video narrator translator. Translate the following video narration transcript from ${srcLangName} to ${tgtLangName}. Maintain the same tone, style, and natural pacing suitable for voice-over narration. The translation should sound natural when spoken aloud. Return ONLY the translated text as a single continuous passage. Do not include any notes, explanations, or original text.`,
        },
        {
          role: 'user',
          content: fullText,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const translatedText = translation.choices[0]?.message?.content?.trim() ?? '';
    log.info('Translation complete', { jobId, translatedLength: translatedText.length });
    job.progress = 60;

    if (!translatedText) {
      throw new Error('Translation produced empty result.');
    }

    // ── Stage 4: Clone voice from audio ─────────────────────────
    log.info('Stage 4: Cloning voice', { jobId });
    job.status = 'cloning';
    job.progress = 65;

    const cloneFormData = new FormData();
    cloneFormData.append('name', `tubeforge_${jobId.slice(0, 8)}`);
    cloneFormData.append('description', `Temporary clone for translation job ${jobId}`);
    cloneFormData.append(
      'files',
      new Blob([audioFile], { type: 'audio/wav' }),
      'voice_sample.wav',
    );

    const cloneRes = await fetch(`${ELEVENLABS_API}/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY },
      body: cloneFormData,
    });

    if (!cloneRes.ok) {
      const errBody = await cloneRes.text();
      log.error('Voice clone failed', { jobId, status: cloneRes.status, body: errBody.slice(0, 300) });
      throw new Error(`Voice cloning failed (${cloneRes.status}): ${errBody.slice(0, 200)}`);
    }

    const cloneData = await cloneRes.json();
    clonedVoiceId = cloneData.voice_id;
    log.info('Voice cloned', { jobId, voiceId: clonedVoiceId });
    job.progress = 72;

    // ── Stage 5: Generate TTS with cloned voice ─────────────────
    log.info('Stage 5: Generating TTS', { jobId });
    job.status = 'generating_tts';
    job.progress = 75;

    const ttsRes = await fetch(`${ELEVENLABS_API}/text-to-speech/${clonedVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: translatedText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!ttsRes.ok) {
      const errBody = await ttsRes.text();
      log.error('TTS generation failed', { jobId, status: ttsRes.status, body: errBody.slice(0, 300) });
      throw new Error(`TTS generation failed (${ttsRes.status}): ${errBody.slice(0, 200)}`);
    }

    const ttsAudio = Buffer.from(await ttsRes.arrayBuffer());
    await writeFile(ttsPath, ttsAudio);
    log.info('TTS audio generated', { jobId, ttsSize: ttsAudio.length });
    job.progress = 85;

    // ── Stage 6: Merge video + translated audio with FFmpeg ─────
    log.info('Stage 6: Merging video with translated audio', { jobId });
    job.status = 'merging';
    job.progress = 88;

    await execAsync(
      `ffmpeg -y -i "${inputPath}" -i "${ttsPath}" -c:v copy -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`,
      { timeout: 120000 },
    );

    const outputStat = await stat(outputPath);
    log.info('Video merged', { jobId, outputSize: outputStat.size });

    // ── Done ────────────────────────────────────────────────────
    job.status = 'done';
    job.progress = 100;
    job.outputPath = outputPath;

    // Save asset to DB
    try {
      const relDir = `uploads/translations/${userId}`;
      const absDir = join(process.cwd(), 'public', relDir);
      await mkdir(absDir, { recursive: true });
      const filename = `${jobId}_${targetLang}.mp4`;
      const absPath = join(absDir, filename);

      const outputBuf = await readFile(outputPath);
      await writeFile(absPath, outputBuf);

      const relPath = `/${relDir}/${filename}`;

      const existing = await db.asset.findFirst({
        where: { userId, url: relPath },
      });

      if (!existing) {
        await db.asset.create({
          data: {
            url: relPath,
            filename: `Translation_${targetLang}_${new Date().toISOString().slice(0, 10)}.mp4`,
            type: 'video',
            size: outputStat.size,
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
              jobId,
              targetLang,
              sourceLang,
              fileSize: outputStat.size,
              savedPath: relPath,
              pipeline: 'whisper-gpt4o-elevenlabs-tts',
            },
          },
        });
      }

      log.info('Translation saved to cabinet', { userId, path: relPath });
    } catch (saveErr) {
      log.error('Failed to save asset to DB', {
        error: saveErr instanceof Error ? saveErr.message : String(saveErr),
      });
      // Non-blocking: job is still "done"
    }
  } catch (err) {
    log.error('Pipeline error', {
      jobId,
      stage: job.status,
      error: err instanceof Error ? err.message : String(err),
    });
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { component: 'video-translate', jobId, stage: job.status },
    });
    job.status = 'error';
    job.error = err instanceof Error ? err.message : String(err);
  } finally {
    // Cleanup: delete cloned voice to free up voice slots
    if (clonedVoiceId) {
      try {
        await fetch(`${ELEVENLABS_API}/voices/${clonedVoiceId}`, {
          method: 'DELETE',
          headers: { 'xi-api-key': ELEVENLABS_KEY },
        });
        log.info('Cloned voice deleted', { jobId, voiceId: clonedVoiceId });
      } catch (delErr) {
        log.error('Failed to delete cloned voice', {
          voiceId: clonedVoiceId,
          error: delErr instanceof Error ? delErr.message : String(delErr),
        });
      }
    }

    // Cleanup temp files (keep output if done, for download)
    try {
      if (existsSync(join(TEMP_DIR, jobId, 'audio.wav'))) {
        await unlink(join(TEMP_DIR, jobId, 'audio.wav'));
      }
      if (existsSync(join(TEMP_DIR, jobId, 'translated_audio.mp3'))) {
        await unlink(join(TEMP_DIR, jobId, 'translated_audio.mp3'));
      }
    } catch {
      // ignore cleanup errors
    }

    // Schedule output cleanup after 30 minutes
    setTimeout(async () => {
      try {
        const dir = join(TEMP_DIR, jobId);
        await execAsync(`rm -rf "${dir}"`);
        jobs.delete(jobId);
        log.info('Job cleaned up', { jobId });
      } catch {
        // ignore
      }
    }, 30 * 60 * 1000);
  }
}

/* ── POST: Start translation job ────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const promoHeader = req.headers.get('x-promo-code');
    const VALID_PROMOS = ['TESTPRO2026', 'LUCKY100', 'CREATOR'];
    const hasPromo = promoHeader && VALID_PROMOS.includes(promoHeader.toUpperCase());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = await rateLimit({ identifier: session.user.id ?? 'anon', limit: 5, window: 60 });
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API not configured' }, { status: 503 });
    }
    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI API not configured' }, { status: 503 });
    }

    const contentType = req.headers.get('content-type') ?? '';

    let sourceUrl: string | undefined;
    let sourceLang = 'auto';
    let targetLang = 'en';
    let file: File | undefined;
    let fileName: string | undefined;
    let fileType: string | undefined;
    let fileSize = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      sourceUrl = formData.get('source_url') as string | undefined;
      sourceLang = (formData.get('source_lang') as string) || 'auto';
      targetLang = (formData.get('target_lang') as string) || 'en';
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
    }

    if (!sourceUrl && !file) {
      return NextResponse.json({ error: 'Provide source_url or upload a file' }, { status: 400 });
    }

    if (!SUPPORTED_LANGUAGES[targetLang]) {
      return NextResponse.json({ error: `Unsupported target language: ${targetLang}` }, { status: 400 });
    }

    // File validation
    if (file) {
      if (fileType && !VALID_MIME_PREFIXES.some((p) => fileType!.startsWith(p))) {
        return NextResponse.json(
          { error: `Invalid file type: ${fileType}. Please upload a video or audio file.` },
          { status: 400 },
        );
      }
      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large (${(fileSize / 1024 / 1024).toFixed(0)} MB). Maximum is 500 MB.` },
          { status: 400 },
        );
      }
    }


    // ── Plan usage check ────────────────────────────────────────
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
      select: { plan: true },
    });
    const plan = user?.plan ?? 'FREE';
    const limits = getPlanLimits(plan);

    // Check monthly translation usage
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const translationCount = await db.auditLog.count({
      where: {
        userId: session.user.id!,
        action: 'TOOL_USAGE',
        target: 'video-translate',
        createdAt: { gte: monthStart },
      },
    });

    if (false && translationCount >= limits.videoTranslations) { // LIMITS PAUSED
      return NextResponse.json(
        { error: 'Translation limit reached. Upgrade for more.', code: 'hasPromo ? "PROMO_BYPASS" : "LIMIT_REACHED"', limit: limits.videoTranslations, used: translationCount },
        { status: 403 },
      );
    }

    // Create job
    const jobId = randomUUID();
    const jobDir = join(TEMP_DIR, jobId);
    await mkdir(jobDir, { recursive: true });

    const ext = fileName?.split('.').pop() ?? 'mp4';
    const inputPath = join(jobDir, `input.${ext}`);

    if (file) {
      const buf = Buffer.from(await file.arrayBuffer());
      await writeFile(inputPath, buf);
      log.info('File saved', { jobId, size: buf.length, name: fileName });
    } else if (sourceUrl) {
      // Download the video from URL using yt-dlp or direct fetch
      log.info('Downloading from URL', { jobId, url: sourceUrl.slice(0, 80) });
      try {
        // Try yt-dlp first for YouTube/TikTok/etc
        await execAsync(
          `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${inputPath}" "${sourceUrl}"`,
          { timeout: 180000 },
        );
      } catch {
        // Fallback: direct HTTP download
        const dlRes = await fetch(sourceUrl);
        if (!dlRes.ok || !dlRes.body) {
          return NextResponse.json({ error: `Failed to download video from URL (${dlRes.status})` }, { status: 400 });
        }
        const dlBuf = Buffer.from(await dlRes.arrayBuffer());
        await writeFile(inputPath, dlBuf);
      }
    }


    // ── Check video duration against plan limit ─────────────────
    try {
      const { stdout: durationStr } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
        { timeout: 30000 },
      );
      const durationSec = parseFloat(durationStr.trim());
      if (false && !isNaN(durationSec) && durationSec > limits.maxVideoLengthSec) // LIMITS PAUSED {
        return NextResponse.json(
          {
            error: `Video too long (${Math.ceil(durationSec)}s). Your plan allows up to ${limits.maxVideoLengthSec}s. Upgrade for longer videos.`,
            code: 'VIDEO_TOO_LONG',
            durationSec: Math.ceil(durationSec),
            maxDurationSec: limits.maxVideoLengthSec,
          },
          { status: 403 },
        );
      }
    } catch (probeErr) {
      log.warn('Failed to probe video duration', { jobId, error: String(probeErr) });
      // Non-blocking: allow processing if probe fails
    }

    // Register job
    jobs.set(jobId, {
      status: 'extracting',
      progress: 0,
      userId: session.user.id!,
      targetLang,
      sourceLang,
      createdAt: Date.now(),
    });

    log.info('Translation job started', {
      jobId,
      sourceLang,
      targetLang,
      hasFile: !!file,
      fileSize: fileSize || undefined,
      sourceUrl: sourceUrl?.slice(0, 60),
    });

    // Run pipeline in background (don't await)
    runTranslationPipeline(jobId, inputPath, sourceLang, targetLang, session.user.id!).catch((err) => {
      log.error('Pipeline uncaught error', { jobId, error: String(err) });
    });

    return NextResponse.json({
      job_id: jobId,
      target_lang: targetLang,
      source_lang: sourceLang,
      status: 'extracting',
    });
  } catch (err) {
    log.error('Video translate error', { error: err instanceof Error ? err.message : String(err) });
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { component: 'video-translate' },
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ── GET: Check status / download ────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');
    const download = searchParams.get('download') === 'true';

    if (!jobId) {
      return NextResponse.json({ error: 'job_id required' }, { status: 400 });
    }

    const job = jobs.get(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 });
    }

    // Security: only the job owner can check status
    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check timeout
    if (Date.now() - job.createdAt > JOB_TIMEOUT_MS && job.status !== 'done') {
      job.status = 'error';
      job.error = 'Job timed out (10 minute limit)';
    }

    if (!download || job.status !== 'done') {
      return NextResponse.json({
        job_id: jobId,
        status: job.status,
        progress: job.progress,
        error: job.error ?? null,
        target_lang: job.targetLang,
        source_lang: job.sourceLang,
      });
    }

    // ── Download ──────────────────────────────────────────────────
    if (!job.outputPath || !existsSync(job.outputPath)) {
      // Try serving from public directory
      const relDir = `uploads/translations/${session.user.id}`;
      const absDir = join(process.cwd(), 'public', relDir);
      const filename = `${jobId}_${job.targetLang}.mp4`;
      const absPath = join(absDir, filename);

      if (existsSync(absPath)) {
        const fileStat = await stat(absPath);
        const nodeStream = createReadStream(absPath);
        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        const headers = new Headers();
        headers.set('Content-Type', 'video/mp4');
        headers.set('Content-Disposition', `attachment; filename="translation_${job.targetLang}_${jobId.slice(0, 8)}.mp4"`);
        headers.set('Content-Length', String(fileStat.size));

        return new Response(webStream, { headers });
      }

      return NextResponse.json({ error: 'Output file not found' }, { status: 404 });
    }

    const fileStat = await stat(job.outputPath);
    const nodeStream = createReadStream(job.outputPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="translation_${job.targetLang}_${jobId.slice(0, 8)}.mp4"`);
    headers.set('Content-Length', String(fileStat.size));

    log.info('Serving translated video', { jobId, size: fileStat.size });
    return new Response(webStream, { headers });
  } catch (err) {
    log.error('Status/download error', { error: err instanceof Error ? err.message : String(err) });
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { component: 'video-translate' },
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
