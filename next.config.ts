import type { NextConfig } from 'next';
import { securityHeaders } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /* ── Security headers ─────────────────────────────────────────── */
  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  /* ── Image optimisation ───────────────────────────────────────── */
  images: {
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
  },

  /* ── Transpile packages ───────────────────────────────────────── */
  transpilePackages: ['superjson'],
};

export default nextConfig;
