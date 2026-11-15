// @vitest-environment node
/**
 * Signed connect state, NextAuth callback hand-off, media links and the
 * error classifier of the autopost app.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ env: { AUTH_SECRET: 'test-secret', AUTH_GOOGLE_ID: 'cid', AUTH_GOOGLE_SECRET: 'gsecret' } }));
vi.mock('@/server/db', () => ({ db: {} }));

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret';
  process.env.CRON_SECRET = 'cron-secret';
  process.env.NEXT_PUBLIC_APP_URL = 'https://tubeforge.co';
});

describe('connect state', () => {
  it('round-trips and rejects tampering, foreign prefixes and old states', async () => {
    const { signState, verifyState, STATE_PREFIX } = await import('@/lib/autopost/youtube-connect');
    const st = signState({ k: 'key1', e: null, r: 'autopost://connected', cb: 'https://tubeforge.co/api/auth/callback/google', tz: 'Asia/Almaty' });
    expect(st.startsWith(STATE_PREFIX)).toBe(true);
    const ok = verifyState(st);
    expect(ok).toMatchObject({ k: 'key1', e: null, r: 'autopost://connected', tz: 'Asia/Almaty' });

    const [head, sig] = [st.slice(0, st.lastIndexOf('.')), st.slice(st.lastIndexOf('.') + 1)];
    const forged = Buffer.from(JSON.stringify({ k: 'other', e: null, r: 'https://evil.example', cb: 'x', tz: null, n: '1', iat: 9e9 })).toString('base64url');
    expect(verifyState(`${STATE_PREFIX}${forged}.${sig}`)).toBeNull();
    expect(verifyState(`${head}.${sig.slice(0, -2)}xx`)).toBeNull();
    expect(verifyState('eyJhbGciOi.something')).toBeNull();
    expect(verifyState(st, Date.now() + 2 * 3600 * 1000)).toBe('expired');
  });

  it('allows web and app redirects only', async () => {
    const { isAllowedRedirect } = await import('@/lib/autopost/youtube-connect');
    expect(isAllowedRedirect('autopost://connected')).toBe(true);
    expect(isAllowedRedirect('https://luckyteam.space/x')).toBe(true);
    expect(isAllowedRedirect('javascript:alert(1)')).toBe(false);
    expect(isAllowedRedirect('otherapp://steal')).toBe(false);
    expect(isAllowedRedirect('not a url')).toBe(false);
  });

  it('builds the Google URL with the registered callback and offline access', async () => {
    const { authorizationUrl, connectCallbackUrl } = await import('@/lib/autopost/youtube-connect');
    const url = new URL(authorizationUrl('tfy1.a.b', connectCallbackUrl(), 'me@example.com'));
    expect(url.searchParams.get('redirect_uri')).toBe('https://tubeforge.co/api/auth/callback/google');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('scope')).toContain('youtube.upload');
    expect(url.searchParams.get('login_hint')).toBe('me@example.com');
  });
});

describe('NextAuth route hand-off', () => {
  it('sends only our states to the connect handler', async () => {
    vi.resetModules();
    const connect = vi.fn(async () => new Response('connect', { status: 302 }));
    const nextAuthGet = vi.fn(async () => new Response('nextauth'));
    vi.doMock('@/lib/autopost/youtube-connect', () => ({ STATE_PREFIX: 'tfy1.', handleConnectCallback: connect }));
    vi.doMock('@/server/auth', () => ({ handlers: { GET: nextAuthGet, POST: vi.fn() }, getLastAuthError: () => null }));
    const { GET } = await import('@/app/api/auth/[...nextauth]/route');
    const { NextRequest } = await import('next/server');

    await GET(new NextRequest('https://tubeforge.co/api/auth/callback/google?state=tfy1.abc.def&code=1'));
    expect(connect).toHaveBeenCalledTimes(1);
    expect(nextAuthGet).not.toHaveBeenCalled();

    await GET(new NextRequest('https://tubeforge.co/api/auth/callback/google?state=eyJhbGc&code=1'));
    await GET(new NextRequest('https://tubeforge.co/api/auth/session'));
    expect(connect).toHaveBeenCalledTimes(1);
    expect(nextAuthGet).toHaveBeenCalledTimes(2);
    vi.doUnmock('@/lib/autopost/youtube-connect');
    vi.doUnmock('@/server/auth');
  });
});

describe('media links', () => {
  it('detects video containers by magic bytes', async () => {
    const { sniffVideo } = await import('@/lib/autopost/media');
    const mp4 = new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
    const mov = new Uint8Array([0, 0, 0, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20]);
    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]);
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffVideo(mp4)).toBe('mp4');
    expect(sniffVideo(mov)).toBe('mov');
    expect(sniffVideo(webm)).toBe('webm');
    expect(sniffVideo(png)).toBeNull();
  });

  it('signs links per user and file and maps them back to disk', async () => {
    const { mediaUrl, resolveSigned, localPathFromUrl, MEDIA_DIR } = await import('@/lib/autopost/media');
    const fileId = 'A'.repeat(32);
    const url = mediaUrl('user_12345678', fileId, 'video', 'mp4');
    expect(url.startsWith('https://tubeforge.co/api/v1/mobile/media/user_12345678/')).toBe(true);
    const path = localPathFromUrl(url);
    expect(path).toBe(`${MEDIA_DIR}/user_12345678/${fileId}.mp4`);

    const sig = new URL(url).searchParams.get('s');
    expect(resolveSigned('user_99999999', `${fileId}.mp4`, sig)).toBeNull();
    expect(resolveSigned('user_12345678', `${fileId}.jpg`, sig)).toBeNull();
    expect(resolveSigned('user_12345678', `../etc/passwd`, sig)).toBeNull();
    expect(localPathFromUrl(url.replace('tubeforge.co', 'evil.example'))).toBeNull();
    expect(localPathFromUrl('https://cdn.example.com/video.mp4')).toBeNull();
  });
});

describe('error classifier', () => {
  it('maps worker messages to the app error codes', async () => {
    const { classifyError } = await import('@/lib/autopost/service');
    expect(classifyError('Metadata POST failed: HTTP 403 {"error":{"errors":[{"reason":"quotaExceeded"}]}}')).toBe('quota');
    expect(classifyError('Token refresh failed: HTTP 400')).toBe('auth');
    expect(classifyError('YouTube account not connected')).toBe('auth');
    expect(classifyError('Source video fetch failed: the media file is missing')).toBe('file_missing');
    expect(classifyError('This operation was aborted')).toBe('network');
    expect(classifyError('Video PUT failed: HTTP 400 invalid video')).toBe('rejected');
    expect(classifyError(null)).toBe('unknown');
  });
});
