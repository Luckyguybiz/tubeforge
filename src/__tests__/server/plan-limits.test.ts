// @vitest-environment node
/**
 * N5 — Plan limits tests.
 *
 * Comprehensive plan limit testing across all features:
 *   - FREE: 4th project creation -> FORBIDDEN (limit 3)
 *   - FREE: 6th AI generation -> FORBIDDEN (limit 5)
 *   - PRO: 26th project -> FORBIDDEN (limit 25)
 *   - STUDIO: unlimited -> OK
 *   - Monthly reset clears AI usage
 *   - Asset limits per plan
 */
import { describe, it, expect } from 'vitest';

/* ── Replicated plan limit constants ──────────────────────────── */

const PROJECT_LIMITS: Record<string, number> = {
  FREE: 3,
  PRO: 25,
  STUDIO: Infinity,
};

const AI_LIMITS: Record<string, number> = {
  FREE: 5,
  PRO: 100,
  STUDIO: Infinity,
};

const ASSET_LIMITS: Record<string, number | undefined> = {
  FREE: 50,
  PRO: 500,
  // STUDIO is unlimited (no entry needed)
};

/* ── Plan limit check functions ───────────────────────────────── */

function checkProjectLimit(plan: string, currentCount: number): {
  allowed: boolean;
  limit: number;
} {
  const limit = PROJECT_LIMITS[plan] ?? PROJECT_LIMITS.FREE;
  return { allowed: currentCount < limit, limit };
}

function checkAILimit(plan: string, aiUsage: number, aiResetAt: Date): {
  allowed: boolean;
  shouldReset: boolean;
  limit: number;
  remaining: number;
} {
  const now = new Date();
  const resetAt = new Date(aiResetAt);
  const shouldReset =
    now.getMonth() !== resetAt.getMonth() ||
    now.getFullYear() !== resetAt.getFullYear();

  const limit = AI_LIMITS[plan] ?? AI_LIMITS.FREE;

  if (shouldReset) {
    return { allowed: true, shouldReset: true, limit, remaining: limit };
  }

  const allowed = aiUsage < limit;
  return {
    allowed,
    shouldReset: false,
    limit,
    remaining: allowed ? limit - aiUsage : 0,
  };
}

function checkAssetLimit(plan: string, currentCount: number): {
  allowed: boolean;
  limit: number | undefined;
} {
  const limit = ASSET_LIMITS[plan];
  if (limit === undefined) return { allowed: true, limit: undefined }; // unlimited
  return { allowed: currentCount < limit, limit };
}

/* ── Tests ─────────────────────────────────────────────────── */

describe('Plan limits', () => {
  const now = new Date();

  /* ── Project limits ────────────────────────────────────── */

  describe('Project limits', () => {
    describe('FREE plan (limit: 3)', () => {
      it('allows 1st project (0 existing)', () => {
        expect(checkProjectLimit('FREE', 0).allowed).toBe(true);
      });

      it('allows 2nd project (1 existing)', () => {
        expect(checkProjectLimit('FREE', 1).allowed).toBe(true);
      });

      it('allows 3rd project (2 existing)', () => {
        expect(checkProjectLimit('FREE', 2).allowed).toBe(true);
      });

      it('blocks 4th project (3 existing)', () => {
        const result = checkProjectLimit('FREE', 3);
        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(3);
      });

      it('blocks at 10 existing projects', () => {
        expect(checkProjectLimit('FREE', 10).allowed).toBe(false);
      });
    });

    describe('PRO plan (limit: 25)', () => {
      it('allows up to 25th project (24 existing)', () => {
        expect(checkProjectLimit('PRO', 24).allowed).toBe(true);
      });

      it('blocks 26th project (25 existing)', () => {
        const result = checkProjectLimit('PRO', 25);
        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(25);
      });

      it('allows 1st project', () => {
        expect(checkProjectLimit('PRO', 0).allowed).toBe(true);
      });
    });

    describe('STUDIO plan (unlimited)', () => {
      it('allows any number of projects', () => {
        expect(checkProjectLimit('STUDIO', 0).allowed).toBe(true);
        expect(checkProjectLimit('STUDIO', 100).allowed).toBe(true);
        expect(checkProjectLimit('STUDIO', 9999).allowed).toBe(true);
      });

      it('limit is Infinity', () => {
        expect(checkProjectLimit('STUDIO', 0).limit).toBe(Infinity);
      });
    });

    describe('Unknown plan (defaults to FREE)', () => {
      it('defaults to FREE limit for undefined plan', () => {
        expect(checkProjectLimit('UNKNOWN', 3).allowed).toBe(false);
        expect(checkProjectLimit('UNKNOWN', 2).allowed).toBe(true);
      });
    });
  });

  /* ── AI limits ─────────────────────────────────────────── */

  describe('AI generation limits', () => {
    describe('FREE plan (limit: 5)', () => {
      it('allows 1st generation', () => {
        expect(checkAILimit('FREE', 0, now).allowed).toBe(true);
        expect(checkAILimit('FREE', 0, now).remaining).toBe(5);
      });

      it('allows 5th generation (4 used)', () => {
        expect(checkAILimit('FREE', 4, now).allowed).toBe(true);
        expect(checkAILimit('FREE', 4, now).remaining).toBe(1);
      });

      it('blocks 6th generation (5 used)', () => {
        const result = checkAILimit('FREE', 5, now);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
      });

      it('blocks at 10 used', () => {
        expect(checkAILimit('FREE', 10, now).allowed).toBe(false);
      });
    });

    describe('PRO plan (limit: 100)', () => {
      it('allows up to 100th generation (99 used)', () => {
        expect(checkAILimit('PRO', 99, now).allowed).toBe(true);
        expect(checkAILimit('PRO', 99, now).remaining).toBe(1);
      });

      it('blocks 101st generation (100 used)', () => {
        expect(checkAILimit('PRO', 100, now).allowed).toBe(false);
      });
    });

    describe('STUDIO plan (unlimited)', () => {
      it('allows any number of generations', () => {
        expect(checkAILimit('STUDIO', 999999, now).allowed).toBe(true);
      });
    });

    describe('Monthly reset', () => {
      it('clears AI usage when month changes', () => {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const result = checkAILimit('FREE', 999, lastMonth);
        expect(result.allowed).toBe(true);
        expect(result.shouldReset).toBe(true);
        expect(result.remaining).toBe(5);
      });

      it('clears AI usage when year changes', () => {
        const lastYear = new Date(now);
        lastYear.setFullYear(lastYear.getFullYear() - 1);

        const result = checkAILimit('FREE', 999, lastYear);
        expect(result.allowed).toBe(true);
        expect(result.shouldReset).toBe(true);
      });

      it('does not reset within the same month', () => {
        const sameMonth = new Date(now);
        sameMonth.setDate(1); // first of same month

        const result = checkAILimit('FREE', 5, sameMonth);
        expect(result.shouldReset).toBe(false);
        expect(result.allowed).toBe(false);
      });

      it('resets PRO user to full 100 limit', () => {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const result = checkAILimit('PRO', 100, lastMonth);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(100);
      });

      it('resets STUDIO to Infinity', () => {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const result = checkAILimit('STUDIO', 999, lastMonth);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(Infinity);
      });
    });
  });

  /* ── Asset limits ──────────────────────────────────────── */

  describe('Asset limits', () => {
    describe('FREE plan (limit: 50)', () => {
      it('allows under 50 assets', () => {
        expect(checkAssetLimit('FREE', 49).allowed).toBe(true);
      });

      it('blocks at 50 assets', () => {
        expect(checkAssetLimit('FREE', 50).allowed).toBe(false);
      });

      it('limit is 50', () => {
        expect(checkAssetLimit('FREE', 0).limit).toBe(50);
      });
    });

    describe('PRO plan (limit: 500)', () => {
      it('allows under 500 assets', () => {
        expect(checkAssetLimit('PRO', 499).allowed).toBe(true);
      });

      it('blocks at 500 assets', () => {
        expect(checkAssetLimit('PRO', 500).allowed).toBe(false);
      });
    });

    describe('STUDIO plan (unlimited)', () => {
      it('allows any number of assets', () => {
        const result = checkAssetLimit('STUDIO', 99999);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBeUndefined(); // unlimited
      });
    });
  });

  /* ── Cross-cutting limit constants ─────────────────────── */

  describe('Limit constants integrity', () => {
    it('PROJECT_LIMITS: FREE=3, PRO=25, STUDIO=Infinity', () => {
      expect(PROJECT_LIMITS).toEqual({ FREE: 3, PRO: 25, STUDIO: Infinity });
    });

    it('AI_LIMITS: FREE=5, PRO=100, STUDIO=Infinity', () => {
      expect(AI_LIMITS).toEqual({ FREE: 5, PRO: 100, STUDIO: Infinity });
    });

    it('ASSET_LIMITS: FREE=50, PRO=500, STUDIO=undefined', () => {
      expect(ASSET_LIMITS.FREE).toBe(50);
      expect(ASSET_LIMITS.PRO).toBe(500);
      expect(ASSET_LIMITS.STUDIO).toBeUndefined();
    });

    it('all plans have both project and AI limits defined', () => {
      for (const plan of ['FREE', 'PRO', 'STUDIO']) {
        expect(PROJECT_LIMITS[plan]).toBeDefined();
        expect(AI_LIMITS[plan]).toBeDefined();
      }
    });

    it('limits are strictly increasing: FREE < PRO < STUDIO', () => {
      expect(PROJECT_LIMITS.FREE).toBeLessThan(PROJECT_LIMITS.PRO);
      expect(PROJECT_LIMITS.PRO).toBeLessThan(PROJECT_LIMITS.STUDIO);
      expect(AI_LIMITS.FREE).toBeLessThan(AI_LIMITS.PRO);
      expect(AI_LIMITS.PRO).toBeLessThan(AI_LIMITS.STUDIO);
    });
  });
});
