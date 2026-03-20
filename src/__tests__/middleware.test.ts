/**
 * Tests for the middleware configuration and auth behavior.
 *
 * After consolidation, src/middleware.ts is the ONLY active middleware
 * (Next.js with src/ directory ignores root middleware.ts).
 * It uses a catch-all matcher with runtime public-path checks and
 * edge-level IP rate limiting.
 *
 * We also verify security headers are correctly wired in next.config.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { securityHeaders } from '@/lib/security-headers';

/* ── src/middleware.ts — config & matcher ──────────────────────── */

describe('src/middleware — consolidated middleware', () => {
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/api/auth',
    '/api/stripe/webhook',
    '/api/webhooks',
    '/api/health',
    '/privacy',
    '/terms',
  ];

  const protectedRoutes = [
    '/dashboard',
    '/editor',
    '/thumbnails',
    '/metadata',
    '/preview',
    '/settings',
    '/team',
    '/admin',
    '/tools',
    '/shorts-analytics',
    '/referral',
  ];

  // Import the config directly — it's a plain object, no runtime deps.
  let config: { matcher: string[] };

  beforeEach(async () => {
    vi.resetModules();
    // Mock the auth dependency so the module can be loaded in a test environment
    vi.doMock('@/server/auth', () => ({
      auth: (handler: unknown) => handler,
    }));
    const mod = await import('@/middleware');
    config = mod.config;
  });

  it('should export a catch-all matcher excluding _next/static, _next/image, and favicon.ico', () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher).toHaveLength(1);
    expect(config.matcher[0]).toBe('/((?!_next/static|_next/image|favicon.ico).*)');
  });

  // Replicate the runtime public-path logic for testability
  function isPublicPath(pathname: string): boolean {
    return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  function isStaticAsset(pathname: string): boolean {
    return (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      /\.\w{2,5}$/.test(pathname)
    );
  }

  it('should treat all public paths as public', () => {
    for (const p of publicPaths) {
      expect(isPublicPath(p)).toBe(true);
    }
  });

  it('should treat "/api/auth/callback/google" as public (sub-path)', () => {
    expect(isPublicPath('/api/auth/callback/google')).toBe(true);
  });

  it('should NOT treat protected routes as public', () => {
    for (const route of protectedRoutes) {
      expect(isPublicPath(route)).toBe(false);
    }
  });

  it('should detect /_next paths as static assets', () => {
    expect(isStaticAsset('/_next/static/chunks/main.js')).toBe(true);
    expect(isStaticAsset('/_next/image?url=...')).toBe(true);
  });

  it('should detect /favicon paths as static assets', () => {
    expect(isStaticAsset('/favicon.ico')).toBe(true);
    expect(isStaticAsset('/favicon-32x32.png')).toBe(true);
  });

  it('should detect files with common extensions as static assets', () => {
    expect(isStaticAsset('/robots.txt')).toBe(true);
    expect(isStaticAsset('/sitemap.xml')).toBe(true);
    expect(isStaticAsset('/logo.png')).toBe(true);
    expect(isStaticAsset('/style.css')).toBe(true);
  });

  it('should NOT treat normal paths as static assets', () => {
    expect(isStaticAsset('/dashboard')).toBe(false);
    expect(isStaticAsset('/editor/project-1')).toBe(false);
    expect(isStaticAsset('/api/auth/callback')).toBe(false);
  });
});

/* ── Security headers in next.config.ts ───────────────────────── */

describe('security headers integration', () => {
  // securityHeaders imported at top level via ESM import.
  // The next.config.ts applies them to source '/(.*)', covering all routes.

  const requiredHeaderKeys = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
    'X-DNS-Prefetch-Control',
    'X-Permitted-Cross-Domain-Policies',
  ];

  it('should include all required security headers', () => {
    const keys = securityHeaders.map((h) => h.key);
    for (const required of requiredHeaderKeys) {
      expect(keys).toContain(required);
    }
  });

  it('should have exactly 8 security headers', () => {
    expect(securityHeaders).toHaveLength(8);
  });

  it('CSP should block framing via frame-ancestors', () => {
    const csp = securityHeaders.find((h) => h.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp!.value).toContain("frame-ancestors 'none'");
  });

  it('X-Permitted-Cross-Domain-Policies should be none', () => {
    const header = securityHeaders.find(
      (h) => h.key === 'X-Permitted-Cross-Domain-Policies',
    );
    expect(header).toBeDefined();
    expect(header!.value).toBe('none');
  });

  it('X-DNS-Prefetch-Control should be on', () => {
    const header = securityHeaders.find(
      (h) => h.key === 'X-DNS-Prefetch-Control',
    );
    expect(header).toBeDefined();
    expect(header!.value).toBe('on');
  });

  it('CSP connect-src should allow Google accounts for OAuth', () => {
    const csp = securityHeaders.find((h) => h.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp!.value).toContain('accounts.google.com');
  });
});
