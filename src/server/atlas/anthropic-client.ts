/**
 * Atlas — singleton Anthropic SDK client.
 *
 * Lazy-init to avoid throwing at module-load time when ANTHROPIC_API_KEY
 * is absent (e.g. in build / migration runs). First chat request will
 * instantiate and reuse for subsequent calls.
 *
 * Default model is read from env so we can A/B test sonnet vs haiku
 * vs opus without redeploying code.
 */

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export class AtlasConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AtlasConfigError';
  }
}

export function getAnthropicClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AtlasConfigError(
      'ANTHROPIC_API_KEY is not configured — set it in .env to enable Atlas.',
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

export const ATLAS_MODEL = process.env.ATLAS_MODEL || 'claude-sonnet-4-5-20250929';

/**
 * Daily token budget by user plan. Resets at UTC midnight via the
 * AtlasUsageDaily compound-key uniqueness on (userId, date).
 */
export const ATLAS_LIMITS = {
  FREE:   { messagesPerHour:  5, tokensPerDay:    50_000 },
  PRO:    { messagesPerHour: 20, tokensPerDay:   200_000 },
  STUDIO: { messagesPerHour: 50, tokensPerDay: 1_000_000 },
} as const;

export type AtlasPlan = keyof typeof ATLAS_LIMITS;

/** Resolve plan limits with FREE fallback for unknown / future plans. */
export function getLimitsForPlan(plan: string | undefined | null) {
  if (plan && plan in ATLAS_LIMITS) {
    return ATLAS_LIMITS[plan as AtlasPlan];
  }
  return ATLAS_LIMITS.FREE;
}
