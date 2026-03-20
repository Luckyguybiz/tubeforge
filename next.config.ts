import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import { securityHeaders } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Capacitor iOS builds: uncomment the line below to produce a static export
  // in the `out/` directory. Do NOT enable this for Vercel deployments.
  // output: 'export',

  /* ── Security headers ─────────────────────────────────────────── */
  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Note: COEP/COOP removed — single-threaded FFmpeg WASM does not require
      // SharedArrayBuffer, and require-corp blocks CDN fetches for the WASM core.
    ];
  },

  /* ── Image optimisation ───────────────────────────────────────── */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'oaidalleapiprodscus.blob.core.windows.net' },
    ],
  },

  /* ── Experimental flags ───────────────────────────────────────── */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'recharts',
      'zod',
    ],
  },

  /* ── Transpile packages ───────────────────────────────────────── */
  transpilePackages: ['superjson'],
};

export default withSentryConfig(nextConfig, {
  // Suppresses all Sentry CLI logs during build
  silent: true,
  // Disable source map upload (no auth token configured)
  sourcemaps: {
    disable: true,
  },
});
