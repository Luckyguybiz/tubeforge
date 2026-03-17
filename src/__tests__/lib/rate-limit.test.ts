import { describe, it, expect, vi, afterEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('should allow requests within limit', async () => {
    const result = await rateLimit({ identifier: 'test-user-1', limit: 5, window: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should block requests exceeding limit', async () => {
    const id = 'test-user-block-' + Date.now();
    for (let i = 0; i < 3; i++) {
      await rateLimit({ identifier: id, limit: 3, window: 60 });
    }
    const result = await rateLimit({ identifier: id, limit: 3, window: 60 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should track remaining count correctly', async () => {
    const id = 'test-user-remaining-' + Date.now();
    const r1 = await rateLimit({ identifier: id, limit: 3, window: 60 });
    expect(r1.remaining).toBe(2);
    const r2 = await rateLimit({ identifier: id, limit: 3, window: 60 });
    expect(r2.remaining).toBe(1);
    const r3 = await rateLimit({ identifier: id, limit: 3, window: 60 });
    expect(r3.remaining).toBe(0);
  });

  it('should isolate different identifiers', async () => {
    const idA = 'test-isolated-a-' + Date.now();
    const idB = 'test-isolated-b-' + Date.now();
    // Exhaust A
    for (let i = 0; i < 2; i++) await rateLimit({ identifier: idA, limit: 2, window: 60 });
    const rA = await rateLimit({ identifier: idA, limit: 2, window: 60 });
    expect(rA.success).toBe(false);
    // B should still work
    const rB = await rateLimit({ identifier: idB, limit: 2, window: 60 });
    expect(rB.success).toBe(true);
  });

  it('should return reset timestamp in the future', async () => {
    const id = 'test-reset-' + Date.now();
    const result = await rateLimit({ identifier: id, limit: 5, window: 60 });
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it('should use default limit and window if not specified', async () => {
    const id = 'test-defaults-' + Date.now();
    const result = await rateLimit({ identifier: id });
    expect(result.success).toBe(true);
    // Default limit is 10, so remaining should be 9
    expect(result.remaining).toBe(9);
  });

  it('should reset after window expires', async () => {
    vi.useFakeTimers();
    const id = 'test-window-expire-' + Math.random();
    // Use up all tokens
    for (let i = 0; i < 2; i++) await rateLimit({ identifier: id, limit: 2, window: 1 });
    const blocked = await rateLimit({ identifier: id, limit: 2, window: 1 });
    expect(blocked.success).toBe(false);
    // Advance past window
    vi.advanceTimersByTime(1100);
    const allowed = await rateLimit({ identifier: id, limit: 2, window: 1 });
    expect(allowed.success).toBe(true);
    expect(allowed.remaining).toBe(1);
    vi.useRealTimers();
  });
});
