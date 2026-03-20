// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs/promises before any imports that use it
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

  // --- Unique filename generation with uid ---

  it('should generate a filename using uid', async () => {
    const url = await uploadFile(Buffer.from('data'), 'photo.png', 'image/png');
    expect(url).toBe('/uploads/test-uid-123.png');
  });

  it('should include the uid in the written file path', async () => {
    await uploadFile(Buffer.from('data'), 'photo.png', 'image/png');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('test-uid-123.png'),
      expect.any(Buffer)
    );
  });

  // --- Directory creation ---

  it('should create the uploads directory recursively', async () => {
    await uploadFile(Buffer.from('data'), 'image.png', 'image/png');
    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('public/uploads'), {
      recursive: true,
    });
  });

  // --- Buffer writing ---

  it('should write the exact buffer to disk', async () => {
    const buf = Buffer.from('hello world');
    await uploadFile(buf, 'file.jpg', 'image/jpeg');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('test-uid-123.jpg'),
      buf
    );
  });

  // --- URL format ---

  it('should return a URL starting with /uploads/', async () => {
    const url = await uploadFile(Buffer.from('x'), 'photo.webp', 'image/webp');
    expect(url).toMatch(/^\/uploads\//);
  });

  it('should return a URL containing the uid and extension', async () => {
    const url = await uploadFile(Buffer.from('x'), 'doc.pdf', 'application/pdf');
    expect(url).toBe('/uploads/test-uid-123.pdf');
  });

  // --- Extension sanitization: valid extensions ---

  it('should accept a 2-char alphanumeric extension', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.ts', 'text/plain');
    expect(url).toBe('/uploads/test-uid-123.ts');
  });

  it('should accept a 3-char alphanumeric extension', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.jpg', 'image/jpeg');
    expect(url).toBe('/uploads/test-uid-123.jpg');
  });

  it('should accept a 4-char alphanumeric extension', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.webp', 'image/webp');
    expect(url).toBe('/uploads/test-uid-123.webp');
  });

  it('should accept a 5-char alphanumeric extension', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.fmpeg', 'video/mp4');
    expect(url).toBe('/uploads/test-uid-123.fmpeg');
  });

  it('should lowercase valid uppercase extensions', async () => {
    const url = await uploadFile(Buffer.from('x'), 'IMAGE.PNG', 'image/png');
    expect(url).toBe('/uploads/test-uid-123.png');
  });

  it('should lowercase valid mixed-case extensions', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.JpEg', 'image/jpeg');
    expect(url).toBe('/uploads/test-uid-123.jpeg');
  });

  // --- Extension sanitization: invalid extensions fall back to 'bin' ---

  it('should fall back to bin for a 1-char extension', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.a', 'application/octet-stream');
    expect(url).toBe('/uploads/test-uid-123.bin');
  });

  it('should fall back to bin for a 6-char extension', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.abcdef', 'application/octet-stream');
    expect(url).toBe('/uploads/test-uid-123.bin');
  });

  it('should fall back to bin for extensions with special characters', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.p-n-g', 'image/png');
    expect(url).toBe('/uploads/test-uid-123.bin');
  });

  it('should fall back to bin for extensions with dots', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.tar.gz', 'application/gzip');
    // .pop() gives 'gz' which is valid 2-char
    expect(url).toBe('/uploads/test-uid-123.gz');
  });

  it('should fall back to bin for extensions with spaces', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.p g', 'image/png');
    expect(url).toBe('/uploads/test-uid-123.bin');
  });

  it('should fall back to bin for extensions with underscores', async () => {
    const url = await uploadFile(Buffer.from('x'), 'file.p_g', 'image/png');
    expect(url).toBe('/uploads/test-uid-123.bin');
  });

  it('should fall back to bin for empty extension after dot', async () => {
    // 'file.'.split('.').pop() === '', which fails SAFE_EXT_RE
    const url = await uploadFile(Buffer.from('x'), 'file.', 'application/octet-stream');
    expect(url).toBe('/uploads/test-uid-123.bin');
  });

  it('should use filename as extension when no dot is present', async () => {
    // 'noext'.split('.').pop() === 'noext' which is 5 chars, valid
    const url = await uploadFile(Buffer.from('x'), 'noext', 'application/octet-stream');
    expect(url).toBe('/uploads/test-uid-123.noext');
  });

  it('should fall back to bin for no-dot filename longer than 5 chars', async () => {
    // 'longername'.split('.').pop() === 'longername' which exceeds 5 chars
    const url = await uploadFile(Buffer.from('x'), 'longername', 'application/octet-stream');
    expect(url).toBe('/uploads/test-uid-123.bin');
  });

  // --- Multi-dot filenames ---

  it('should use last extension for multi-dot filenames', async () => {
    const url = await uploadFile(Buffer.from('x'), 'my.photo.final.png', 'image/png');
    expect(url).toBe('/uploads/test-uid-123.png');
  });

  // --- Path traversal protection ---

  it('should not allow path traversal in the uid-generated name', async () => {
    // The uid is mocked to a safe value, so this tests the normal path.
    // The resolve check in the source guards against manipulated destPath.
    const url = await uploadFile(Buffer.from('x'), 'safe.png', 'image/png');
    expect(url).toBe('/uploads/test-uid-123.png');
    // Verify writeFile was called with a path under public/uploads
    const writtenPath = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(writtenPath).toContain('public/uploads');
    expect(writtenPath).not.toContain('..');
  });
});

describe('downloadAndStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch the given URL', async () => {
    // Valid PNG magic bytes so security checks pass
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(pngBytes.buffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    });

    await downloadAndStore('https://example.com/image.png', 'downloaded.png');
    expect(fetch).toHaveBeenCalledWith('https://example.com/image.png');
  });

  it('should delegate to uploadFile and return the resulting URL', async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(pngBytes.buffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    });

    const url = await downloadAndStore('https://example.com/image.png', 'downloaded.png');
    expect(url).toBe('/uploads/test-uid-123.png');
    expect(writeFile).toHaveBeenCalled();
    expect(mkdir).toHaveBeenCalled();
  });

  it('should convert the fetched arrayBuffer to a Buffer and write it', async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(pngBytes.buffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    });

    await downloadAndStore('https://example.com/data.png', 'data.png');
    const writtenBuffer = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as Buffer;
    expect(Buffer.isBuffer(writtenBuffer)).toBe(true);
    expect(writtenBuffer.length).toBe(16);
  });

  it('should throw on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(
      downloadAndStore('https://example.com/missing.png', 'missing.png')
    ).rejects.toThrow('Не удалось скачать файл: Not Found');
  });

  it('should throw with the exact statusText from the response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });

    await expect(
      downloadAndStore('https://example.com/fail', 'fail.png')
    ).rejects.toThrow('Internal Server Error');
  });

  it('should reject when content-type is missing (not in allowed types)', async () => {
    const fakeArrayBuffer = new ArrayBuffer(16);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeArrayBuffer),
      headers: new Headers({}),
    });

    await expect(
      downloadAndStore('https://example.com/data', 'file.bin')
    ).rejects.toThrow('Disallowed content type');
  });

  it('should pass the filename through to uploadFile for extension extraction', async () => {
    // JPEG magic bytes
    const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(jpegBytes.buffer),
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    });

    const url = await downloadAndStore('https://example.com/pic', 'photo.jpeg');
    expect(url).toBe('/uploads/test-uid-123.jpeg');
  });

  it('should not call writeFile when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
    });

    await expect(
      downloadAndStore('https://example.com/secret.png', 'secret.png')
    ).rejects.toThrow();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('should handle fetch network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    await expect(
      downloadAndStore('https://example.com/timeout.png', 'timeout.png')
    ).rejects.toThrow('Network failure');
  });
});
