// Test 4: Security headers check
const puppeteer = require('puppeteer');

(async () => {
  const start = Date.now();
  let browser;
  const results = { test: 'Security Headers', passed: true, details: [] };

  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    const response = await page.goto('https://tubeforge-omega.vercel.app', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const headers = response.headers();

    // Required security headers
    const securityHeaders = [
      { name: 'content-security-policy', label: 'Content-Security-Policy (CSP)', required: true },
      { name: 'strict-transport-security', label: 'Strict-Transport-Security (HSTS)', required: true },
      { name: 'x-frame-options', label: 'X-Frame-Options', required: true },
      { name: 'x-content-type-options', label: 'X-Content-Type-Options', required: true },
      { name: 'referrer-policy', label: 'Referrer-Policy', required: false },
      { name: 'permissions-policy', label: 'Permissions-Policy', required: false },
      { name: 'x-xss-protection', label: 'X-XSS-Protection', required: false },
      { name: 'x-dns-prefetch-control', label: 'X-DNS-Prefetch-Control', required: false },
      { name: 'cross-origin-opener-policy', label: 'Cross-Origin-Opener-Policy (COOP)', required: false },
      { name: 'cross-origin-embedder-policy', label: 'Cross-Origin-Embedder-Policy (COEP)', required: false },
    ];

    for (const h of securityHeaders) {
      const value = headers[h.name];
      if (value) {
        results.details.push({
          check: h.label,
          status: 'PASS',
          value: value.length > 100 ? value.substring(0, 100) + '...' : value
        });
      } else {
        if (h.required) results.passed = false;
        results.details.push({
          check: h.label,
          status: h.required ? 'FAIL' : 'WARN',
          value: 'Not present'
        });
      }
    }

    // Check HSTS details if present
    const hsts = headers['strict-transport-security'];
    if (hsts) {
      const hasMaxAge = /max-age=(\d+)/.exec(hsts);
      if (hasMaxAge) {
        const maxAge = parseInt(hasMaxAge[1]);
        results.details.push({
          check: 'HSTS max-age',
          status: maxAge >= 31536000 ? 'PASS' : 'WARN',
          value: `${maxAge}s (${(maxAge / 86400).toFixed(0)} days)`
        });
      }
      results.details.push({
        check: 'HSTS includeSubDomains',
        status: hsts.includes('includeSubDomains') ? 'PASS' : 'INFO',
        value: hsts.includes('includeSubDomains') ? 'Yes' : 'No'
      });
    }

    // Check CSP details if present
    const csp = headers['content-security-policy'];
    if (csp) {
      const directives = ['default-src', 'script-src', 'style-src', 'img-src', 'connect-src'];
      for (const dir of directives) {
        results.details.push({
          check: `CSP: ${dir}`,
          status: csp.includes(dir) ? 'PASS' : 'INFO',
          value: csp.includes(dir) ? 'Present' : 'Not specified'
        });
      }
    }

    // Also check via fetch for API headers
    const apiResponse = await page.evaluate(async () => {
      try {
        const resp = await fetch('/api/health', { method: 'GET' });
        const h = {};
        resp.headers.forEach((v, k) => { h[k] = v; });
        return { status: resp.status, headers: h };
      } catch (e) {
        return { error: e.message };
      }
    });

    if (apiResponse && !apiResponse.error) {
      results.details.push({
        check: 'API route accessible',
        status: 'INFO',
        value: `Status ${apiResponse.status}`
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
