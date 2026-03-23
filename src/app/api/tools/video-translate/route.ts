import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { env } from '@/lib/env';
import { randomUUID } from 'crypto';
import { writeFile, readFile, mkdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

/* ═══════════════════════════════════════════════════════════════════════════
   Video Translator API — Full Pipeline
   1. Upload video → extract audio (FFmpeg)
   2. Transcribe with Whisper (OpenAI)
   3. Translate text with GPT-4o
   4. Generate translated speech (ElevenLabs TTS)
   5. Merge translated audio with original video (FFmpeg)
   ═══════════════════════════════════════════════════════════════════════════ */

const JOBS_DIR = join(process.cwd(), 'tmp', 'video-translate-jobs');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

/** Rate limits per plan (per 24 hours) */
const DAILY_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: 20,
  STUDIO: 9999,
};

/* ── Language definitions ─────────────────────────────────────────────── */
const LANGUAGES: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  tr: 'Turkish',
  uk: 'Ukrainian',
  pl: 'Polish',
  nl: 'Dutch',
};

/** ElevenLabs voice IDs for different languages */
const VOICE_MAP: Record<string, string> = {
  en: '21m00Tcm4TlvDq8ikWAM', // Rachel
  ru: 'pNInz6obpgDQGcFmaJgB', // Adam
  es: 'yoZ06aMxZJJ28mfd3POQ', // Sam
  fr: 'EXAVITQu4vr4xnSDxMaL', // Bella
  de: 'TxGEqnHWrfWFTfGW9XjX', // Josh
  it: 'MF3mGyEYCl7XYWbV9V6O', // Elli
  pt: '21m00Tcm4TlvDq8ikWAM',
  ja: 'pNInz6obpgDQGcFmaJgB',
  ko: 'yoZ06aMxZJJ28mfd3POQ',
  zh: 'EXAVITQu4vr4xnSDxMaL',
  ar: 'TxGEqnHWrfWFTfGW9XjX',
  hi: 'MF3mGyEYCl7XYWbV9V6O',
  tr: '21m00Tcm4TlvDq8ikWAM',
  uk: 'pNInz6obpgDQGcFmaJgB',
  pl: 'yoZ06aMxZJJ28mfd3POQ',
  nl: 'EXAVITQu4vr4xnSDxMaL',
};

/* ── Job state ────────────────────────────────────────────────────────── */
interface Job {
  id: string;
  userId: string;
  status: 'extracting_audio' | 'transcribing' | 'translating' | 'generating_speech' | 'merging' | 'done' | 'error';
  progress: number;
  error?: string;
  sourceLang: string;
  targetLang: string;
  outputPath?: string;
  createdAt: number;
}

/** In-memory job store — acceptable for PM2 single-instance */
const jobStore = new Map<string, Job>();

/** Clean up jobs older than 1 hour */
function cleanupOldJobs() {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();
  for (const [id, job] of jobStore) {
    if (now - job.createdAt > oneHour) {
      jobStore.delete(id);
      // Best-effort file cleanup
      const jobDir = join(JOBS_DIR, id);
      if (existsSync(jobDir)) {
        import('fs/promises').then(fs => fs.rm(jobDir, { recursive: true, force: true }).catch(() => {}));
      }
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupOldJobs, 10 * 60 * 1000);

/* ── Pipeline steps ───────────────────────────────────────────────────── */

async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-i', videoPath,
    '-vn',
    '-acodec', 'pcm_s16le',
    '-ar', '16000',
    '-ac', '1',
    '-y',
    audioPath,
  ], { timeout: 120_000 });
}

async function transcribeWithWhisper(audioPath: string, sourceLang: string): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const audioData = await readFile(audioPath);
  const formData = new FormData();
  formData.append('file', new Blob([audioData], { type: 'audio/wav' }), 'audio.wav');
  formData.append('model', 'whisper-1');
  if (sourceLang !== 'auto') {
    formData.append('language', sourceLang);
  }

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Whisper API error (${res.status}): ${errText}`);
  }

  const data = await res.json() as { text: string };
  return data.text;
}

async function translateWithGPT(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const sourceLabel = sourceLang === 'auto' ? 'the original language' : (LANGUAGES[sourceLang] ?? sourceLang);
  const targetLabel = LANGUAGES[targetLang] ?? targetLang;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional video translator. Translate the following transcription from ${sourceLabel} to ${targetLabel}. Maintain the tone, style, and meaning. Output ONLY the translated text, nothing else.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`GPT-4o API error (${res.status}): ${errText}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content?.trim() ?? '';
}

async function generateSpeechWithElevenLabs(text: string, targetLang: string, outputPath: string): Promise<void> {
  const apiKey = env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ElevenLabs API key not configured');

  const voiceId = VOICE_MAP[targetLang] ?? VOICE_MAP['en'];

  // Split long text into chunks of ~4000 chars for ElevenLabs limit
  const chunks = splitTextIntoChunks(text, 4000);
  const chunkPaths: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = outputPath.replace('.mp3', `_chunk_${i}.mp3`);
    chunkPaths.push(chunkPath);

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: chunks[i],
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs API error (${res.status}): ${errText}`);
    }

    const audioBuffer = Buffer.from(await res.arrayBuffer());
    await writeFile(chunkPath, audioBuffer);
  }

  // Concatenate chunks if multiple
  if (chunkPaths.length === 1) {
    const { rename } = await import('fs/promises');
    await rename(chunkPaths[0], outputPath);
  } else {
    const listPath = outputPath.replace('.mp3', '_list.txt');
    const listContent = chunkPaths.map(p => `file '${p}'`).join('\n');
    await writeFile(listPath, listContent);
    await execFileAsync('ffmpeg', [
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c', 'copy',
      '-y',
      outputPath,
    ], { timeout: 60_000 });
    // Cleanup chunks
    for (const p of chunkPaths) {
      await unlink(p).catch(() => {});
    }
    await unlink(listPath).catch(() => {});
  }
}

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

async function mergeAudioWithVideo(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-i', videoPath,
    '-i', audioPath,
    '-c:v', 'copy',
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-shortest',
    '-y',
    outputPath,
  ], { timeout: 300_000 });
}

/* ── Run pipeline in background ───────────────────────────────────────── */

async function runPipeline(job: Job, jobDir: string): Promise<void> {
  const videoPath = join(jobDir, 'input.mp4');
  const audioPath = join(jobDir, 'extracted.wav');
  const translatedAudioPath = join(jobDir, 'translated.mp3');
  const outputPath = join(jobDir, 'output.mp4');

  try {
    // Step 1: Extract audio
    job.status = 'extracting_audio';
    job.progress = 10;
    jobStore.set(job.id, { ...job });
    await extractAudio(videoPath, audioPath);

    // Step 2: Transcribe
    job.status = 'transcribing';
    job.progress = 25;
    jobStore.set(job.id, { ...job });
    const transcript = await transcribeWithWhisper(audioPath, job.sourceLang);

    if (!transcript.trim()) {
      throw new Error('No speech detected in the video');
    }

    // Step 3: Translate
    job.status = 'translating';
    job.progress = 50;
    jobStore.set(job.id, { ...job });
    const translated = await translateWithGPT(transcript, job.sourceLang, job.targetLang);

    // Step 4: Generate speech
    job.status = 'generating_speech';
    job.progress = 70;
    jobStore.set(job.id, { ...job });
    await generateSpeechWithElevenLabs(translated, job.targetLang, translatedAudioPath);

    // Step 5: Merge
    job.status = 'merging';
    job.progress = 90;
    jobStore.set(job.id, { ...job });
    await mergeAudioWithVideo(videoPath, translatedAudioPath, outputPath);

    // Done
    job.status = 'done';
    job.progress = 100;
    job.outputPath = outputPath;
    jobStore.set(job.id, { ...job });

    // Clean up intermediate files
    await unlink(audioPath).catch(() => {});
    await unlink(translatedAudioPath).catch(() => {});
  } catch (err) {
    job.status = 'error';
    job.error = err instanceof Error ? err.message : 'Unknown pipeline error';
    jobStore.set(job.id, { ...job });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST — Upload video and start translation
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = (session.user.plan as string) ?? 'FREE';
  const dailyLimit = DAILY_LIMITS[plan] ?? DAILY_LIMITS['FREE'];

  // Rate limit
  const rl = await rateLimit({
    identifier: `video-translate:${session.user.id}`,
    limit: dailyLimit,
    window: 86400, // 24 hours
  });

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Daily translation limit reached. Upgrade your plan for more.', remaining: rl.remaining },
      { status: 429 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sourceLang = (formData.get('sourceLang') as string) ?? 'auto';
    const targetLang = (formData.get('targetLang') as string) ?? 'en';

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 500 MB.' }, { status: 400 });
    }

    if (!LANGUAGES[targetLang]) {
      return NextResponse.json({ error: 'Unsupported target language' }, { status: 400 });
    }

    // Check API keys
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    if (!env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    // Create job directory
    const jobId = randomUUID();
    const jobDir = join(JOBS_DIR, jobId);
    await mkdir(jobDir, { recursive: true });

    // Save uploaded file
    const videoPath = join(jobDir, 'input.mp4');
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(videoPath, Buffer.from(arrayBuffer));

    // Create job
    const job: Job = {
      id: jobId,
      userId: session.user.id,
      status: 'extracting_audio',
      progress: 5,
      sourceLang,
      targetLang,
      createdAt: Date.now(),
    };
    jobStore.set(jobId, job);

    // Run pipeline in background (non-blocking)
    runPipeline(job, jobDir).catch(() => {});

    return NextResponse.json({
      jobId,
      status: 'extracting_audio',
      progress: 5,
      remaining: rl.remaining,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   GET — Poll job status or download result
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get('job_id');
  const download = url.searchParams.get('download');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing job_id parameter' }, { status: 400 });
  }

  const job = jobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Ensure user owns this job
  if (job.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Download the result
  if (download === 'true' && job.status === 'done' && job.outputPath) {
    try {
      const fileStat = await stat(job.outputPath);
      const fileData = await readFile(job.outputPath);
      return new NextResponse(fileData, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="translated_video.mp4"`,
          'Content-Length': fileStat.size.toString(),
        },
      });
    } catch {
      return NextResponse.json({ error: 'Output file not found' }, { status: 404 });
    }
  }

  // Return job status
  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    sourceLang: job.sourceLang,
    targetLang: job.targetLang,
  });
}
