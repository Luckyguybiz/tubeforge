/**
 * Tests for AI router limit logic.
 * Tests the pure limit checking functions replicated from ai.ts.
 */
import { describe, it, expect } from 'vitest';

// Replicated from ai.ts
const AI_LIMITS: Record<string, number> = { FREE: 5, PRO: 100, STUDIO: Infinity };

function checkAILimitLogic(plan: string, aiUsage: number, aiResetAt: Date): {
  allowed: boolean;
  shouldReset: boolean;
  limit: number;
} {
  const now = new Date();
  const resetAt = new Date(aiResetAt);
  const shouldReset =
    now.getMonth() !== resetAt.getMonth() ||
    now.getFullYear() !== resetAt.getFullYear();

  if (shouldReset) {
    return { allowed: true, shouldReset: true, limit: AI_LIMITS[plan] ?? AI_LIMITS.FREE };
  }

  const limit = AI_LIMITS[plan] ?? AI_LIMITS.FREE;
  return { allowed: aiUsage < limit, shouldReset: false, limit };
}

describe('AI limits', () => {
  describe('AI_LIMITS map', () => {
    it('should have correct FREE limit', () => {
      expect(AI_LIMITS.FREE).toBe(5);
    });

    it('should have correct PRO limit', () => {
      expect(AI_LIMITS.PRO).toBe(100);
    });

    it('should have unlimited STUDIO', () => {
      expect(AI_LIMITS.STUDIO).toBe(Infinity);
    });
  });

  describe('checkAILimitLogic', () => {
    const now = new Date();

    it('should allow usage when under limit', () => {
      const result = checkAILimitLogic('FREE', 3, now);
      expect(result.allowed).toBe(true);
      expect(result.shouldReset).toBe(false);
    });

    it('should deny usage when at limit', () => {
      const result = checkAILimitLogic('FREE', 5, now);
      expect(result.allowed).toBe(false);
    });

    it('should deny usage when over limit', () => {
      const result = checkAILimitLogic('FREE', 10, now);
      expect(result.allowed).toBe(false);
    });

    it('should allow and reset when month changed', () => {
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const result = checkAILimitLogic('FREE', 5, lastMonth);
      expect(result.allowed).toBe(true);
      expect(result.shouldReset).toBe(true);
    });

    it('should allow and reset when year changed', () => {
      const lastYear = new Date(now);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const result = checkAILimitLogic('FREE', 999, lastYear);
      expect(result.allowed).toBe(true);
      expect(result.shouldReset).toBe(true);
    });

    it('should respect PRO plan limits', () => {
      const result = checkAILimitLogic('PRO', 99, now);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
    });

    it('should deny PRO at limit', () => {
      const result = checkAILimitLogic('PRO', 100, now);
      expect(result.allowed).toBe(false);
    });

    it('should always allow STUDIO', () => {
      const result = checkAILimitLogic('STUDIO', 999999, now);
      expect(result.allowed).toBe(true);
    });

    it('should fallback to FREE for unknown plan', () => {
      const result = checkAILimitLogic('UNKNOWN', 4, now);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
    });

    it('should deny unknown plan at FREE limit', () => {
      const result = checkAILimitLogic('UNKNOWN', 5, now);
      expect(result.allowed).toBe(false);
    });
  });
});
