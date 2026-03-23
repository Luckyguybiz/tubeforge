import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { writeFile, unlink, mkdir } from 'fs/promises';
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
      return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });
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
      return NextResponse.json({ error: `File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, { status: 400 });
    }

    const mimeType = file.type;
    if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'].includes(mimeType)) {
      return NextResponse.json({ error: 'Unsupported format. Use MP4, WebM, MOV, or AVI.' }, { status: 400 });
    }

    // Ensure tmp directory exists
    if (!existsSync(TMP_DIR)) {
      await mkdir(TMP_DIR, { recursive: true });
    }

    const id = randomBytes(8).toString('hex');
    const inputPath = path.join(TMP_DIR, `${id}.mp4`);
    const palettePath = path.join(TMP_DIR, `${id}_palette.png`);
    const outputPath = path.join(TMP_DIR, `${id}.gif`);

    // Write uploaded file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    try {
      // Step 1: Generate optimized palette for better GIF quality
      await exec('ffmpeg', [
        '-ss', String(startTime),
        '-t', String(duration),
        '-i', inputPath,
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
        '-y', palettePath,
      ], { timeout: 60_000 });

      // Step 2: Convert using palette for high-quality output
      await exec('ffmpeg', [
        '-ss', String(startTime),
        '-t', String(duration),
        '-i', inputPath,
        '-i', palettePath,
        '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
        '-y', outputPath,
      ], { timeout: 120_000 });

      // Read the output GIF
      const { readFile } = await import('fs/promises');
      const gifBuffer = await readFile(outputPath);

      // Cleanup temp files
      await Promise.allSettled([
        unlink(inputPath),
        unlink(palettePath),
        unlink(outputPath),
      ]);

      return new NextResponse(gifBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="${file.name.replace(/\.\w+$/, '')}.gif"`,
          'Content-Length': String(gifBuffer.length),
        },
      });
    } catch (ffmpegError) {
      // Cleanup on error
      await Promise.allSettled([
        unlink(inputPath).catch(() => {}),
        unlink(palettePath).catch(() => {}),
        unlink(outputPath).catch(() => {}),
      ]);
      console.error('[MP4-TO-GIF] FFmpeg error:', ffmpegError);
      return NextResponse.json({ error: 'Conversion failed. The video may be corrupted or unsupported.' }, { status: 500 });
    }
  } catch (err) {
    console.error('[MP4-TO-GIF] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
