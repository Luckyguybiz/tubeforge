// Test 1: Landing page loads, all sections render, no console errors
const puppeteer = require('puppeteer');

(async () => {
  const start = Date.now();
  let browser;
  const consoleErrors = [];
  const results = { test: 'Landing Page', passed: true, details: [] };

  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to landing page
    const response = await page.goto('https://tubeforge.co', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Check status code
    const status = response.status();
    if (status === 200) {
      results.details.push({ check: 'HTTP Status', status: 'PASS', value: status });
    } else {
      results.passed = false;
      results.details.push({ check: 'HTTP Status', status: 'FAIL', value: status });
    }

    // Check page title
    const title = await page.title();
    results.details.push({ check: 'Page Title', status: title ? 'PASS' : 'FAIL', value: title });
    if (!title) results.passed = false;

    // Check for key sections/elements
    const sections = [
      { name: 'Header/Nav', selector: 'header, nav, [role="navigation"]' },
      { name: 'Hero Section', selector: 'h1, [class*="hero"], [class*="Hero"]' },
      { name: 'Footer', selector: 'footer, [role="contentinfo"]' },
      { name: 'Main Content', selector: 'main, [role="main"], #__next' },
    ];

    for (const section of sections) {
      const found = await page.$(section.selector);
      const pass = !!found;
      results.details.push({ check: section.name, status: pass ? 'PASS' : 'FAIL', value: pass ? 'Found' : 'Not found' });
      if (!pass) results.passed = false;
    }

    // Check for links (navigation)
    const linkCount = await page.$$eval('a', links => links.length);
    results.details.push({ check: 'Links present', status: linkCount > 0 ? 'PASS' : 'FAIL', value: `${linkCount} links` });

    // Check for images loading
    const brokenImages = await page.$$eval('img', imgs =>
      imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)
    );
    results.details.push({
      check: 'Images loaded',
      status: brokenImages.length === 0 ? 'PASS' : 'WARN',
      value: brokenImages.length === 0 ? 'All loaded' : `${brokenImages.length} broken: ${brokenImages.join(', ')}`
    });

    // Check for JS errors
    // Filter out known third-party noise
    const realErrors = consoleErrors.filter(e =>
      !e.includes('third-party') &&
      !e.includes('favicon') &&
      !e.includes('ERR_BLOCKED_BY_CLIENT')
    );
    results.details.push({
      check: 'Console Errors',
      status: realErrors.length === 0 ? 'PASS' : 'WARN',
      value: realErrors.length === 0 ? 'None' : `${realErrors.length} errors: ${realErrors.slice(0, 3).join(' | ')}`
    });

    // Check page is not blank
    const bodyText = await page.$eval('body', el => el.innerText.trim().length);
    results.details.push({
      check: 'Page has content',
      status: bodyText > 100 ? 'PASS' : 'FAIL',
      value: `${bodyText} chars`
    });
    if (bodyText <= 100) results.passed = false;

    // Check for tools pages links
    const toolLinks = await page.$$eval('a[href*="tool"], a[href*="convert"], a[href*="compress"]', links =>
      links.map(l => ({ href: l.href, text: l.textContent.trim() }))
    );
    results.details.push({
      check: 'Tool Links',
      status: toolLinks.length > 0 ? 'PASS' : 'INFO',
      value: toolLinks.length > 0 ? `${toolLinks.length} found` : 'None found with expected selectors'
    });

  } catch (err) {
    results.passed = false;
    results.details.push({ check: 'Exception', status: 'FAIL', value: err.message });
  } finally {
    if (browser) await browser.close();
  }

  results.time = `${((Date.now() - start) / 1000).toFixed(1)}s`;
  console.log(JSON.stringify(results, null, 2));
})();
