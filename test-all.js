#!/usr/bin/env node
// Comprehensive E2E test runner — runs all test scripts in sequence,
// collects results, and produces a unified summary report.

const { execFile } = require('child_process');
const path = require('path');

const TESTS = [
  { file: 'test-1-landing.js',          label: 'Landing Page' },
  { file: 'test-2-audio-converter.js',  label: 'Audio Converter (FFmpeg)' },
  { file: 'test-3-video-compressor.js', label: 'Video Compressor (FFmpeg)' },
  { file: 'test-4-security-headers.js', label: 'Security Headers' },
  { file: 'test-5-api-routes.js',       label: 'API Routes' },
  { file: 'test-6-static-assets.js',    label: 'Static Assets' },
  { file: 'test-7-tools-ui.js',         label: 'Tools UI Pages' },
];

// Maximum time per individual test (5 minutes)
const PER_TEST_TIMEOUT_MS = 5 * 60 * 1000;

function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, testFile);
    const startMs = Date.now();

    const child = execFile(
      process.execPath,
      [testPath],
      { timeout: PER_TEST_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

        // Try to parse JSON output from stdout
        let result = null;
        if (stdout) {
          // The test may print debug info before the JSON; find last JSON object
          const lines = stdout.trim().split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{')) {
              try {
                // Try to parse from this line to end
                const jsonStr = lines.slice(i).join('\n');
                result = JSON.parse(jsonStr);
                break;
              } catch (_) {
                // Not valid JSON at this line, keep looking
              }
            }
          }
        }

        if (error && !result) {
          // Test crashed or timed out
          resolve({
            test: testFile,
            passed: false,
            details: [{
              check: 'Execution',
              status: 'FAIL',
              value: error.killed
                ? `Timed out after ${PER_TEST_TIMEOUT_MS / 1000}s`
                : `Exit code ${error.code}: ${(error.message || '').substring(0, 200)}`,
            }],
            time: `${elapsed}s`,
            stderr: stderr ? stderr.substring(0, 500) : undefined,
          });
        } else if (result) {
          resolve(result);
        } else {
          // No parseable output
          resolve({
            test: testFile,
            passed: false,
            details: [{
              check: 'Output',
              status: 'FAIL',
              value: `No JSON output. stdout: ${(stdout || '').substring(0, 200)}`,
            }],
            time: `${elapsed}s`,
          });
        }
      }
    );
  });
}

function statusIcon(status) {
  switch (status) {
    case 'PASS': return '[PASS]';
    case 'FAIL': return '[FAIL]';
    case 'WARN': return '[WARN]';
    case 'INFO': return '[INFO]';
    default:     return '[????]';
  }
}

(async () => {
  const totalStart = Date.now();

  console.log('='.repeat(72));
  console.log('  TubeForge E2E Test Suite');
  console.log('  Target: https://tubeforge-omega.vercel.app');
  console.log('  Date:   ' + new Date().toISOString());
  console.log('='.repeat(72));
  console.log('');

  const allResults = [];
  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;
  let totalChecks = 0;

  for (const test of TESTS) {
    console.log(`--- Running: ${test.label} (${test.file}) ---`);
    const result = await runTest(test.file);
    allResults.push({ ...result, file: test.file, label: test.label });

    // Print individual test results
    const suitePassed = result.passed;
    console.log(`  Result: ${suitePassed ? '[PASS]' : '[FAIL]'}  Time: ${result.time || 'N/A'}`);

    if (result.details && result.details.length > 0) {
      for (const d of result.details) {
        console.log(`    ${statusIcon(d.status)}  ${d.check}: ${d.value}`);
        totalChecks++;
        if (d.status === 'PASS') totalPass++;
        else if (d.status === 'FAIL') totalFail++;
        else if (d.status === 'WARN') totalWarn++;
      }
    }
    console.log('');
  }

  const totalTime = ((Date.now() - totalStart) / 1000).toFixed(1);
  const suitesPass = allResults.filter(r => r.passed).length;
  const suitesFail = allResults.filter(r => !r.passed).length;
  const allPassed = suitesFail === 0;

  // Print summary
  console.log('='.repeat(72));
  console.log('  SUMMARY');
  console.log('='.repeat(72));
  console.log('');
  console.log(`  Test Suites:  ${suitesPass} passed, ${suitesFail} failed, ${allResults.length} total`);
  console.log(`  Checks:       ${totalPass} passed, ${totalFail} failed, ${totalWarn} warnings, ${totalChecks} total`);
  console.log(`  Total Time:   ${totalTime}s`);
  console.log('');

  if (suitesFail > 0) {
    console.log('  Failed suites:');
    for (const r of allResults) {
      if (!r.passed) {
        console.log(`    [FAIL]  ${r.label || r.test}`);
        const failures = (r.details || []).filter(d => d.status === 'FAIL');
        for (const f of failures) {
          console.log(`            - ${f.check}: ${f.value}`);
        }
      }
    }
    console.log('');
  }

  console.log(`  Overall: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
  console.log('='.repeat(72));

  // Also output machine-readable JSON summary to stderr for programmatic use
  const summary = {
    passed: allPassed,
    suites: { passed: suitesPass, failed: suitesFail, total: allResults.length },
    checks: { passed: totalPass, failed: totalFail, warnings: totalWarn, total: totalChecks },
    totalTime: `${totalTime}s`,
    results: allResults,
  };
  process.stderr.write('\n' + JSON.stringify(summary, null, 2) + '\n');

  process.exit(allPassed ? 0 : 1);
})();
