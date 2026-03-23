// @vitest-environment node
/**
 * Tests for webhook delivery logic replicated from src/server/routers/webhook.ts.
 *
 * Covers:
 *  - Delivery to active endpoints matching event type
 *  - HMAC payload signing
 *  - Timeout handling
 *  - Skipping inactive endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

/* ── Mock modules ──────────────────────────────────────────────── */

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

/* ── Replicate webhook delivery logic ─────────────────────────── */

const DELIVERY_TIMEOUT_MS = 5_000;
const MAX_RETRIES = 1;

type WebhookEvent = 'video.completed' | 'project.created';

function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

const mockFetch = vi.fn();

async function deliverToEndpoint(
  url: string,
  secret: string,
  event: string,
  body: string,
): Promise<boolean> {
  const signature = signPayload(secret, body);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-TubeForge-Event': event,
    'X-TubeForge-Signature': `sha256=${signature}`,
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await mockFetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (res.ok) {
        return true;
      }
    } catch {
      // retry
    }
  }

  return false;
}

interface Endpoint {
  id: string;
  url: string;
  secret: string;
  active: boolean;
  events: WebhookEvent[];
}

interface MockDbForWebhooks {
  webhookEndpoint: {
    findMany: ReturnType<typeof vi.fn> & ((...args: unknown[]) => Promise<{ id: string; url: string; secret: string }[]>);
  };
}

async function deliverWebhooksAsync(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
  db: MockDbForWebhooks,
): Promise<{ total: number; succeeded: number; failed: number }> {
  const endpoints = await db.webhookEndpoint.findMany({
    where: { userId, active: true, events: { has: event } },
    select: { id: true, url: true, secret: true },
  });

  if (endpoints.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const results = await Promise.allSettled(
    endpoints.map(async (ep: { id: string; url: string; secret: string }) => {
      const ok = await deliverToEndpoint(ep.url, ep.secret, event, body);
      return { endpointId: ep.id, ok };
    }),
  );

  const succeeded = results.filter(
    (r): r is PromiseFulfilledResult<{ endpointId: string; ok: boolean }> => r.status === 'fulfilled' && r.value.ok,
  ).length;

  return {
    total: endpoints.length,
    succeeded,
    failed: endpoints.length - succeeded,
  };
}

/* ── Helpers ───────────────────────────────────────────────────── */

function makeDb(endpoints: Partial<Endpoint>[] = []): MockDbForWebhooks {
  return {
    webhookEndpoint: {
      findMany: vi.fn().mockResolvedValue(
        endpoints.map((ep) => ({
          id: ep.id ?? 'ep-1',
          url: ep.url ?? 'https://example.com/webhook',
          secret: ep.secret ?? 'whsec_testsecret123',
        })),
      ),
    },
  };
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('webhook delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  it('delivers to active endpoints matching event type', async () => {
    const db = makeDb([
      { id: 'ep-1', url: 'https://hooks.example.com/a', secret: 'secret_a', active: true, events: ['video.completed'] },
      { id: 'ep-2', url: 'https://hooks.example.com/b', secret: 'secret_b', active: true, events: ['video.completed'] },
    ]);

    const result = await deliverWebhooksAsync('user-1', 'video.completed', { videoId: 'v123' }, db);

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);

    // Verify fetch was called for each endpoint
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.example.com/a',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-TubeForge-Event': 'video.completed',
        }),
      }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.example.com/b',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('signs payload with HMAC', async () => {
    const secret = 'whsec_mysupersecret';
    const payload = '{"event":"video.completed","data":{"id":"v1"}}';

    const signature = signPayload(secret, payload);

    // Verify it produces a valid hex HMAC-SHA256
    expect(signature).toMatch(/^[a-f0-9]{64}$/);

    // Verify deterministic: same inputs → same output
    const signature2 = signPayload(secret, payload);
    expect(signature).toBe(signature2);

    // Verify different secret → different signature
    const signature3 = signPayload('other_secret', payload);
    expect(signature3).not.toBe(signature);

    // Verify the signature is actually correct HMAC-SHA256
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    expect(signature).toBe(expected);
  });

  it('includes signature in delivery headers', async () => {
    const secret = 'whsec_test';
    const db = makeDb([{ id: 'ep-1', url: 'https://hooks.example.com/hook', secret }]);

    await deliverWebhooksAsync('user-1', 'video.completed', { id: 'v1' }, db);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.example.com/hook',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-TubeForge-Signature': expect.stringMatching(/^sha256=[a-f0-9]{64}$/),
        }),
      }),
    );
  });

  it('handles timeout gracefully', async () => {
    // Simulate fetch throwing a timeout error on both attempts
    mockFetch.mockRejectedValue(new Error('The operation was aborted due to timeout'));

    const db = makeDb([{ id: 'ep-timeout', url: 'https://slow.example.com/hook', secret: 'secret' }]);

    const result = await deliverWebhooksAsync('user-1', 'video.completed', { id: 'v1' }, db);

    expect(result.total).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);

    // Should have retried once (2 total attempts: initial + 1 retry)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries once on non-OK response then fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const db = makeDb([{ id: 'ep-fail', url: 'https://failing.example.com/hook', secret: 'secret' }]);

    const result = await deliverWebhooksAsync('user-1', 'project.created', { projectId: 'p1' }, db);

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    // initial + 1 retry
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('skips inactive endpoints', async () => {
    // The db query filters for active: true, so inactive endpoints
    // should never be returned by findMany
    const db: MockDbForWebhooks = {
      webhookEndpoint: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await deliverWebhooksAsync('user-1', 'video.completed', { id: 'v1' }, db);

    expect(result.total).toBe(0);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(0);

    // Verify the query filters by active: true
    expect(db.webhookEndpoint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          active: true,
          events: { has: 'video.completed' },
        }),
      }),
    );

    // No fetch calls should be made
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns zero counts when no endpoints exist', async () => {
    const db = makeDb([]);

    const result = await deliverWebhooksAsync('user-1', 'video.completed', { id: 'v1' }, db);

    expect(result).toEqual({ total: 0, succeeded: 0, failed: 0 });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles mix of successful and failed deliveries', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 })   // ep-1 success
      .mockResolvedValueOnce({ ok: false, status: 500 })   // ep-2 attempt 1
      .mockResolvedValueOnce({ ok: false, status: 500 });  // ep-2 retry

    const db = makeDb([
      { id: 'ep-1', url: 'https://good.example.com/hook', secret: 'secret1' },
      { id: 'ep-2', url: 'https://bad.example.com/hook', secret: 'secret2' },
    ]);

    const result = await deliverWebhooksAsync('user-1', 'video.completed', { id: 'v1' }, db);

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
  });

  it('includes event and timestamp in delivery body', async () => {
    const db = makeDb([{ id: 'ep-1', url: 'https://hooks.example.com/hook', secret: 'secret' }]);

    await deliverWebhooksAsync('user-1', 'project.created', { projectId: 'p42' }, db);

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body);

    expect(body.event).toBe('project.created');
    expect(body.timestamp).toBeDefined();
    expect(body.data).toEqual({ projectId: 'p42' });
  });

  it('queries with correct userId filter', async () => {
    const db = makeDb([]);

    await deliverWebhooksAsync('user-special-42', 'video.completed', {}, db);

    expect(db.webhookEndpoint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-special-42',
        }),
      }),
    );
  });
});
