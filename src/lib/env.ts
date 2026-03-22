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

const isDev = process.env.NODE_ENV === 'development';

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

/** Like requireEnv but returns empty string in dev if missing */
function optionalInDev(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (isBuildPhase || isDev) return '';
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
  AUTH_SECRET: requireEnv('AUTH_SECRET'),
  AUTH_GOOGLE_ID: requireEnv('AUTH_GOOGLE_ID'),
  AUTH_GOOGLE_SECRET: requireEnv('AUTH_GOOGLE_SECRET'),

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Stripe
  STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: optionalInDev('STRIPE_WEBHOOK_SECRET'),
  STRIPE_PRICE_PRO: optionalInDev('STRIPE_PRICE_PRO'),
  STRIPE_PRICE_STUDIO: optionalInDev('STRIPE_PRICE_STUDIO'),

  // App URL
  NEXT_PUBLIC_APP_URL: requireEnv('NEXT_PUBLIC_APP_URL'),

  // Optional (AI/video APIs — gracefully degrade if not set)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  RUNWAY_API_KEY: process.env.RUNWAY_API_KEY ?? '',

  // YouTube / download APIs
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ?? '',
  YT_DLP_API_URL: process.env.YT_DLP_API_URL ?? '',
  COBALT_API_URL: process.env.COBALT_API_URL ?? '',
  COBALT_API_KEY: process.env.COBALT_API_KEY ?? '',

  // Email / SMTP
  SMTP_URL: process.env.SMTP_URL ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? '',

  // Email (Resend)
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',

  // VPN / WireGuard
  VPN_ENCRYPTION_KEY: process.env.VPN_ENCRYPTION_KEY ?? '',
  VPN_SERVER_PUBLIC_KEY: process.env.VPN_SERVER_PUBLIC_KEY ?? '',
  VPN_SERVER_ENDPOINT: process.env.VPN_SERVER_ENDPOINT ?? '57.128.254.111:51820',

  // ElevenLabs (voice cloning — optional)
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ?? '',

  // fal.ai (Flux image generation — optional, falls back to DALL-E)
  FAL_KEY: process.env.FAL_KEY ?? '',

  // Error monitoring (Sentry) — disabled when not set
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
} as const;
