import { createHash } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'gen');

/**
 * Downloads an image from a temporary URL and saves it locally.
 * Returns the persistent local URL path (e.g., /gen/abc123.webp)
 */
export async function persistImage(tempUrl: string, userId: string): Promise<string> {
  try {
    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename from URL + userId + timestamp
    const hash = createHash('sha256')
      .update(`${tempUrl}-${userId}-${Date.now()}`)
      .digest('hex')
      .slice(0, 16);

    // Determine extension from URL or default to webp
    const ext = tempUrl.includes('.png') ? 'png' : 'webp';
    const filename = `${hash}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Download image
    const response = await fetch(tempUrl, {
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      console.error(`[IMAGE-STORAGE] Failed to download: ${response.status}`);
      return tempUrl; // Fallback to original URL
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filepath, buffer);

    // Return local path
    return `/gen/${filename}`;
  } catch (err) {
    console.error('[IMAGE-STORAGE] Failed to persist image:', err);
    return tempUrl; // Fallback to original URL on any error
  }
}
