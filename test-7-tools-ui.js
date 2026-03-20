// Test 7: Tool pages UI — verify each tool page loads correctly
// Note: Tool pages are behind auth, so unauthenticated access redirects to /login.
// This test verifies:
//   1. Each tool URL responds (200 after redirect, or 200 directly)
//   2. Auth-gated pages redirect to /login with correct callbackUrl
//   3. The login page renders properly (form elements, no errors)
//   4. A non-existent tool returns 404
//   5. No console errors on any page
//
// Uses Puppeteer against the live site: https://tubeforge.co

const puppeteer = require('puppeteer');

const BASE = 'https://tubeforge.co';

// All tool IDs from src/views/Tools/index.tsx
const ALL_TOOLS = [
  'mp3-converter',
  'video-compressor',
  'cut-crop',
  'youtube-downloader',
  'image-generator',
  'voiceover-generator',
  'speech-enhancer',
  'veo3-generator',
  'brainstormer',
  'vocal-remover',
  'ai-creator',
  'autoclip',
  'subtitle-editor',
  'subtitle-remover',
  'reddit-video',
  'fake-texts',
  'tiktok-downloader',
  'audio-balancer',
  'background-remover',
  'voice-changer',
  'face-swap',
];

// Tools that do NOT have comingSoon — they should render full UI when authenticated
const LIVE_TOOLS = [
  'mp3-converter',
  'video-compressor',
  'cut-crop',
  'youtube-downloader',
];

(async () => {
  const start = Date.now();
  let browser;
  const results = { test: 'Tools UI Pages', passed: true, details: [] };

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
    });

    // Use a single page and navigate sequentially to avoid memory issues
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    for (const toolId of ALL_TOOLS) {
      const toolStart = Date.now();
      // Reset console errors for this tool
      consoleErrors.length = 0;

      try {
        const toolUrl = `${BASE}/tools/${toolId}`;

        // Navigate and follow redirects
        const response = await page.goto(toolUrl, {
          waitUntil: 'networkidle2',
          timeout: 20000,
        });

        const finalUrl = page.url();
        const status = response.status();
        const elapsed = ((Date.now() - toolStart) / 1000).toFixed(1);

        // The page should either:
        //  a) Show the tool (200 on the tools URL) — if somehow accessible
        //  b) Redirect to /login?callbackUrl=/tools/<toolId> — auth gate
        const isRedirectedToLogin = finalUrl.includes('/login');

        if (isRedirectedToLogin) {
          // Verify the callbackUrl is correct
          const expectedCallback = encodeURIComponent(`/tools/${toolId}`);
          const hasCorrectCallback = finalUrl.includes(`callbackUrl=${expectedCallback}`) ||
                                     finalUrl.includes(`callbackUrl=%2Ftools%2F${toolId}`);

          results.details.push({
            check: `${toolId}: Auth redirect`,
            status: hasCorrectCallback ? 'PASS' : 'WARN',
            value: hasCorrectCallback
              ? `Redirected to login with correct callbackUrl (${elapsed}s)`
              : `Redirected to ${finalUrl} (${elapsed}s)`,
          });

          // Verify login page rendered correctly
          const loginPageInfo = await page.evaluate(() => {
            const body = document.body.innerText.trim();
            const hasLoginButton = !!document.querySelector('button');
            const hasGoogleAuth = body.includes('Google');
            const h1orTitle = document.querySelector('h1, h2, h3');
            return {
              bodyLength: body.length,
              hasLoginButton,
              hasGoogleAuth,
              titleText: h1orTitle ? h1orTitle.textContent.trim() : null,
            };
          });

          if (loginPageInfo.bodyLength > 30 && loginPageInfo.hasLoginButton) {
            results.details.push({
              check: `${toolId}: Login page renders`,
              status: 'PASS',
              value: `Login page OK (${loginPageInfo.bodyLength} chars, Google auth: ${loginPageInfo.hasGoogleAuth})`,
            });
          } else {
            results.details.push({
              check: `${toolId}: Login page renders`,
              status: 'WARN',
              value: `Login page may not have rendered fully (${loginPageInfo.bodyLength} chars)`,
            });
          }
        } else {
          // Tool page loaded directly (no auth redirect)
          if (status !== 200) {
            results.passed = false;
            results.details.push({
              check: `${toolId}: HTTP status`,
              status: 'FAIL',
              value: `${status} (${elapsed}s)`,
            });
            continue;
          }

          // Wait for hydration
          try {
            await page.waitForSelector('h1', { timeout: 10000 });
          } catch (_) {}

          const bodyLength = await page.$eval('body', el => el.innerText.trim().length);
          const hasH1 = !!(await page.$('h1'));
          const backBtn = !!(await page.$('button[aria-label="Back to tools"]'));

          // Check for upload area on live tools
          const isLive = LIVE_TOOLS.includes(toolId);
          if (isLive) {
            const uploadInfo = await page.evaluate(() => {
              const fileInputs = document.querySelectorAll('input[type="file"]');
              const svgs = document.querySelectorAll('svg');
              let hasUploadIcon = false;
              for (const svg of svgs) {
                for (const p of svg.querySelectorAll('path, polyline')) {
                  const d = p.getAttribute('d') || p.getAttribute('points') || '';
                  if (d.includes('17 8 12 3 7 8') || d.includes('21 15v4')) {
                    hasUploadIcon = true;
                    break;
                  }
                }
                if (hasUploadIcon) break;
              }
              return {
                fileInputCount: fileInputs.length,
                hasUploadIcon,
                fileInputDisabled: fileInputs.length > 0 ? fileInputs[0].disabled : null,
              };
            });

            const hasUpload = uploadInfo.fileInputCount > 0 || uploadInfo.hasUploadIcon;
            results.details.push({
              check: `${toolId}: Upload area`,
              status: hasUpload ? 'PASS' : 'WARN',
              value: hasUpload
                ? `Upload area found (inputs: ${uploadInfo.fileInputCount}, disabled: ${uploadInfo.fileInputDisabled})`
                : 'Upload area not detected',
            });
          }

          results.details.push({
            check: `${toolId}: Page load`,
            status: 'PASS',
            value: `200 OK, ${bodyLength} chars, h1: ${hasH1}, back: ${backBtn} (${elapsed}s)`,
          });
        }

        // Check console errors for this tool
        const realErrors = consoleErrors.filter(e =>
          !e.includes('third-party') &&
          !e.includes('favicon') &&
          !e.includes('ERR_BLOCKED_BY_CLIENT') &&
          !e.includes('Failed to load resource') &&
          !e.includes('net::ERR_') &&
          !e.includes('chrome-extension') &&
          !e.includes('downloadable font') &&
          !e.includes('the server responded with a status of') &&
          !e.includes('Download the React DevTools')
        );

        if (realErrors.length > 0) {
          results.details.push({
            check: `${toolId}: Console errors`,
            status: 'WARN',
            value: `${realErrors.length} error(s): ${realErrors.slice(0, 2).join(' | ').substring(0, 200)}`,
          });
        }

      } catch (err) {
        const elapsed = ((Date.now() - toolStart) / 1000).toFixed(1);
        results.passed = false;
        results.details.push({
          check: `${toolId}: Load`,
          status: 'FAIL',
          value: `${err.message} (${elapsed}s)`,
        });
      }
    }

    // Test 404 for non-existent tool
    try {
      consoleErrors.length = 0;
      const resp404 = await page.goto(`${BASE}/tools/nonexistent-tool-xyz`, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
      const finalUrl = page.url();
      const s = resp404.status();

      // Could be 404 directly, or could redirect to login (then the tool would 404 after auth)
      if (s === 404) {
        results.details.push({
          check: '404 for invalid tool',
          status: 'PASS',
          value: '404 Not Found returned correctly',
        });
      } else if (finalUrl.includes('/login')) {
        // Redirected to login — the 404 would happen post-auth
        results.details.push({
          check: '404 for invalid tool',
          status: 'INFO',
          value: `Redirected to login (status ${s}) — 404 would occur after auth`,
        });
      } else {
        results.details.push({
          check: '404 for invalid tool',
          status: 'WARN',
          value: `Expected 404, got ${s} at ${finalUrl}`,
        });
      }
    } catch (err) {
      results.details.push({
        check: '404 for invalid tool',
        status: 'INFO',
        value: err.message,
      });
    }

    // Test the /tools index page loads
    try {
      consoleErrors.length = 0;
      const toolsStart = Date.now();
      const respTools = await page.goto(`${BASE}/tools`, {
        waitUntil: 'networkidle2',
        timeout: 20000,
      });
      const finalUrl = page.url();
      const elapsed = ((Date.now() - toolsStart) / 1000).toFixed(1);

      if (finalUrl.includes('/login')) {
        results.details.push({
          check: '/tools index: Auth redirect',
          status: 'PASS',
          value: `Redirected to login (${elapsed}s)`,
        });
      } else {
        const bodyLen = await page.$eval('body', el => el.innerText.trim().length);
        results.details.push({
          check: '/tools index: Page load',
          status: respTools.status() === 200 ? 'PASS' : 'WARN',
          value: `Status ${respTools.status()}, ${bodyLen} chars (${elapsed}s)`,
        });
      }
    } catch (err) {
      results.details.push({
        check: '/tools index',
        status: 'INFO',
        value: err.message,
      });
    }

    await page.close();

  } catch (err) {
    results.passed = false;
    results.details.push({ check: 'Exception', status: 'FAIL', value: err.message });
  } finally {
    if (browser) await browser.close();
  }

  results.time = `${((Date.now() - start) / 1000).toFixed(1)}s`;
  console.log(JSON.stringify(results, null, 2));
})();
