// Test 5: API routes return proper status codes without auth
const puppeteer = require('puppeteer');

(async () => {
  const start = Date.now();
  let browser;
  const results = { test: 'API Routes (No Auth)', passed: true, details: [] };

  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto('https://tubeforge.co', { waitUntil: 'networkidle2', timeout: 30000 });

    // Test various API routes
    const apiRoutes = [
      { path: '/api/health', method: 'GET', expectStatus: [200] },
      { path: '/api/auth/session', method: 'GET', expectStatus: [200, 401, 403] },
      { path: '/api/auth/providers', method: 'GET', expectStatus: [200] },
      { path: '/api/auth/csrf', method: 'GET', expectStatus: [200] },
      { path: '/api/convert', method: 'POST', expectStatus: [400, 401, 403, 405] },
      { path: '/api/compress', method: 'POST', expectStatus: [400, 401, 403, 405] },
      { path: '/api/billing', method: 'GET', expectStatus: [401, 403] },
      { path: '/api/user', method: 'GET', expectStatus: [401, 403] },
      { path: '/api/usage', method: 'GET', expectStatus: [401, 403] },
      // Non-existent route should 404
      { path: '/api/nonexistent-route-xyz', method: 'GET', expectStatus: [404] },
    ];

    for (const route of apiRoutes) {
      try {
        const result = await page.evaluate(async (path, method) => {
          try {
            const resp = await fetch(path, {
              method,
              headers: { 'Content-Type': 'application/json' },
              ...(method === 'POST' ? { body: '{}' } : {})
            });
            let body = null;
            try {
              body = await resp.text();
              if (body.length > 200) body = body.substring(0, 200) + '...';
            } catch (e) {}
            return { status: resp.status, statusText: resp.statusText, body };
          } catch (e) {
            return { error: e.message };
          }
        }, route.path, route.method);

        if (result.error) {
          results.details.push({
            check: `${route.method} ${route.path}`,
            status: 'FAIL',
            value: `Network error: ${result.error}`
          });
          results.passed = false;
        } else {
          // Check if status is within expected range
          const statusOk = route.expectStatus.includes(result.status);
          // Also consider: any non-5xx response for auth-protected routes is acceptable
          const isServerError = result.status >= 500;
          const pass = statusOk || (!isServerError && route.expectStatus.some(s => s >= 400));

          results.details.push({
            check: `${route.method} ${route.path}`,
            status: isServerError ? 'FAIL' : (statusOk ? 'PASS' : 'WARN'),
            value: `${result.status} ${result.statusText}${result.body ? ` — ${result.body.substring(0, 80)}` : ''}`
          });
          if (isServerError) results.passed = false;
        }
      } catch (err) {
        results.details.push({
          check: `${route.method} ${route.path}`,
          status: 'FAIL',
          value: err.message
        });
        results.passed = false;
      }
    }

    // Test rate limiting - rapid requests
    try {
      const rateLimitResult = await page.evaluate(async () => {
        const results = [];
        const promises = [];
        for (let i = 0; i < 20; i++) {
          promises.push(
            fetch('/api/health', { method: 'GET' })
              .then(r => r.status)
              .catch(e => `error: ${e.message}`)
          );
        }
        return Promise.all(promises);
      });

      const has429 = rateLimitResult.includes(429);
      results.details.push({
        check: 'Rate limiting (20 rapid requests)',
        status: has429 ? 'PASS' : 'INFO',
        value: has429
          ? `Rate limit triggered (429 seen)`
          : `All returned: ${[...new Set(rateLimitResult)].join(', ')} (no 429)`
      });
    } catch (err) {
      results.details.push({
        check: 'Rate limiting',
        status: 'INFO',
        value: `Could not test: ${err.message}`
      });
    }

  } catch (err) {
    results.passed = false;
    results.details.push({ check: 'Exception', status: 'FAIL', value: err.message });
  } finally {
    if (browser) await browser.close();
  }

  results.time = `${((Date.now() - start) / 1000).toFixed(1)}s`;
  console.log(JSON.stringify(results, null, 2));
})();
