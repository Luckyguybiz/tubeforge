/**
 * Security headers applied to every response via next.config.ts `headers()`.
 *
 * Each entry follows the Next.js Header object shape:
 *   { key: string; value: string }
 */

export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",  // unsafe-inline: Next.js; wasm-unsafe-eval: FFmpeg WASM; blob: workers
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://lh3.googleusercontent.com https://i.ytimg.com https://yt3.ggpht.com https://oaidalleapiprodscus.blob.core.windows.net https://*.fal.media https://v3.fal.media https://v3b.fal.media https://images.pexels.com",
      "font-src 'self' data:",
      "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://api.openai.com https://api.anthropic.com https://api.runwayml.com https://unpkg.com https://cdn.jsdelivr.net https://*.fal.media https://fal.queue.fal.ai https://queue.fal.run https://api.elevenlabs.io https://api.pexels.com https://js.stripe.com https://noembed.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
];
