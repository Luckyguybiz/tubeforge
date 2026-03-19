/**
 * test-e2e-security.js — E2E Security Headers & Auth Tests
 * Tests security headers, auth-gated endpoints, and dashboard redirect.
 */
const puppeteer = require('puppeteer');

const BASE_URL = 'https://tubeforge-omega.vercel.app';

async function runTests() {
  const results = {
    suite: 'e2e-security',
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();

    // Helper: check headers on a given URL
    async function checkHeaders(url) {
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const headers = response.headers();
      return { response, headers, status: response.status() };
    }

    // ---- Collect headers from landing page ----
    const { headers: landingHeaders } = await checkHeaders(`${BASE_URL}/`);

    // ---- Test 1: CSP header present ----
    {
      const testName = 'CSP header is present';
      const csp = landingHeaders['content-security-policy'] || landingHeaders['content-security-policy-report-only'] || null;
      const passed = csp !== null && csp.length > 0;
      results.tests.push({
        name: testName,
        passed,
        detail: passed ? `CSP found (${csp.substring(0, 80)}...)` : 'No CSP header found',
        header: csp
      });
    }

    // ---- Test 2: X-Frame-Options ----
    {
      const testName = 'X-Frame-Options is set';
      const xfo = landingHeaders['x-frame-options'] || null;
      const passed = xfo !== null && xfo.length > 0;
      results.tests.push({
        name: testName,
        passed,
        detail: passed ? `X-Frame-Options: ${xfo}` : 'Missing X-Frame-Options header'
      });
    }

    // ---- Test 3: X-Content-Type-Options: nosniff ----
    {
      const testName = 'X-Content-Type-Options: nosniff';
      const xcto = landingHeaders['x-content-type-options'] || null;
      const passed = xcto === 'nosniff';
      results.tests.push({
        name: testName,
        passed,
        detail: passed ? 'OK' : `Expected "nosniff", got "${xcto}"`
      });
    }

    // ---- Test 4: Strict-Transport-Security ----
    {
      const testName = 'Strict-Transport-Security is set';
      const hsts = landingHeaders['strict-transport-security'] || null;
      const passed = hsts !== null && hsts.length > 0;
      results.tests.push({
        name: testName,
        passed,
        detail: passed ? `HSTS: ${hsts}` : 'Missing Strict-Transport-Security header'
      });
    }

    // ---- Test 5: /api/auth-debug requires auth (401) ----
    {
      const testName = '/api/auth-debug requires auth (returns 401)';
      try {
        const response = await page.goto(`${BASE_URL}/api/auth-debug`, { waitUntil: 'networkidle2', timeout: 15000 });
        const status = response.status();
        // Accept 401 or 403 as "requires auth"
        const passed = status === 401 || status === 403;
        results.tests.push({
          name: testName,
          passed,
          status,
          detail: passed ? `Got ${status} as expected` : `Expected 401/403, got ${status}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 6: /api/tools/promo requires auth (401) ----
    {
      const testName = '/api/tools/promo requires auth (returns 401)';
      try {
        const response = await page.goto(`${BASE_URL}/api/tools/promo`, { waitUntil: 'networkidle2', timeout: 15000 });
        const status = response.status();
        const passed = status === 401 || status === 403;
        results.tests.push({
          name: testName,
          passed,
          status,
          detail: passed ? `Got ${status} as expected` : `Expected 401/403, got ${status}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 7: /dashboard redirects to /login when not authenticated ----
    {
      const testName = '/dashboard redirects to /login when unauthenticated';
      try {
        // Disable auto-follow to capture the redirect chain
        const response = await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
        const finalUrl = page.url();
        const passed = finalUrl.includes('/login') || finalUrl.includes('/sign-in') || finalUrl.includes('/api/auth');
        results.tests.push({
          name: testName,
          passed,
          finalUrl,
          detail: passed ? `Redirected to ${finalUrl}` : `Expected redirect to /login, but ended at ${finalUrl}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Bonus: Check security headers on API route too ----
    {
      const testName = 'Security headers present on /api/health';
      try {
        const { headers: apiHeaders } = await checkHeaders(`${BASE_URL}/api/health`);
        const checks = {
          xcto: apiHeaders['x-content-type-options'] === 'nosniff',
          xfo: !!apiHeaders['x-frame-options'],
        };
        const passed = checks.xcto || checks.xfo;
        results.tests.push({
          name: testName,
          passed,
          detail: JSON.stringify(checks)
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

  } catch (err) {
    results.tests.push({ name: 'Suite setup', passed: false, detail: err.message });
  } finally {
    if (browser) await browser.close();
  }

  results.summary.total = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.passed).length;
  results.summary.failed = results.summary.total - results.summary.passed;

  console.log(JSON.stringify(results, null, 2));
  return results;
}

runTests().catch(err => {
  console.error(JSON.stringify({ suite: 'e2e-security', error: err.message }));
  process.exit(1);
});
