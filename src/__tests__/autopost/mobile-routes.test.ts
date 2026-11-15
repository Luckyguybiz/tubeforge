// @vitest-environment node
/**
 * /api/v1/mobile routes with the database mocked: sign-in by email code,
 * device key, sign-out, account deletion guards, YouTube connect start,
 * channel rules validation and video creation input.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

vi.hoisted(() => {
  process.env.AUTOPOST_MEDIA_DIR = '/tmp/autopost-test-media';
});

vi.mock('@/lib/env', () => ({ env: { AUTH_SECRET: 'test-secret', AUTH_GOOGLE_ID: 'cid', AUTH_GOOGLE_SECRET: 'gsecret' } }));

const rate = vi.fn(async () => ({ success: true, remaining: 1, reset: Date.now() + 60_000 }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rate(...(a as [])) }));

const sendEmail = vi.fn(async () => undefined);
vi.mock('@/lib/email', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...(a as [])) }));

const issueCode = vi.fn(async () => '123456');
const consumeCode = vi.fn();
vi.mock('@/lib/email-code', () => ({
  CODE_TTL_MS: 15 * 60 * 1000,
  issueCode: (...a: unknown[]) => issueCode(...(a as [])),
  consumeCode: (...a: unknown[]) => consumeCode(...(a as [])),
  normalizeEmail: (e: string) => e.trim().toLowerCase(),
}));

const generateApiKey = vi.fn(async () => ({ fullKey: 'tf_devicekey', entry: { id: 'key_1', last4: 'ekey', label: 'x', createdAt: new Date() } }));
vi.mock('@/lib/api-keys', () => ({ generateApiKey: (...a: unknown[]) => generateApiKey(...(a as [])), hashKey: (k: string) => k }));

let authResult: unknown = { userId: 'user_1', apiKeyId: 'key_1', monthlyQuota: 1000, monthlyUsage: 0 };
vi.mock('@/lib/api-auth', () => ({ authenticateApiRequest: async () => authResult }));

const db = {
  user: { upsert: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  apiKey: { update: vi.fn(), updateMany: vi.fn() },
  auditLog: { create: vi.fn(async () => ({})) },
  externalUser: { upsert: vi.fn() },
  uploadJob: { count: vi.fn(async () => 0), findFirst: vi.fn() },
  account: { findMany: vi.fn(async () => []) },
  channel: { findFirst: vi.fn() },
};
vi.mock('@/server/db', () => ({ db }));

function post(url: string, body?: unknown, method = 'POST') {
  return new Request(`https://tubeforge.co${url}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-forge-key': 'tf_devicekey', 'x-real-ip': '1.2.3.4' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  authResult = { userId: 'user_1', apiKeyId: 'key_1', monthlyQuota: 1000, monthlyUsage: 0 };
  delete process.env.AUTOPOST_REVIEW_EMAIL;
  delete process.env.AUTOPOST_REVIEW_CODE;
  process.env.NEXT_PUBLIC_APP_URL = 'https://tubeforge.co';
  process.env.AUTH_SECRET = 'test-secret';
});

describe('POST /api/v1/mobile/auth/code', () => {
  it('sends the app code email in the chosen language', async () => {
    const { POST } = await import('@/app/api/v1/mobile/auth/code/route');
    const res = await POST(post('/api/v1/mobile/auth/code', { email: ' Me@Example.com ', locale: 'ru' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, ttlMinutes: 15 });
    expect(issueCode).toHaveBeenCalledWith('me@example.com');
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'me@example.com', template: 'autopost-sign-in-code', data: expect.objectContaining({ code: '123456', locale: 'ru' }) }),
    );
  });

  it('rejects a malformed email and enforces limits', async () => {
    const { POST } = await import('@/app/api/v1/mobile/auth/code/route');
    expect((await POST(post('/api/v1/mobile/auth/code', { email: 'nope' }))).status).toBe(400);
    rate.mockResolvedValueOnce({ success: false, remaining: 0, reset: 1 });
    const limited = await POST(post('/api/v1/mobile/auth/code', { email: 'me@example.com' }));
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.code).toBe('rate_limited');
    expect(issueCode).not.toHaveBeenCalled();
  });

  it('does not email the store review account', async () => {
    process.env.AUTOPOST_REVIEW_EMAIL = 'review@tubeforge.co';
    process.env.AUTOPOST_REVIEW_CODE = '424242';
    const { POST } = await import('@/app/api/v1/mobile/auth/code/route');
    const res = await POST(post('/api/v1/mobile/auth/code', { email: 'review@tubeforge.co' }));
    expect(res.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/mobile/auth/verify', () => {
  it('issues a device key for a valid code', async () => {
    consumeCode.mockResolvedValueOnce({ ok: true, email: 'me@example.com' });
    db.user.upsert.mockResolvedValueOnce({ id: 'user_1', email: 'me@example.com', name: null });
    const { POST } = await import('@/app/api/v1/mobile/auth/verify/route');
    const res = await POST(post('/api/v1/mobile/auth/verify', { email: 'me@example.com', code: '123456', device: 'iPhone 17' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ apiKey: 'tf_devicekey', user: { id: 'user_1', email: 'me@example.com', name: null } });
    expect(generateApiKey).toHaveBeenCalledWith('user_1', 'Автопостинг · iPhone 17');
    expect(db.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'autopost.sign_in' }) }));
  });

  it('tells a wrong code from an expired one and never issues a key', async () => {
    const { POST } = await import('@/app/api/v1/mobile/auth/verify/route');
    consumeCode.mockResolvedValueOnce({ ok: false, reason: 'invalid' });
    const wrong = await POST(post('/api/v1/mobile/auth/verify', { email: 'me@example.com', code: '000000' }));
    expect(wrong.status).toBe(400);
    expect((await wrong.json()).error.code).toBe('invalid_code');
    consumeCode.mockResolvedValueOnce({ ok: false, reason: 'expired' });
    const old = await POST(post('/api/v1/mobile/auth/verify', { email: 'me@example.com', code: '000000' }));
    expect((await old.json()).error.code).toBe('expired_code');
    const short = await POST(post('/api/v1/mobile/auth/verify', { email: 'me@example.com', code: '12' }));
    expect(short.status).toBe(400);
    expect(generateApiKey).not.toHaveBeenCalled();
  });

  it('lets the review account in with the fixed code only', async () => {
    process.env.AUTOPOST_REVIEW_EMAIL = 'review@tubeforge.co';
    process.env.AUTOPOST_REVIEW_CODE = '424242';
    db.user.upsert.mockResolvedValue({ id: 'user_r', email: 'review@tubeforge.co', name: null });
    const { POST } = await import('@/app/api/v1/mobile/auth/verify/route');
    expect((await POST(post('/api/v1/mobile/auth/verify', { email: 'review@tubeforge.co', code: '111111' }))).status).toBe(400);
    expect((await POST(post('/api/v1/mobile/auth/verify', { email: 'review@tubeforge.co', code: '424242' }))).status).toBe(200);
    expect(consumeCode).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/mobile/auth/sign-out', () => {
  it('revokes the calling key', async () => {
    const { POST } = await import('@/app/api/v1/mobile/auth/sign-out/route');
    const res = await POST(post('/api/v1/mobile/auth/sign-out'));
    expect(res.status).toBe(200);
    expect(db.apiKey.update).toHaveBeenCalledWith({ where: { id: 'key_1' }, data: { revokedAt: expect.any(Date) } });
  });

  it('passes auth failures through', async () => {
    authResult = NextResponse.json({ error: { code: 'revoked_api_key' } }, { status: 401 });
    const { POST } = await import('@/app/api/v1/mobile/auth/sign-out/route');
    expect((await POST(post('/api/v1/mobile/auth/sign-out'))).status).toBe(401);
    expect(db.apiKey.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/v1/mobile/account', () => {
  const base = {
    id: 'user_1',
    email: 'me@example.com',
    plan: 'FREE',
    stripeId: null,
    referralEarnings: 0,
    _count: { payouts: 0, ownedTeams: 0, channels: 1, uploadJobs: 3 },
  };

  it('needs the explicit confirmation', async () => {
    const { DELETE } = await import('@/app/api/v1/mobile/account/route');
    const res = await DELETE(post('/api/v1/mobile/account', {}, 'DELETE'));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('confirm_required');
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it('refuses accounts with money attached and touches nothing', async () => {
    const { DELETE } = await import('@/app/api/v1/mobile/account/route');
    db.user.findUnique.mockResolvedValueOnce({ ...base, plan: 'PRO', stripeId: 'cus_1' });
    const paid = await DELETE(post('/api/v1/mobile/account', { confirm: 'DELETE' }, 'DELETE'));
    expect(paid.status).toBe(409);
    expect((await paid.json()).error.code).toBe('billing_active');
    db.user.findUnique.mockResolvedValueOnce({ ...base, _count: { ...base._count, payouts: 2 } });
    const payouts = await DELETE(post('/api/v1/mobile/account', { confirm: 'DELETE' }, 'DELETE'));
    expect((await payouts.json()).error.code).toBe('payouts_exist');
    expect(db.apiKey.updateMany).not.toHaveBeenCalled();
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it('audits, revokes keys, deletes and notifies', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
    db.user.findUnique.mockResolvedValueOnce(base);
    db.account.findMany.mockResolvedValueOnce([{ refresh_token: 'rt', access_token: 'at' }] as never);
    const { DELETE } = await import('@/app/api/v1/mobile/account/route');
    const res = await DELETE(post('/api/v1/mobile/account', { confirm: 'DELETE', locale: 'ru' }, 'DELETE'));
    expect(res.status).toBe(200);
    expect(db.apiKey.updateMany).toHaveBeenCalled();
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'autopost.account.delete', target: 'user_1' }) }),
    );
    expect(fetchSpy).toHaveBeenCalledWith('https://oauth2.googleapis.com/revoke', expect.objectContaining({ method: 'POST' }));
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: 'user_1' } });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ template: 'autopost-account-deleted' }));
    // Audit row is written before the user row goes away.
    expect(db.auditLog.create.mock.invocationCallOrder[0]).toBeLessThan(db.user.delete.mock.invocationCallOrder[0]);
    fetchSpy.mockRestore();
  });
});

describe('POST /api/v1/auth/youtube/start', () => {
  it('returns a Google URL for the key holder with the app redirect', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    const { POST } = await import('@/app/api/v1/auth/youtube/start/route');
    const res = await POST(post('/api/v1/auth/youtube/start', { redirectUri: 'autopost://connected', timezone: 'Asia/Almaty' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const url = new URL(body.authorizationUrl);
    expect(url.hostname).toBe('accounts.google.com');
    expect(url.searchParams.get('state')?.startsWith('tfy1.')).toBe(true);
    expect(db.externalUser.upsert).not.toHaveBeenCalled();
  });

  it('rejects foreign app schemes and unknown zones', async () => {
    const { POST } = await import('@/app/api/v1/auth/youtube/start/route');
    expect((await POST(post('/api/v1/auth/youtube/start', { redirectUri: 'evil://x' }))).status).toBe(400);
    expect((await POST(post('/api/v1/auth/youtube/start', { redirectUri: 'autopost://c', timezone: 'Mars/Base' }))).status).toBe(400);
  });
});

describe('PATCH /api/v1/mobile/channels/:id validation', () => {
  it('rejects malformed rules before touching the database', async () => {
    const { PATCH } = await import('@/app/api/v1/mobile/channels/[id]/route');
    const ctx = { params: Promise.resolve({ id: 'UC1' }) };
    const bad = await PATCH(post('/api/v1/mobile/channels/UC1', { rules: { slotTimes: ['25:00'] } }, 'PATCH'), ctx);
    expect(bad.status).toBe(400);
    const extra = await PATCH(post('/api/v1/mobile/channels/UC1', { owner: 'someone' }, 'PATCH'), ctx);
    expect(extra.status).toBe(400);
    expect(db.channel.findFirst).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/mobile/posts input', () => {
  it('rejects an unknown file id and a bad time', async () => {
    const { POST } = await import('@/app/api/v1/mobile/posts/route');
    const noFile = await POST(post('/api/v1/mobile/posts', { channelId: 'UC1', title: 'A', fileId: '../x', publishAt: 'auto' }));
    expect(noFile.status).toBe(400);
    const badTime = await POST(post('/api/v1/mobile/posts', { channelId: 'UC1', title: 'A', fileId: 'A'.repeat(32), publishAt: 'tomorrow' }));
    expect(badTime.status).toBe(400);
    expect(db.uploadJob.findFirst).not.toHaveBeenCalled();
  });

  it('says when the uploaded file is gone', async () => {
    db.uploadJob.findFirst.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/v1/mobile/posts/route');
    const res = await POST(post('/api/v1/mobile/posts', { channelId: 'UC1', title: 'A', fileId: 'A'.repeat(32), publishAt: 'auto' }));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('file_missing');
  });
});
