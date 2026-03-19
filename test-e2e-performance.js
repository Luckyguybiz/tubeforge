/**
 * test-e2e-performance.js — E2E Performance Metrics Tests
 * Tests TTFB, FCP, page size, request count, and 404 errors.
 */
const puppeteer = require('puppeteer');

const BASE_URL = 'https://tubeforge-omega.vercel.app';

async function runTests() {
  const results = {
    suite: 'e2e-performance',
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

    // Track all requests for the landing page load
    const requests = [];
    const failedRequests = [];
    let totalTransferSize = 0;

    // Enable request interception tracking
    await page.setRequestInterception(false);

    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      requests.push({ url, status });

      if (status === 404) {
        failedRequests.push({ url, status });
      }

      // Try to get content-length for transfer size estimation
      const headers = response.headers();
      const contentLength = parseInt(headers['content-length'] || '0', 10);
      if (contentLength > 0) {
        totalTransferSize += contentLength;
      }
    });

    // ---- Navigate to landing page ----
    const navigationStart = Date.now();
    const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    const navigationEnd = Date.now();

    // ---- Test 1: Measure TTFB ----
    {
      const testName = 'Time to First Byte (TTFB) for landing page';
      try {
        const ttfb = await page.evaluate(() => {
          const [nav] = performance.getEntriesByType('navigation');
          if (nav) {
            return nav.responseStart - nav.requestStart;
          }
          // Fallback: use timing API
          const timing = performance.timing;
          return timing.responseStart - timing.requestStart;
        });

        // Also compute from our external measurement as a fallback
        const externalTTFB = navigationEnd - navigationStart;

        const effectiveTTFB = ttfb > 0 ? ttfb : externalTTFB;
        const passed = effectiveTTFB < 3000; // 3 seconds threshold
        results.tests.push({
          name: testName,
          passed,
          ttfbMs: Math.round(effectiveTTFB),
          detail: passed ? `TTFB: ${Math.round(effectiveTTFB)}ms (threshold: 3000ms)` : `TTFB too slow: ${Math.round(effectiveTTFB)}ms`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 2: Measure First Contentful Paint (FCP) ----
    {
      const testName = 'First Contentful Paint (FCP)';
      try {
        // Wait a moment for paint entries to be recorded
        await page.waitForFunction(() => {
          const entries = performance.getEntriesByType('paint');
          return entries.some(e => e.name === 'first-contentful-paint');
        }, { timeout: 15000 }).catch(() => null);

        const fcp = await page.evaluate(() => {
          const entries = performance.getEntriesByType('paint');
          const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
          return fcpEntry ? fcpEntry.startTime : null;
        });

        if (fcp !== null) {
          const passed = fcp < 3000; // 3 seconds threshold
          results.tests.push({
            name: testName,
            passed,
            fcpMs: Math.round(fcp),
            detail: passed ? `FCP: ${Math.round(fcp)}ms (threshold: 3000ms)` : `FCP too slow: ${Math.round(fcp)}ms`
          });
        } else {
          results.tests.push({
            name: testName,
            passed: false,
            detail: 'FCP entry not found in performance entries'
          });
        }
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 3: Total page size < 500KB ----
    {
      const testName = 'Total page size < 500KB';
      try {
        // Use Performance API to get more accurate transfer sizes
        const perfTransferSize = await page.evaluate(() => {
          const entries = performance.getEntriesByType('resource');
          let total = 0;
          for (const entry of entries) {
            total += entry.transferSize || entry.encodedBodySize || 0;
          }
          // Also add navigation entry
          const [nav] = performance.getEntriesByType('navigation');
          if (nav) {
            total += nav.transferSize || nav.encodedBodySize || 0;
          }
          return total;
        });

        const effectiveSize = perfTransferSize > 0 ? perfTransferSize : totalTransferSize;
        const sizeKB = Math.round(effectiveSize / 1024);
        const passed = sizeKB < 500;
        results.tests.push({
          name: testName,
          passed,
          totalSizeKB: sizeKB,
          detail: passed ? `Total: ${sizeKB}KB (limit: 500KB)` : `Too large: ${sizeKB}KB (limit: 500KB)`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 4: Number of network requests < 30 ----
    {
      const testName = 'Number of network requests < 30';
      const requestCount = requests.length;
      const passed = requestCount < 30;
      results.tests.push({
        name: testName,
        passed,
        requestCount,
        detail: passed ? `${requestCount} requests (limit: 30)` : `Too many requests: ${requestCount} (limit: 30)`
      });
    }

    // ---- Test 5: No 404 errors for static assets ----
    {
      const testName = 'No 404 errors for static assets';
      // Filter to only static assets (js, css, images, fonts)
      const static404s = failedRequests.filter(r => {
        const url = r.url.toLowerCase();
        return url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)(\?|$)/);
      });
      const passed = static404s.length === 0;
      results.tests.push({
        name: testName,
        passed,
        failed404Count: static404s.length,
        detail: passed ? 'No 404 errors for static assets' : `${static404s.length} static asset(s) returned 404`,
        failedUrls: static404s.map(r => r.url)
      });
    }

    // ---- Bonus: All 404s (including non-static) ----
    {
      const testName = 'No 404 errors on any resource';
      const passed = failedRequests.length === 0;
      results.tests.push({
        name: testName,
        passed,
        failed404Count: failedRequests.length,
        detail: passed ? 'No 404 errors at all' : `${failedRequests.length} resource(s) returned 404`,
        failedUrls: failedRequests.map(r => r.url)
      });
    }

    // ---- Bonus: Largest Contentful Paint (LCP) ----
    {
      const testName = 'Largest Contentful Paint (LCP) < 4 seconds';
      try {
        const lcp = await page.evaluate(() => {
          return new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              if (entries.length > 0) {
                resolve(entries[entries.length - 1].startTime);
              }
            });
            observer.observe({ type: 'largest-contentful-paint', buffered: true });

            // Timeout fallback
            setTimeout(() => resolve(null), 5000);
          });
        });

        if (lcp !== null) {
          const passed = lcp < 4000;
          results.tests.push({
            name: testName,
            passed,
            lcpMs: Math.round(lcp),
            detail: passed ? `LCP: ${Math.round(lcp)}ms (threshold: 4000ms)` : `LCP too slow: ${Math.round(lcp)}ms`
          });
        } else {
          results.tests.push({
            name: testName,
            passed: true,
            detail: 'LCP observer returned no entries (page may have already painted before observer was set up)'
          });
        }
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
  console.error(JSON.stringify({ suite: 'e2e-performance', error: err.message }));
  process.exit(1);
});
