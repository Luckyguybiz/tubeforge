import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('feature-flags module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return default flags when NEXT_PUBLIC_FLAGS is not set', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiVideoGeneration).toBe(true);
    expect(flags.aiThumbnails).toBe(true);
    expect(flags.aiMetadata).toBe(true);
    expect(flags.teamCollaboration).toBe(false);
    expect(flags.advancedAnalytics).toBe(false);
    expect(flags.scheduledPublish).toBe(false);
  });

  it('should enable only specified flags when NEXT_PUBLIC_FLAGS is set', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'teamCollaboration,advancedAnalytics';

    const { flags } = await import('@/lib/feature-flags');

    // Only specified flags should be true
    expect(flags.teamCollaboration).toBe(true);
    expect(flags.advancedAnalytics).toBe(true);
    // Others should be false (overrides defaults!)
    expect(flags.aiVideoGeneration).toBe(false);
    expect(flags.aiThumbnails).toBe(false);
    expect(flags.aiMetadata).toBe(false);
    expect(flags.scheduledPublish).toBe(false);
  });

  it('should handle whitespace around flag names', async () => {
    process.env.NEXT_PUBLIC_FLAGS = ' aiThumbnails , scheduledPublish ';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiThumbnails).toBe(true);
    expect(flags.scheduledPublish).toBe(true);
    expect(flags.aiVideoGeneration).toBe(false);
  });

  it('should ignore unknown flag names', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'aiThumbnails,unknownFlag,anotherFake';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiThumbnails).toBe(true);
    // All other known flags should be false
    expect(flags.aiVideoGeneration).toBe(false);
  });

  it('should treat empty NEXT_PUBLIC_FLAGS as unset (return defaults)', async () => {
    process.env.NEXT_PUBLIC_FLAGS = '';

    const { flags } = await import('@/lib/feature-flags');

    // Empty string is falsy, so loadFlags() returns defaults
    expect(flags.aiVideoGeneration).toBe(true);
    expect(flags.aiThumbnails).toBe(true);
    expect(flags.aiMetadata).toBe(true);
    expect(flags.teamCollaboration).toBe(false);
  });

  it('isFeatureEnabled should return true for enabled flags', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { isFeatureEnabled } = await import('@/lib/feature-flags');

    expect(isFeatureEnabled('aiVideoGeneration')).toBe(true);
    expect(isFeatureEnabled('aiThumbnails')).toBe(true);
  });

  it('isFeatureEnabled should return false for disabled flags', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { isFeatureEnabled } = await import('@/lib/feature-flags');

    expect(isFeatureEnabled('teamCollaboration')).toBe(false);
    expect(isFeatureEnabled('scheduledPublish')).toBe(false);
  });

  it('isFeatureEnabled should return false for unknown flags', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { isFeatureEnabled } = await import('@/lib/feature-flags');

    expect(isFeatureEnabled('nonExistent')).toBe(false);
    expect(isFeatureEnabled('')).toBe(false);
  });

  it('should enable all flags when all are listed', async () => {
    process.env.NEXT_PUBLIC_FLAGS =
      'aiVideoGeneration,aiThumbnails,aiMetadata,teamCollaboration,advancedAnalytics,scheduledPublish';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiVideoGeneration).toBe(true);
    expect(flags.aiThumbnails).toBe(true);
    expect(flags.aiMetadata).toBe(true);
    expect(flags.teamCollaboration).toBe(true);
    expect(flags.advancedAnalytics).toBe(true);
    expect(flags.scheduledPublish).toBe(true);
  });
});
