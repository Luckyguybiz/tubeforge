import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { uid } from './utils';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

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
  const ext = filename.split('.').pop() || 'bin';
  const name = `${uid()}.${ext}`;
  const path = join(UPLOAD_DIR, name);
  await writeFile(path, buffer);
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
