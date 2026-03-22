import { describe, it, expect } from 'vitest';
import { securityHeaders } from '@/lib/security-headers';

describe('security-headers', () => {
  it('should export an array of header objects', () => {
    expect(Array.isArray(securityHeaders)).toBe(true);
    expect(securityHeaders.length).toBeGreaterThan(0);
  });

  it('every header should have key and value strings', () => {
    for (const h of securityHeaders) {
      expect(h).toHaveProperty('key');
      expect(h).toHaveProperty('value');
      expect(typeof h.key).toBe('string');
      expect(typeof h.value).toBe('string');
      expect(h.key.length).toBeGreaterThan(0);
      expect(h.value.length).toBeGreaterThan(0);
    }
  });

  it('should include Content-Security-Policy', () => {
    const csp = securityHeaders.find((h) => h.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp!.value).toContain("default-src 'self'");
    expect(csp!.value).toContain("frame-ancestors 'none'");
  });

  it('CSP should allow Google images for avatars', () => {
    const csp = securityHeaders.find((h) => h.key === 'Content-Security-Policy')!;
    expect(csp.value).toContain('lh3.googleusercontent.com');
  });

  it('CSP should allow YouTube thumbnail images', () => {
    const csp = securityHeaders.find((h) => h.key === 'Content-Security-Policy')!;
    expect(csp.value).toContain('i.ytimg.com');
  });

  it('CSP should allow API connections to OpenAI and Anthropic', () => {
    const csp = securityHeaders.find((h) => h.key === 'Content-Security-Policy')!;
    expect(csp.value).toContain('api.openai.com');
    expect(csp.value).toContain('api.anthropic.com');
    expect(csp.value).toContain('api.runwayml.com');
  });

  it('should include X-Frame-Options DENY', () => {
    const xfo = securityHeaders.find((h) => h.key === 'X-Frame-Options');
    expect(xfo).toBeDefined();
    expect(xfo!.value).toBe('DENY');
  });

  it('should include X-Content-Type-Options nosniff', () => {
    const xcto = securityHeaders.find((h) => h.key === 'X-Content-Type-Options');
    expect(xcto).toBeDefined();
    expect(xcto!.value).toBe('nosniff');
  });

  it('should include Strict-Transport-Security with long max-age', () => {
    const hsts = securityHeaders.find((h) => h.key === 'Strict-Transport-Security');
    expect(hsts).toBeDefined();
    expect(hsts!.value).toContain('max-age=');
    // At least 1 year (31536000s)
    const match = hsts!.value.match(/max-age=(\d+)/);
    expect(match).toBeTruthy();
    expect(Number(match![1])).toBeGreaterThanOrEqual(31536000);
    expect(hsts!.value).toContain('includeSubDomains');
  });

  it('should include Referrer-Policy', () => {
    const rp = securityHeaders.find((h) => h.key === 'Referrer-Policy');
    expect(rp).toBeDefined();
    expect(rp!.value).toBe('strict-origin-when-cross-origin');
  });

  it('should include Permissions-Policy that disables camera and allows microphone for self', () => {
    const pp = securityHeaders.find((h) => h.key === 'Permissions-Policy');
    expect(pp).toBeDefined();
    expect(pp!.value).toContain('camera=()');
    expect(pp!.value).toContain('microphone=(self)');
  });

  it('should have unique header keys', () => {
    const keys = securityHeaders.map((h) => h.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
