/**
 * GET|HEAD /api/v1/mobile/media/:userId/:file?s=signature
 *
 * Serves a stored video or its frame by a signed link (see
 * src/lib/autopost/media.ts). Supports a single byte range so players can
 * seek. No key header: the HMAC in the link is the permission.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { resolveSigned } from '@/lib/autopost/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ user: string; file: string }> };

const TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  jpg: 'image/jpeg',
};

async function serve(req: Request, { params }: Ctx, head: boolean) {
  const { user, file } = await params;
  const path = resolveSigned(decodeURIComponent(user), file, new URL(req.url).searchParams.get('s'));
  if (!path) return new Response('Not found', { status: 404 });
  let size: number;
  try {
    const s = await stat(path);
    if (!s.isFile()) return new Response('Not found', { status: 404 });
    size = s.size;
  } catch {
    return new Response('Not found', { status: 404 });
  }
  const ext = file.split('.').pop() ?? '';
  const headers: Record<string, string> = {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': ext === 'jpg' ? 'private, max-age=604800, immutable' : 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    headers['Content-Length'] = String(end - start + 1);
    if (head) return new Response(null, { status: 206, headers });
    const body = Readable.toWeb(createReadStream(path, { start, end })) as unknown as ReadableStream;
    return new Response(body, { status: 206, headers });
  }

  headers['Content-Length'] = String(size);
  if (head) return new Response(null, { status: 200, headers });
  const body = Readable.toWeb(createReadStream(path)) as unknown as ReadableStream;
  return new Response(body, { status: 200, headers });
}

export async function GET(req: Request, ctx: Ctx) {
  return serve(req, ctx, false);
}

export async function HEAD(req: Request, ctx: Ctx) {
  return serve(req, ctx, true);
}
