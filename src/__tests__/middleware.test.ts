/**
 * Tests for the middleware configuration and auth behavior.
 *
 * We test two middleware files:
 *   - src/middleware.ts  (used by Next.js via the src/ directory convention)
 *   - middleware.ts      (root-level, broader matcher with runtime public-path logic)
 *
 * We also verify security headers are correctly wired in next.config.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { securityHeaders } from '@/lib/security-headers';

/* ── src/middleware.ts — config & matcher ──────────────────────── */

describe('src/middleware — matcher-based auth', () => {
  const protectedRoutes = [
    '/dashboard',
    '/editor',
    '/thumbnails',
    '/metadata',
    '/preview',
    '/settings',
    '/team',
    '/admin',
  ];

  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/privacy',
    '/terms',
    '/api/auth/callback',
    '/api/stripe/webhook',
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

  it('should export a matcher array', () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
  });

  it('matcher should include all protected app routes', () => {
    for (const route of protectedRoutes) {
      const pattern = `${route}/:path*`;
      expect(config.matcher).toContain(pattern);
    }
  });

  it('matcher should have exactly 8 protected route patterns', () => {
    expect(config.matcher).toHaveLength(8);
  });

  it('matcher should NOT include public routes', () => {
    for (const route of publicRoutes) {
      const hasMatch = config.matcher.some(
        (m: string) => m === route || m.startsWith(route + '/')
      );
      expect(hasMatch).toBe(false);
    }
  });

  it('matcher patterns should all end with /:path*', () => {
    for (const pattern of config.matcher) {
      expect(pattern).toMatch(/\/:path\*$/);
    }
  });

  it('matcher patterns should all start with /', () => {
    for (const pattern of config.matcher) {
      expect(pattern).toMatch(/^\//);
    }
  });
});

/* ── Root middleware.ts — runtime public-path logic ────────────── */

describe('root middleware — runtime public-path checks', () => {
  const publicPaths = ['/', '/login', '/register', '/api/auth', '/api/stripe/webhook', '/privacy', '/terms'];

  // We replicate the logic from root middleware.ts for testability.
  function isPublicPath(pathname: string): boolean {
    return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  function isStaticAsset(pathname: string): boolean {
    return pathname.startsWith('/_next') || pathname.startsWith('/favicon') || /\.\w{2,5}$/.test(pathname);
  }

  it('should treat "/" as public', () => {
    expect(isPublicPath('/')).toBe(true);
  });

  it('should treat "/login" as public', () => {
    expect(isPublicPath('/login')).toBe(true);
  });

  it('should treat "/register" as public', () => {
    expect(isPublicPath('/register')).toBe(true);
  });

  it('should treat "/api/auth" and sub-paths as public', () => {
    expect(isPublicPath('/api/auth')).toBe(true);
    expect(isPublicPath('/api/auth/callback/google')).toBe(true);
  });

  it('should treat "/api/stripe/webhook" as public', () => {
    expect(isPublicPath('/api/stripe/webhook')).toBe(true);
  });

  it('should treat "/privacy" and "/terms" as public', () => {
    expect(isPublicPath('/privacy')).toBe(true);
    expect(isPublicPath('/terms')).toBe(true);
  });

  it('should NOT treat "/dashboard" as public', () => {
    expect(isPublicPath('/dashboard')).toBe(false);
  });

  it('should NOT treat "/editor/abc" as public', () => {
    expect(isPublicPath('/editor/abc')).toBe(false);
  });

  it('should NOT treat "/settings" as public', () => {
    expect(isPublicPath('/settings')).toBe(false);
  });

  it('should NOT treat "/admin" as public', () => {
    expect(isPublicPath('/admin')).toBe(false);
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

  describe('root middleware matcher config', () => {
    let rootConfig: { matcher: string[] };

    beforeEach(async () => {
      vi.resetModules();
      vi.doMock('@/server/auth', () => ({
        auth: (handler: unknown) => handler,
      }));
      vi.doMock('next/server', () => ({
        NextResponse: { next: vi.fn(), redirect: vi.fn() },
      }));
      // The root middleware is at the project root, outside src/
      // We import its config to verify the matcher pattern.
      // Since it uses @/server/auth alias, we mock it.
      const mod = await import('../../middleware');
      rootConfig = mod.config;
    });

    it('should export a catch-all matcher excluding _next/static, _next/image, and favicon.ico', () => {
      expect(rootConfig.matcher).toHaveLength(1);
      expect(rootConfig.matcher[0]).toBe('/((?!_next/static|_next/image|favicon.ico).*)');
    });
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
      (h) => h.key === 'X-Permitted-Cross-Domain-Policies'
    );
    expect(header).toBeDefined();
    expect(header!.value).toBe('none');
  });

  it('X-DNS-Prefetch-Control should be on', () => {
    const header = securityHeaders.find(
      (h) => h.key === 'X-DNS-Prefetch-Control'
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
