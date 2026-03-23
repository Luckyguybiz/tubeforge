import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { uploadFile } from '@/lib/storage';
import { rateLimit } from '@/lib/rate-limit';
import { MAX_UPLOAD_SIZE } from '@/lib/constants';
import { createLogger } from '@/lib/logger';

const uploadLog = createLogger('upload');

/** Allowed image MIME types — rejects SVG (XSS risk) and exotic formats */
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { success, reset } = await rateLimit({ identifier: `upload:${session.user.id}`, limit: 20, window: 60 });
  if (!success) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only images allowed (JPEG, PNG, WebP, GIF, AVIF)' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic byte validation: verify the file header matches claimed MIME type
    const header = buffer.subarray(0, 8);
    const isJpeg = header[0] === 0xFF && header[1] === 0xD8;
    const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
    const isGif = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46;
    const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
    // AVIF starts with ftyp box
    const isAvif = header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70;

    if (!isJpeg && !isPng && !isGif && !isWebp && !isAvif) {
      return NextResponse.json({ error: 'File is not a valid image' }, { status: 400 });
    }

    const url = await uploadFile(buffer, file.name, file.type);
    if (!url) {
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
    return NextResponse.json({ url }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    uploadLog.error('Upload failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
