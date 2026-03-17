import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { uid } from './utils';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

/** Only allow safe alphanumeric extensions (2-5 chars) */
const SAFE_EXT_RE = /^[a-zA-Z0-9]{2,5}$/;

/**
 * Upload a buffer to local storage (replace with S3/Supabase in production).
 * Returns the public URL.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  _contentType: string
): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const rawExt = filename.split('.').pop() || 'bin';
  // Sanitize extension: strip non-alphanumeric chars, fallback to 'bin'
  const ext = SAFE_EXT_RE.test(rawExt) ? rawExt.toLowerCase() : 'bin';
  const name = `${uid()}.${ext}`;
  const destPath = join(UPLOAD_DIR, name);
  // Guard against path traversal: resolved path must stay inside UPLOAD_DIR
  if (!resolve(destPath).startsWith(resolve(UPLOAD_DIR))) {
    throw new Error('Invalid file path');
  }
  await writeFile(destPath, buffer);
  return `/uploads/${name}`;
}

/**
 * Fetch a URL and store it permanently.
 * Useful for persisting DALL-E images (their URLs expire after ~1 hour).
 */
export async function downloadAndStore(
  url: string,
  filename: string
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать файл: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return uploadFile(buffer, filename, res.headers.get('content-type') || 'application/octet-stream');
}
