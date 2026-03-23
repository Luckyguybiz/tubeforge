import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { randomBytes } from 'crypto';

const exec = promisify(execFile);

const TMP_DIR = path.join(process.cwd(), '.tmp', 'gif-convert');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DURATION = 30; // seconds
const DEFAULT_FPS = 15;
const DEFAULT_WIDTH = 480;

/** Sanitize filename to ASCII-safe characters only */
function safeFilename(name: string): string {
  return name
    .replace(/[^\w\s.-]/g, '') // remove non-word characters
    .replace(/\s+/g, '_')      // spaces to underscores
    .slice(0, 100)             // max length
    || 'converted';
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 per minute
    const { success } = await rateLimit({
      identifier: `mp4-to-gif:${session.user.id}`,
      limit: 10,
      window: 60,
    });
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fps = Math.min(30, Math.max(5, Number(formData.get('fps')) || DEFAULT_FPS));
    const width = Math.min(1280, Math.max(160, Number(formData.get('width')) || DEFAULT_WIDTH));
    const startTime = Math.max(0, Number(formData.get('start')) || 0);
    const duration = Math.min(MAX_DURATION, Math.max(1, Number(formData.get('duration')) || 10));

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const mimeType = file.type;
    if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'].includes(mimeType)) {
      return NextResponse.json({ error: 'Unsupported format. Use MP4, WebM, MOV, or AVI.' }, { status: 400 });
    }

    // Ensure tmp directory exists
    if (!existsSync(TMP_DIR)) {
      await mkdir(TMP_DIR, { recursive: true });
    }

    const id = randomBytes(8).toString('hex');
    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('quicktime') ? 'mov' : 'mp4';
    const inputPath = path.join(TMP_DIR, `${id}.${ext}`);
    const palettePath = path.join(TMP_DIR, `${id}_palette.png`);
    const outputPath = path.join(TMP_DIR, `${id}.gif`);

    // Write uploaded file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    const cleanup = async () => {
      await Promise.allSettled([
        unlink(inputPath).catch(() => {}),
        unlink(palettePath).catch(() => {}),
        unlink(outputPath).catch(() => {}),
      ]);
    };

    try {
      // Step 1: Generate optimized palette
      await exec('ffmpeg', [
        '-y',
        '-ss', String(startTime),
        '-t', String(duration),
        '-i', inputPath,
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
        palettePath,
      ], { timeout: 60_000 });

      // Step 2: Convert using palette for high-quality output
      await exec('ffmpeg', [
        '-y',
        '-ss', String(startTime),
        '-t', String(duration),
        '-i', inputPath,
        '-i', palettePath,
        '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
        outputPath,
      ], { timeout: 120_000 });

      // Read output
      const gifBuffer = await readFile(outputPath);
      await cleanup();

      const safeName = safeFilename(file.name.replace(/\.\w+$/, ''));

      return new NextResponse(gifBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="${safeName}.gif"`,
          'Content-Length': String(gifBuffer.length),
        },
      });
    } catch (ffmpegError) {
      await cleanup();
      console.error('[MP4-TO-GIF] FFmpeg error:', ffmpegError);
      return NextResponse.json({
        error: 'Conversion failed. Try a shorter duration or smaller file.',
      }, { status: 500 });
    }
  } catch (err) {
    console.error('[MP4-TO-GIF] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
