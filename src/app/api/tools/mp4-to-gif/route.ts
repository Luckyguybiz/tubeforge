import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

// Allow large video uploads and long processing
export const runtime = 'nodejs';
export const maxDuration = 120;
// Next.js 16 route handler body size limit
export const config = { api: { bodyParser: false, responseLimit: false } };
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { randomBytes } from 'crypto';

const TMP_DIR = path.join(process.cwd(), '.tmp', 'gif-convert');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function runFFmpeg(args: string[], timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    const timer = setTimeout(() => { proc.kill('SIGKILL'); reject(new Error('FFmpeg timeout')); }, timeoutMs);

    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stderr);
      else reject(new Error(`FFmpeg exit ${code}: ${stderr.slice(-500)}`));
    });
    proc.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await rateLimit({ identifier: `mp4gif:${session.user.id}`, limit: 10, window: 60 });
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Max 100MB' }, { status: 400 });

    const fps = Math.min(30, Math.max(5, Number(formData.get('fps')) || 15));
    const width = Math.min(1280, Math.max(160, Number(formData.get('width')) || 480));
    const startTime = Math.max(0, Number(formData.get('start')) || 0);
    const duration = Math.min(30, Math.max(1, Number(formData.get('duration')) || 10));

    if (!existsSync(TMP_DIR)) await mkdir(TMP_DIR, { recursive: true });

    const id = randomBytes(8).toString('hex');
    const inputPath = path.join(TMP_DIR, `${id}_input`);
    const palettePath = path.join(TMP_DIR, `${id}_palette.png`);
    const outputPath = path.join(TMP_DIR, `${id}.gif`);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    const cleanup = () => Promise.allSettled([
      unlink(inputPath).catch(() => {}),
      unlink(palettePath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);

    try {
      // Step 1: palette
      await runFFmpeg([
        '-y', '-ss', String(startTime), '-t', String(duration),
        '-i', inputPath,
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
        palettePath,
      ], 60_000);

      // Step 2: convert with palette
      await runFFmpeg([
        '-y', '-ss', String(startTime), '-t', String(duration),
        '-i', inputPath, '-i', palettePath,
        '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
        outputPath,
      ], 120_000);

      const gifBuffer = await readFile(outputPath);
      await cleanup();

      const safeName = file.name.replace(/[^\w.-]/g, '_').replace(/\.\w+$/, '').slice(0, 50) || 'video';

      return new NextResponse(gifBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="${safeName}.gif"`,
          'Content-Length': String(gifBuffer.length),
        },
      });
    } catch (ffErr) {
      await cleanup();
      const msg = ffErr instanceof Error ? ffErr.message : 'Unknown error';
      console.error('[MP4-TO-GIF]', msg.slice(0, 300));

      // Try simpler single-pass conversion as fallback
      try {
        await writeFile(inputPath, buffer);
        await runFFmpeg([
          '-y', '-ss', String(startTime), '-t', String(duration),
          '-i', inputPath,
          '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
          '-f', 'gif',
          outputPath,
        ], 120_000);

        const gifBuffer = await readFile(outputPath);
        await cleanup();

        const safeName = file.name.replace(/[^\w.-]/g, '_').replace(/\.\w+$/, '').slice(0, 50) || 'video';
        return new NextResponse(gifBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Content-Disposition': `attachment; filename="${safeName}.gif"`,
            'Content-Length': String(gifBuffer.length),
          },
        });
      } catch (fallbackErr) {
        await cleanup();
        console.error('[MP4-TO-GIF] Fallback also failed:', fallbackErr instanceof Error ? fallbackErr.message.slice(0, 200) : fallbackErr);
        return NextResponse.json({ error: 'Conversion failed. The video format may not be supported.' }, { status: 500 });
      }
    }
  } catch (err) {
    console.error('[MP4-TO-GIF] Outer error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
