// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('feature-flags module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  /* ── Default flags ──────────────────────────────────────────── */

  it('returns default flags when NEXT_PUBLIC_FLAGS is not set', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiVideoGeneration).toBe(true);
    expect(flags.aiThumbnails).toBe(true);
    expect(flags.aiMetadata).toBe(true);
    expect(flags.teamCollaboration).toBe(false);
    expect(flags.advancedAnalytics).toBe(false);
    expect(flags.scheduledPublish).toBe(false);
  });

  it('AI features are on by default', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiVideoGeneration).toBe(true);
    expect(flags.aiThumbnails).toBe(true);
    expect(flags.aiMetadata).toBe(true);
  });

  it('collaboration, analytics, and schedule are off by default', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.teamCollaboration).toBe(false);
    expect(flags.advancedAnalytics).toBe(false);
    expect(flags.scheduledPublish).toBe(false);
  });

  /* ── Environment override ──────────────────────────────────── */

  it('enables only specified flags via NEXT_PUBLIC_FLAGS', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'teamCollaboration,advancedAnalytics';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.teamCollaboration).toBe(true);
    expect(flags.advancedAnalytics).toBe(true);
    // Not listed flags become false (overrides defaults)
    expect(flags.aiVideoGeneration).toBe(false);
    expect(flags.aiThumbnails).toBe(false);
    expect(flags.aiMetadata).toBe(false);
    expect(flags.scheduledPublish).toBe(false);
  });

  it('enables all flags when all are listed', async () => {
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

  it('handles whitespace around comma-separated flag names', async () => {
    process.env.NEXT_PUBLIC_FLAGS = ' aiThumbnails , scheduledPublish ';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiThumbnails).toBe(true);
    expect(flags.scheduledPublish).toBe(true);
    expect(flags.aiVideoGeneration).toBe(false);
  });

  it('ignores unknown flag names in the environment variable', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'aiThumbnails,unknownFlag,anotherFake';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiThumbnails).toBe(true);
    expect(flags.aiVideoGeneration).toBe(false);
    // Unknown flags should not appear at all
    expect((flags as unknown as Record<string, boolean>)['unknownFlag']).toBeUndefined();
  });

  it('treats empty NEXT_PUBLIC_FLAGS string as unset (returns defaults)', async () => {
    process.env.NEXT_PUBLIC_FLAGS = '';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiVideoGeneration).toBe(true);
    expect(flags.aiThumbnails).toBe(true);
    expect(flags.aiMetadata).toBe(true);
    expect(flags.teamCollaboration).toBe(false);
  });

  it('enables a single flag from NEXT_PUBLIC_FLAGS', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'scheduledPublish';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.scheduledPublish).toBe(true);
    expect(flags.aiVideoGeneration).toBe(false);
    expect(flags.teamCollaboration).toBe(false);
  });

  /* ── isFeatureEnabled ──────────────────────────────────────── */

  it('isFeatureEnabled returns true for enabled default flags', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { isFeatureEnabled } = await import('@/lib/feature-flags');

    expect(isFeatureEnabled('aiVideoGeneration')).toBe(true);
    expect(isFeatureEnabled('aiThumbnails')).toBe(true);
    expect(isFeatureEnabled('aiMetadata')).toBe(true);
  });

  it('isFeatureEnabled returns false for disabled default flags', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { isFeatureEnabled } = await import('@/lib/feature-flags');

    expect(isFeatureEnabled('teamCollaboration')).toBe(false);
    expect(isFeatureEnabled('advancedAnalytics')).toBe(false);
    expect(isFeatureEnabled('scheduledPublish')).toBe(false);
  });

  it('isFeatureEnabled returns false for unknown/invalid flag keys', async () => {
    delete process.env.NEXT_PUBLIC_FLAGS;

    const { isFeatureEnabled } = await import('@/lib/feature-flags');

    expect(isFeatureEnabled('nonExistent')).toBe(false);
    expect(isFeatureEnabled('')).toBe(false);
    expect(isFeatureEnabled('randomKey123')).toBe(false);
  });

  it('isFeatureEnabled reflects env overrides', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'teamCollaboration';

    const { isFeatureEnabled } = await import('@/lib/feature-flags');

    expect(isFeatureEnabled('teamCollaboration')).toBe(true);
    expect(isFeatureEnabled('aiVideoGeneration')).toBe(false);
  });

  it('handles trailing commas in NEXT_PUBLIC_FLAGS gracefully', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'aiThumbnails,';

    const { flags } = await import('@/lib/feature-flags');

    expect(flags.aiThumbnails).toBe(true);
    expect(flags.aiVideoGeneration).toBe(false);
  });
});
