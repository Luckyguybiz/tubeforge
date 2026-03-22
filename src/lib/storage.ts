import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { uid } from './utils';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

/** Only allow safe alphanumeric extensions (2-5 chars) */
const SAFE_EXT_RE = /^[a-zA-Z0-9]{2,5}$/;

/** Maximum download size for remote files (50 MB) */
const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;

/** Allowed MIME types for downloaded files */
const ALLOWED_DOWNLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

/**
 * Validate a URL to prevent SSRF attacks.
 * - Must use https:// scheme
 * - Must not resolve to private/internal IP ranges or localhost
 */
function validateExternalUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }

  // Only allow HTTPS
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and common loopback names
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Requests to internal hosts are not allowed');
  }

  // Block private and reserved IP ranges
  // IPv4 patterns: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x, 169.254.x.x, 0.x.x.x
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||                           // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) ||  // 172.16.0.0/12
      (a === 192 && b === 168) ||            // 192.168.0.0/16
      a === 127 ||                           // 127.0.0.0/8
      (a === 169 && b === 254) ||            // 169.254.0.0/16 (link-local)
      a === 0                                // 0.0.0.0/8
    ) {
      throw new Error('Requests to private IP ranges are not allowed');
    }
  }
}

/**
 * Validate magic bytes of a downloaded buffer match an allowed image type.
 * Returns the detected MIME type, or throws if not a valid image.
 */
function validateMagicBytes(buffer: Buffer): string {
  if (buffer.length < 8) {
    throw new Error('Downloaded file is too small to be a valid image');
  }
  const h = buffer.subarray(0, 8);
  if (h[0] === 0xFF && h[1] === 0xD8) return 'image/jpeg';
  if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4E && h[3] === 0x47) return 'image/png';
  if (h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46) return 'image/gif';
  if (h[0] === 0x52 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x46) return 'image/webp';
  if (h[4] === 0x66 && h[5] === 0x74 && h[6] === 0x79 && h[7] === 0x70) return 'image/avif';
  throw new Error('Downloaded file is not a valid image (magic bytes mismatch)');
}

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
 *
 * Security: validates URL (SSRF), enforces size limit, checks MIME type
 * and magic bytes before storing.
 */
export async function downloadAndStore(
  url: string,
  filename: string
): Promise<string> {
  // SSRF protection: validate scheme, block private IPs and localhost
  validateExternalUrl(url);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);

  // Check Content-Length before downloading (if provided)
  const contentLength = res.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_DOWNLOAD_SIZE) {
    throw new Error(`File too large (${contentLength} bytes, max ${MAX_DOWNLOAD_SIZE})`);
  }

  // Check MIME type from the response
  const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() || '';
  if (!ALLOWED_DOWNLOAD_TYPES.has(contentType)) {
    throw new Error(`Disallowed content type: ${contentType}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  // Enforce size limit on actual body (Content-Length can be spoofed or absent)
  if (buffer.length > MAX_DOWNLOAD_SIZE) {
    throw new Error(`File too large (${buffer.length} bytes, max ${MAX_DOWNLOAD_SIZE})`);
  }

  // Validate magic bytes match an allowed image format
  validateMagicBytes(buffer);

  return uploadFile(buffer, filename, contentType);
}
