import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, getPlanLimits } from '@/lib/constants';

describe('PLAN_LIMITS', () => {
  it('defines all three plans: FREE, PRO, and STUDIO', () => {
    expect(PLAN_LIMITS).toHaveProperty('FREE');
    expect(PLAN_LIMITS).toHaveProperty('PRO');
    expect(PLAN_LIMITS).toHaveProperty('STUDIO');

    // Each plan has the expected shape
    for (const plan of ['FREE', 'PRO', 'STUDIO'] as const) {
      expect(PLAN_LIMITS[plan]).toHaveProperty('projects');
      expect(PLAN_LIMITS[plan]).toHaveProperty('aiGenerations');
      expect(PLAN_LIMITS[plan]).toHaveProperty('scenes');
      expect(PLAN_LIMITS[plan]).toHaveProperty('storageMB');
      expect(PLAN_LIMITS[plan]).toHaveProperty('storageBytes');
    }
  });

  it('ensures STUDIO > PRO > FREE for all comparable limits', () => {
    const free = PLAN_LIMITS.FREE;
    const pro = PLAN_LIMITS.PRO;
    const studio = PLAN_LIMITS.STUDIO;

    // projects
    expect(pro.projects).toBeGreaterThan(free.projects);
    expect(studio.projects).toBeGreaterThan(pro.projects);

    // aiGenerations
    expect(pro.aiGenerations).toBeGreaterThan(free.aiGenerations);
    expect(studio.aiGenerations).toBeGreaterThan(pro.aiGenerations);

    // scenes
    expect(pro.scenes).toBeGreaterThan(free.scenes);
    expect(studio.scenes).toBeGreaterThan(pro.scenes);

    // storageMB
    expect(pro.storageMB).toBeGreaterThan(free.storageMB);
    expect(studio.storageMB).toBeGreaterThan(pro.storageMB);

    // storageBytes
    expect(pro.storageBytes).toBeGreaterThan(free.storageBytes);
    expect(studio.storageBytes).toBeGreaterThan(pro.storageBytes);
  });
});

describe('getPlanLimits', () => {
  it('returns the correct plan limits for known plan names', () => {
    expect(getPlanLimits('FREE')).toBe(PLAN_LIMITS.FREE);
    expect(getPlanLimits('PRO')).toBe(PLAN_LIMITS.PRO);
    expect(getPlanLimits('STUDIO')).toBe(PLAN_LIMITS.STUDIO);
  });

  it('falls back to FREE for unknown plan names', () => {
    expect(getPlanLimits('UNKNOWN')).toBe(PLAN_LIMITS.FREE);
    expect(getPlanLimits('')).toBe(PLAN_LIMITS.FREE);
    expect(getPlanLimits('enterprise')).toBe(PLAN_LIMITS.FREE);
  });
});
