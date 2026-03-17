/**
 * Runtime validation for required environment variables.
 *
 * Import this module early (e.g., in `instrumentation.ts` or the tRPC context
 * factory) so that the app fails fast on startup when critical env vars are
 * missing, instead of crashing later at the point of first use.
 *
 * During `next build`, env vars may not be fully available, so validation
 * is deferred to runtime.
 */

/** True during `next build` — env vars may be missing during static analysis */
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // During build, skip validation — vars will be checked at runtime
    if (isBuildPhase) return '';
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
      'Check your .env file or deployment configuration.'
    );
  }
  return value;
}

/** Validated server-only environment variables. */
export const env = {
  // Auth
  AUTH_GOOGLE_ID: requireEnv('AUTH_GOOGLE_ID'),
  AUTH_GOOGLE_SECRET: requireEnv('AUTH_GOOGLE_SECRET'),

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Stripe
  STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: requireEnv('STRIPE_WEBHOOK_SECRET'),
  STRIPE_PRICE_PRO: requireEnv('STRIPE_PRICE_PRO'),
  STRIPE_PRICE_STUDIO: requireEnv('STRIPE_PRICE_STUDIO'),

  // App URL
  NEXT_PUBLIC_APP_URL: requireEnv('NEXT_PUBLIC_APP_URL'),

  // Optional (AI/video APIs — gracefully degrade if not set)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  RUNWAY_API_KEY: process.env.RUNWAY_API_KEY ?? '',
} as const;
