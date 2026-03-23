import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import { securityHeaders } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,

  /* ── Server env vars (ensure they survive turbopack bundling) ── */
  env: {
    AUTH_URL: process.env.AUTH_URL ?? 'https://tubeforge.co',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'https://tubeforge.co',
  },

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
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'v3.fal.media' },
      { protocol: 'https', hostname: 'v3b.fal.media' },
      { protocol: 'https', hostname: '*.fal.media' },
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
      '@stripe/stripe-js',
      'zustand',
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
