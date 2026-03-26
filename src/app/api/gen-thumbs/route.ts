import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const THUMBS_DIR = path.join(process.cwd(), '.gen-thumbs');

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !/^[\w.-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const filePath = path.join(THUMBS_DIR, id);
  try {
    const buf = await fs.readFile(filePath);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
