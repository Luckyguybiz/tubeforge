import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should throw when a required env var is missing (not during build)', async () => {
    // Ensure we're not in build phase
    delete process.env.NEXT_PHASE;
    // Remove all required variables
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_STUDIO;
    delete process.env.NEXT_PUBLIC_APP_URL;

    await expect(
      import('@/lib/env')
    ).rejects.toThrow('[env] Missing required environment variable');
  });

  it('should not throw during build phase even if vars are missing', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_STUDIO;
    delete process.env.NEXT_PUBLIC_APP_URL;

    const { env } = await import('@/lib/env');
    // During build, should return empty strings instead of throwing
    expect(env.AUTH_GOOGLE_ID).toBe('');
    expect(env.DATABASE_URL).toBe('');
  });

  it('should export all required env vars when they are set', async () => {
    process.env.AUTH_GOOGLE_ID = 'test-google-id';
    process.env.AUTH_GOOGLE_SECRET = 'test-google-secret';
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PRICE_PRO = 'price_pro';
    process.env.STRIPE_PRICE_STUDIO = 'price_studio';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const { env } = await import('@/lib/env');

    expect(env.AUTH_GOOGLE_ID).toBe('test-google-id');
    expect(env.AUTH_GOOGLE_SECRET).toBe('test-google-secret');
    expect(env.DATABASE_URL).toBe('postgresql://test');
    expect(env.STRIPE_SECRET_KEY).toBe('sk_test_123');
    expect(env.STRIPE_WEBHOOK_SECRET).toBe('whsec_test');
    expect(env.STRIPE_PRICE_PRO).toBe('price_pro');
    expect(env.STRIPE_PRICE_STUDIO).toBe('price_studio');
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });

  it('should default optional AI keys to empty string', async () => {
    process.env.AUTH_GOOGLE_ID = 'test';
    process.env.AUTH_GOOGLE_SECRET = 'test';
    process.env.DATABASE_URL = 'test';
    process.env.STRIPE_SECRET_KEY = 'test';
    process.env.STRIPE_WEBHOOK_SECRET = 'test';
    process.env.STRIPE_PRICE_PRO = 'test';
    process.env.STRIPE_PRICE_STUDIO = 'test';
    process.env.NEXT_PUBLIC_APP_URL = 'test';
    // Don't set optional vars
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.RUNWAY_API_KEY;

    const { env } = await import('@/lib/env');

    expect(env.OPENAI_API_KEY).toBe('');
    expect(env.ANTHROPIC_API_KEY).toBe('');
    expect(env.RUNWAY_API_KEY).toBe('');
  });

  it('should use provided optional AI keys when set', async () => {
    process.env.AUTH_GOOGLE_ID = 'test';
    process.env.AUTH_GOOGLE_SECRET = 'test';
    process.env.DATABASE_URL = 'test';
    process.env.STRIPE_SECRET_KEY = 'test';
    process.env.STRIPE_WEBHOOK_SECRET = 'test';
    process.env.STRIPE_PRICE_PRO = 'test';
    process.env.STRIPE_PRICE_STUDIO = 'test';
    process.env.NEXT_PUBLIC_APP_URL = 'test';
    process.env.OPENAI_API_KEY = 'sk-openai-test';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.RUNWAY_API_KEY = 'rw-test';

    const { env } = await import('@/lib/env');

    expect(env.OPENAI_API_KEY).toBe('sk-openai-test');
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-test');
    expect(env.RUNWAY_API_KEY).toBe('rw-test');
  });

  it('should include descriptive error message with variable name', async () => {
    delete process.env.NEXT_PHASE;
    delete process.env.DATABASE_URL;
    process.env.AUTH_GOOGLE_ID = 'test';
    process.env.AUTH_GOOGLE_SECRET = 'test';

    await expect(
      import('@/lib/env')
    ).rejects.toThrow('DATABASE_URL');
  });
});
