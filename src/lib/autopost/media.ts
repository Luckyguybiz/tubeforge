/**
 * Video files uploaded from the autopost app.
 *
 * Files live outside the web root, in AUTOPOST_MEDIA_DIR (default
 * /mnt/storage/tubeforge/autopost-media, the large data disk of the VPS):
 *
 *   <dir>/<userId>/<fileId>.<ext>   the video
 *   <dir>/<userId>/<fileId>.jpg     a frame for the app list
 *
 * fileId is 24 random bytes, so links are unguessable; every link we hand
 * out also carries an HMAC so a file of one user is never served by a
 * guessed path of another. The upload worker reads the video straight from
 * disk (see openLocalMedia) and deletes it after YouTube accepts it.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, rename, rm, stat, unlink } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export const MEDIA_DIR = resolve(process.env.AUTOPOST_MEDIA_DIR || '/mnt/storage/tubeforge/autopost-media');
/** 2 GB: a long 4K short is far below, and the data disk has room. */
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
const MEDIA_PATH = '/api/v1/mobile/media';

const FILE_ID_RE = /^[A-Za-z0-9_-]{32}$/;
const USER_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const EXTS = new Set(['mp4', 'mov', 'm4v', 'webm']);

export type MediaKind = 'video' | 'thumb';

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not configured');
  return s;
}

export function isFileId(id: unknown): id is string {
  return typeof id === 'string' && FILE_ID_RE.test(id);
}

function userDir(userId: string): string {
  if (!USER_ID_RE.test(userId)) throw new Error('Invalid user id');
  const dir = resolve(MEDIA_DIR, userId);
  if (!dir.startsWith(MEDIA_DIR + sep)) throw new Error('Invalid media path');
  return dir;
}

function videoPath(userId: string, fileId: string, ext: string): string {
  return join(userDir(userId), `${fileId}.${ext}`);
}

function thumbPath(userId: string, fileId: string): string {
  return join(userDir(userId), `${fileId}.jpg`);
}

/** Detects the container by magic bytes. */
export function sniffVideo(head: Uint8Array): 'mp4' | 'mov' | 'webm' | null {
  if (head.length >= 12 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
    const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
    return brand === 'qt  ' ? 'mov' : 'mp4';
  }
  if (head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return 'webm';
  return null;
}

export class MediaError extends Error {
  constructor(
    readonly code: 'too_large' | 'empty' | 'not_video' | 'aborted',
    message: string,
  ) {
    super(message);
    this.name = 'MediaError';
  }
}

export interface StoredVideo {
  fileId: string;
  ext: string;
  size: number;
  durationSec: number | null;
  hasThumb: boolean;
}

/** Streams a request body to disk with a hard size limit and a type check. */
export async function storeVideo(userId: string, body: ReadableStream<Uint8Array>): Promise<StoredVideo> {
  const dir = userDir(userId);
  await mkdir(dir, { recursive: true, mode: 0o750 });
  const fileId = randomBytes(24).toString('base64url');
  const tmp = join(dir, `${fileId}.part`);

  let size = 0;
  const limiter = async function* (source: AsyncIterable<Uint8Array>) {
    for await (const chunk of source) {
      size += chunk.byteLength;
      if (size > MAX_VIDEO_BYTES) throw new MediaError('too_large', 'File is larger than 2 GB');
      yield chunk;
    }
  };

  try {
    await pipeline(Readable.fromWeb(body as import('node:stream/web').ReadableStream<Uint8Array>), limiter, createWriteStream(tmp, { mode: 0o640 }));
  } catch (e) {
    await unlink(tmp).catch(() => undefined);
    if (e instanceof MediaError) throw e;
    throw new MediaError('aborted', 'The upload was interrupted');
  }

  if (size === 0) {
    await unlink(tmp).catch(() => undefined);
    throw new MediaError('empty', 'File is empty');
  }

  const fh = await open(tmp, 'r');
  const head = new Uint8Array(16);
  await fh.read(head, 0, 16, 0);
  await fh.close();
  const ext = sniffVideo(head);
  if (!ext) {
    await unlink(tmp).catch(() => undefined);
    throw new MediaError('not_video', 'File is not an MP4, MOV or WebM video');
  }

  const final = videoPath(userId, fileId, ext);
  await rename(tmp, final);

  const [durationSec, hasThumb] = await Promise.all([probeDuration(final), makeThumb(final, thumbPath(userId, fileId))]);
  return { fileId, ext, size, durationSec, hasThumb };
}

/** Duration and frame of a stored video, for a new post. */
export async function videoFacts(userId: string, fileId: string, ext: string): Promise<{ durationSec: number | null; hasThumb: boolean }> {
  const [durationSec, hasThumb] = await Promise.all([
    probeDuration(videoPath(userId, fileId, ext)),
    stat(thumbPath(userId, fileId))
      .then((s) => s.isFile() && s.size > 0)
      .catch(() => false),
  ]);
  return { durationSec, hasThumb };
}

async function probeDuration(file: string): Promise<number | null> {
  try {
    const { stdout } = await run(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file],
      { timeout: 20_000 },
    );
    const n = Number.parseFloat(stdout.trim());
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  } catch {
    return null;
  }
}

async function makeThumb(file: string, out: string): Promise<boolean> {
  try {
    await run(
      'ffmpeg',
      ['-v', 'error', '-y', '-ss', '1', '-i', file, '-frames:v', '1', '-vf', 'scale=360:-2', '-q:v', '5', out],
      { timeout: 30_000 },
    );
    return (await stat(out)).size > 0;
  } catch {
    // Very short clips have no frame at 1 s: take the first one.
    try {
      await run('ffmpeg', ['-v', 'error', '-y', '-i', file, '-frames:v', '1', '-vf', 'scale=360:-2', '-q:v', '5', out], {
        timeout: 30_000,
      });
      return (await stat(out)).size > 0;
    } catch {
      return false;
    }
  }
}

/** Finds an uploaded video of this user by id. */
export async function findVideo(userId: string, fileId: string): Promise<{ ext: string; size: number } | null> {
  if (!isFileId(fileId)) return null;
  for (const ext of EXTS) {
    try {
      const s = await stat(videoPath(userId, fileId, ext));
      if (s.isFile()) return { ext, size: s.size };
    } catch {
      /* try the next extension */
    }
  }
  return null;
}

function sign(userId: string, name: string): string {
  return createHmac('sha256', secret()).update(`${userId}/${name}`).digest('base64url').slice(0, 32);
}

function origin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://tubeforge.co').replace(/\/$/, '');
}

/** Signed absolute URL of a stored file. */
export function mediaUrl(userId: string, fileId: string, kind: MediaKind, ext = 'mp4'): string {
  const name = kind === 'thumb' ? `${fileId}.jpg` : `${fileId}.${ext}`;
  return `${origin()}${MEDIA_PATH}/${encodeURIComponent(userId)}/${name}?s=${sign(userId, name)}`;
}

/** Resolves a signed media request to a file path, or null. */
export function resolveSigned(userId: string, name: string, signature: string | null): string | null {
  if (!signature || !USER_ID_RE.test(userId)) return null;
  const m = /^([A-Za-z0-9_-]{32})\.(mp4|mov|m4v|webm|jpg)$/.exec(name);
  if (!m) return null;
  const expected = sign(userId, name);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return join(userDir(userId), name);
}

/** Parses one of our own media URLs back to the file on disk. */
export function localPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.origin !== origin()) return null;
    const m = new RegExp(`^${MEDIA_PATH}/([^/]+)/([^/]+)$`).exec(u.pathname);
    if (!m) return null;
    return resolveSigned(decodeURIComponent(m[1]), m[2], u.searchParams.get('s'));
  } catch {
    return null;
  }
}

/** For the upload worker: a stream of the video when it is one of ours. */
export async function openLocalMedia(
  url: string,
): Promise<{ size: number; contentType: string; open: () => ReadableStream<Uint8Array> } | 'missing' | null> {
  const path = localPathFromUrl(url);
  if (!path) return null;
  try {
    const s = await stat(path);
    if (!s.isFile() || s.size === 0) return 'missing';
    const ext = path.split('.').pop();
    const contentType = ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
    const open = () => Readable.toWeb(createReadStream(path)) as unknown as ReadableStream<Uint8Array>;
    return { size: s.size, contentType, open };
  } catch {
    return 'missing';
  }
}

/** Removes the video of a job (and optionally its frame). Never throws. */
export async function removeMediaByUrl(videoUrl: string | null | undefined, opts: { thumbUrl?: string | null } = {}) {
  for (const url of [videoUrl, opts.thumbUrl]) {
    if (!url) continue;
    const path = localPathFromUrl(url);
    if (path) await unlink(path).catch(() => undefined);
  }
}

/** Removes every file of a user. Used by account deletion. */
export async function removeUserMedia(userId: string): Promise<void> {
  try {
    await rm(userDir(userId), { recursive: true, force: true });
  } catch {
    /* nothing stored for an id we never write under */
  }
}
