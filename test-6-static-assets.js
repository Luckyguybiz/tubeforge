// Test 6: Static assets load (check /ffmpeg/ files and other statics)
const puppeteer = require('puppeteer');

(async () => {
  const start = Date.now();
  let browser;
  const results = { test: 'Static Assets', passed: true, details: [] };

  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto('https://tubeforge.co', { waitUntil: 'networkidle2', timeout: 30000 });

    // Test FFmpeg static files
    const ffmpegAssets = [
      { path: '/ffmpeg/ffmpeg-core.js', type: 'JS core' },
      { path: '/ffmpeg/ffmpeg-core.wasm', type: 'WASM binary' },
      { path: '/ffmpeg/ffmpeg-core.worker.js', type: 'Worker JS' },
    ];

    for (const asset of ffmpegAssets) {
      try {
        const result = await page.evaluate(async (assetPath) => {
          try {
            const resp = await fetch(assetPath, { method: 'HEAD' });
            const contentType = resp.headers.get('content-type') || 'unknown';
            const contentLength = resp.headers.get('content-length') || 'unknown';
            return {
              status: resp.status,
              statusText: resp.statusText,
              contentType,
              contentLength
            };
          } catch (e) {
            return { error: e.message };
          }
        }, asset.path);

        if (result.error) {
          results.details.push({
            check: `FFmpeg: ${asset.type} (${asset.path})`,
            status: 'FAIL',
            value: `Network error: ${result.error}`
          });
          results.passed = false;
        } else if (result.status === 200) {
          const sizeStr = result.contentLength !== 'unknown'
            ? `${(parseInt(result.contentLength) / 1024).toFixed(0)}KB`
            : 'size unknown';
          results.details.push({
            check: `FFmpeg: ${asset.type} (${asset.path})`,
            status: 'PASS',
            value: `200 OK — ${result.contentType} — ${sizeStr}`
          });
        } else {
          results.passed = false;
          results.details.push({
            check: `FFmpeg: ${asset.type} (${asset.path})`,
            status: 'FAIL',
            value: `${result.status} ${result.statusText}`
          });
        }
      } catch (err) {
        results.passed = false;
        results.details.push({
          check: `FFmpeg: ${asset.type} (${asset.path})`,
          status: 'FAIL',
          value: err.message
        });
      }
    }

    // Check other important static assets
    const otherAssets = [
      { path: '/favicon.ico', type: 'Favicon' },
      { path: '/robots.txt', type: 'Robots.txt' },
      { path: '/sitemap.xml', type: 'Sitemap' },
    ];

    for (const asset of otherAssets) {
      try {
        const result = await page.evaluate(async (assetPath) => {
          try {
            const resp = await fetch(assetPath);
            return { status: resp.status, statusText: resp.statusText };
          } catch (e) {
            return { error: e.message };
          }
        }, asset.path);

        if (result.error) {
          results.details.push({
            check: asset.type,
            status: 'WARN',
            value: `Error: ${result.error}`
          });
        } else {
          results.details.push({
            check: asset.type,
            status: result.status === 200 ? 'PASS' : 'WARN',
            value: `${result.status} ${result.statusText}`
          });
        }
      } catch (err) {
        results.details.push({ check: asset.type, status: 'WARN', value: err.message });
      }
    }

    // Check that CSS and JS bundles loaded
    const loadedResources = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
      return { scripts: scripts.length, styles: styles.length, sampleScript: scripts[0], sampleStyle: styles[0] };
    });

    results.details.push({
      check: 'JS Bundles loaded',
      status: loadedResources.scripts > 0 ? 'PASS' : 'WARN',
      value: `${loadedResources.scripts} scripts`
    });
    results.details.push({
      check: 'CSS Stylesheets loaded',
      status: loadedResources.styles > 0 ? 'PASS' : 'INFO',
      value: `${loadedResources.styles} stylesheets${loadedResources.styles === 0 ? ' (may use CSS-in-JS)' : ''}`
    });

    // Check Next.js _next/static assets
    const nextAssets = await page.evaluate(async () => {
      const scripts = Array.from(document.querySelectorAll('script[src*="_next"]'));
      const results = [];
      for (const script of scripts.slice(0, 3)) {
        try {
          const resp = await fetch(script.src, { method: 'HEAD' });
          results.push({ src: script.src.split('/').pop(), status: resp.status });
        } catch (e) {
          results.push({ src: script.src.split('/').pop(), error: e.message });
        }
      }
      return results;
    });

    for (const asset of nextAssets) {
      results.details.push({
        check: `Next.js bundle: ${asset.src}`,
        status: asset.status === 200 ? 'PASS' : 'FAIL',
        value: asset.error || `${asset.status}`
      });
      if (asset.status && asset.status !== 200) results.passed = false;
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
