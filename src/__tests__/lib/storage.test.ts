/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {},
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

// Mock uid for predictable file names
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, uid: () => 'test-uid-123' };
});

import { writeFile, mkdir } from 'fs/promises';
import { uploadFile, downloadAndStore } from '@/lib/storage';

describe('uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create the uploads directory recursively', async () => {
    await uploadFile(Buffer.from('data'), 'image.png', 'image/png');
    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('public/uploads'), {
      recursive: true,
    });
  });

  it('should write the buffer to disk', async () => {
    const buf = Buffer.from('hello');
    await uploadFile(buf, 'file.jpg', 'image/jpeg');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('test-uid-123.jpg'),
      buf
    );
  });

  it('should return a URL starting with /uploads/', async () => {
    const url = await uploadFile(Buffer.from('x'), 'photo.webp', 'image/webp');
    expect(url).toBe('/uploads/test-uid-123.webp');
  });

  it('should extract extension from filename', async () => {
    const url = await uploadFile(Buffer.from('x'), 'doc.pdf', 'application/pdf');
    expect(url).toBe('/uploads/test-uid-123.pdf');
  });

  it('should use the filename itself as extension when no dot separator', async () => {
    // 'noext'.split('.').pop() === 'noext', so it becomes the extension
    const url = await uploadFile(Buffer.from('x'), 'noext', 'application/octet-stream');
    expect(url).toBe('/uploads/test-uid-123.noext');
  });

  it('should handle multi-dot filenames (take last extension)', async () => {
    const url = await uploadFile(Buffer.from('x'), 'my.photo.final.png', 'image/png');
    expect(url).toBe('/uploads/test-uid-123.png');
  });
});

describe('downloadAndStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch the URL and store the result', async () => {
    const fakeArrayBuffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeArrayBuffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    });

    const url = await downloadAndStore('https://example.com/image.png', 'downloaded.png');
    expect(fetch).toHaveBeenCalledWith('https://example.com/image.png');
    expect(url).toBe('/uploads/test-uid-123.png');
    expect(writeFile).toHaveBeenCalled();
  });

  it('should throw on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(downloadAndStore('https://example.com/missing.png', 'missing.png')).rejects.toThrow(
      'Не удалось скачать файл: Not Found'
    );
  });

  it('should use application/octet-stream as fallback content-type', async () => {
    const fakeArrayBuffer = new ArrayBuffer(4);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeArrayBuffer),
      headers: new Headers({}),
    });

    const url = await downloadAndStore('https://example.com/data', 'file.bin');
    expect(url).toBe('/uploads/test-uid-123.bin');
  });
});
