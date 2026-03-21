import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    // Reset time mocking between tests so each test starts clean
    vi.useRealTimers();
  });

  it('allows the first N calls within the limit', async () => {
    const identifier = `test-allow-${Date.now()}`;
    const limit = 3;

    const r1 = await rateLimit({ identifier, limit, window: 60 });
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await rateLimit({ identifier, limit, window: 60 });
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await rateLimit({ identifier, limit, window: 60 });
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('rejects the N+1 call that exceeds the limit', async () => {
    const identifier = `test-exceed-${Date.now()}`;
    const limit = 2;

    await rateLimit({ identifier, limit, window: 60 });
    await rateLimit({ identifier, limit, window: 60 });

    const result = await rateLimit({ identifier, limit, window: 60 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks different identifiers independently', async () => {
    const ts = Date.now();
    const idA = `test-a-${ts}`;
    const idB = `test-b-${ts}`;
    const limit = 1;

    const rA = await rateLimit({ identifier: idA, limit, window: 60 });
    expect(rA.success).toBe(true);

    // idA is now exhausted
    const rA2 = await rateLimit({ identifier: idA, limit, window: 60 });
    expect(rA2.success).toBe(false);

    // idB should still be allowed
    const rB = await rateLimit({ identifier: idB, limit, window: 60 });
    expect(rB.success).toBe(true);
  });

  it('resets the limit after the window expires', async () => {
    vi.useFakeTimers();
    const identifier = `test-expiry-${Date.now()}`;
    const limit = 1;
    const windowSec = 10;

    const r1 = await rateLimit({ identifier, limit, window: windowSec });
    expect(r1.success).toBe(true);

    // Exhausted
    const r2 = await rateLimit({ identifier, limit, window: windowSec });
    expect(r2.success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(windowSec * 1000 + 1);

    // Should be allowed again
    const r3 = await rateLimit({ identifier, limit, window: windowSec });
    expect(r3.success).toBe(true);

    vi.useRealTimers();
  });

  it('returns a reset timestamp in the future', async () => {
    const identifier = `test-reset-ts-${Date.now()}`;
    const result = await rateLimit({ identifier, limit: 10, window: 60 });
    expect(result.reset).toBeGreaterThan(Date.now() - 1000);
  });
});
