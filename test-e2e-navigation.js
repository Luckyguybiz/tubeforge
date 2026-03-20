/**
 * test-e2e-navigation.js — E2E Navigation Tests
 * Tests that all public pages load correctly with no console errors.
 */
const puppeteer = require('puppeteer');

const BASE_URL = 'https://tubeforge.co';

async function runTests() {
  const results = {
    suite: 'e2e-navigation',
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

    // Collect console errors across all page loads
    const consoleErrors = {};

    // ---- Test 1: Landing page returns 200 ----
    {
      const testName = 'Landing page (/) returns 200';
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      try {
        const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
        const status = response.status();
        const passed = status === 200;
        results.tests.push({
          name: testName,
          passed,
          status,
          detail: passed ? 'OK' : `Expected 200, got ${status}`
        });
        consoleErrors['/'] = [...errors];
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
      page.removeAllListeners('console');
    }

    // ---- Test 2: /login page loads ----
    {
      const testName = '/login page loads';
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      try {
        const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
        const status = response.status();
        // login might redirect, accept 200 or 3xx
        const passed = status >= 200 && status < 400;
        results.tests.push({
          name: testName,
          passed,
          status,
          detail: passed ? 'OK' : `Got status ${status}`
        });
        consoleErrors['/login'] = [...errors];
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
      page.removeAllListeners('console');
    }

    // ---- Test 3: /privacy page loads ----
    {
      const testName = '/privacy page loads';
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      try {
        const response = await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'networkidle2', timeout: 30000 });
        const status = response.status();
        const passed = status >= 200 && status < 400;
        results.tests.push({
          name: testName,
          passed,
          status,
          detail: passed ? 'OK' : `Got status ${status}`
        });
        consoleErrors['/privacy'] = [...errors];
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
      page.removeAllListeners('console');
    }

    // ---- Test 4: /terms page loads ----
    {
      const testName = '/terms page loads';
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      try {
        const response = await page.goto(`${BASE_URL}/terms`, { waitUntil: 'networkidle2', timeout: 30000 });
        const status = response.status();
        const passed = status >= 200 && status < 400;
        results.tests.push({
          name: testName,
          passed,
          status,
          detail: passed ? 'OK' : `Got status ${status}`
        });
        consoleErrors['/terms'] = [...errors];
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
      page.removeAllListeners('console');
    }

    // ---- Test 5: /api/health returns JSON with status ----
    {
      const testName = '/api/health returns JSON with status';
      try {
        const response = await page.goto(`${BASE_URL}/api/health`, { waitUntil: 'networkidle2', timeout: 15000 });
        const status = response.status();
        const contentType = response.headers()['content-type'] || '';
        let body = {};
        try {
          body = await response.json();
        } catch (_) {
          body = { raw: await response.text() };
        }
        const hasStatus = body && typeof body.status === 'string';
        const passed = (status === 200 || status === 503) && hasStatus;
        results.tests.push({
          name: testName,
          passed,
          httpStatus: status,
          body,
          detail: passed ? 'OK' : `status=${status}, hasStatus=${hasStatus}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 6: No console errors on any page ----
    {
      const testName = 'No console errors on public pages';
      const pagesWithErrors = Object.entries(consoleErrors)
        .filter(([, errs]) => errs.length > 0)
        .map(([path, errs]) => ({ path, errorCount: errs.length, sample: errs.slice(0, 3) }));
      const passed = pagesWithErrors.length === 0;
      results.tests.push({
        name: testName,
        passed,
        detail: passed ? 'No console errors found' : `${pagesWithErrors.length} page(s) had console errors`,
        pagesWithErrors
      });
    }

  } catch (err) {
    results.tests.push({ name: 'Suite setup', passed: false, detail: err.message });
  } finally {
    if (browser) await browser.close();
  }

  // Summary
  results.summary.total = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.passed).length;
  results.summary.failed = results.summary.total - results.summary.passed;

  console.log(JSON.stringify(results, null, 2));
  return results;
}

runTests().catch(err => {
  console.error(JSON.stringify({ suite: 'e2e-navigation', error: err.message }));
  process.exit(1);
});
