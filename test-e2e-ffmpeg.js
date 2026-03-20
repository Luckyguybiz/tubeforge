/**
 * test-e2e-ffmpeg.js — FFmpeg WASM Loading & Encoding Tests
 * Tests that FFmpeg WASM can be loaded and basic encoding works in-browser.
 * Uses page.addScriptTag() to avoid CSP eval restrictions.
 */
const puppeteer = require('puppeteer');

const BASE_URL = 'https://tubeforge.co';

const FFMPEG_JS_URL = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js';
const UTIL_JS_URL = 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js';
const CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js';
const WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm';

async function runTests() {
  const results = {
    suite: 'e2e-ffmpeg',
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-web-security',
        '--enable-features=SharedArrayBuffer',
        '--enable-wasm-threads'
      ]
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(120000);

    // ---- Test 1: Check if FFmpeg WASM core JS can be fetched from CDN (unpkg) ----
    {
      const testName = 'FFmpeg core.js fetchable from unpkg CDN';
      try {
        // Use a blank page to avoid CSP restrictions for fetch tests
        await page.goto('about:blank');
        const result = await page.evaluate(async () => {
          try {
            const resp = await fetch('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', { method: 'HEAD' });
            return { ok: resp.ok, status: resp.status };
          } catch (e) {
            return { ok: false, error: e.message };
          }
        });
        results.tests.push({
          name: testName,
          passed: result.ok,
          detail: result.ok ? `Status ${result.status}` : `Failed: ${result.error || result.status}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 2: Check if FFmpeg WASM core JS can be fetched from jsdelivr CDN ----
    {
      const testName = 'FFmpeg core.js fetchable from jsdelivr CDN';
      try {
        const result = await page.evaluate(async () => {
          try {
            const resp = await fetch('https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', { method: 'HEAD' });
            return { ok: resp.ok, status: resp.status };
          } catch (e) {
            return { ok: false, error: e.message };
          }
        });
        results.tests.push({
          name: testName,
          passed: result.ok,
          detail: result.ok ? `Status ${result.status}` : `Failed: ${result.error || result.status}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 3: Check if FFmpeg WASM binary can be fetched ----
    {
      const testName = 'FFmpeg WASM binary fetchable from CDN';
      try {
        const result = await page.evaluate(async () => {
          try {
            const resp = await fetch('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', { method: 'HEAD' });
            return { ok: resp.ok, status: resp.status, size: resp.headers.get('content-length') };
          } catch (e) {
            return { ok: false, error: e.message };
          }
        });
        results.tests.push({
          name: testName,
          passed: result.ok,
          detail: result.ok ? `Status ${result.status}, size=${result.size}` : `Failed: ${result.error || result.status}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 4: Load FFmpeg via script tags (avoids CSP eval restriction) ----
    {
      const testName = 'FFmpeg WASM loads successfully via CDN script tags';
      try {
        // Navigate to a blank page where there's no CSP
        await page.goto('about:blank');

        // Inject both UMD scripts via script tags
        await page.addScriptTag({ url: FFMPEG_JS_URL });
        await page.addScriptTag({ url: UTIL_JS_URL });

        // Verify globals exist
        const globalsOk = await page.evaluate(() => {
          return {
            hasFFmpegWASM: typeof FFmpegWASM !== 'undefined',
            hasFFmpegUtil: typeof FFmpegUtil !== 'undefined',
          };
        });

        if (!globalsOk.hasFFmpegWASM || !globalsOk.hasFFmpegUtil) {
          results.tests.push({
            name: testName,
            passed: false,
            detail: `Globals missing: FFmpegWASM=${globalsOk.hasFFmpegWASM}, FFmpegUtil=${globalsOk.hasFFmpegUtil}`
          });
        } else {
          // Now load the WASM core
          const result = await page.evaluate(async (coreURL, wasmURL) => {
            return new Promise(async (resolve) => {
              const timeout = setTimeout(() => resolve({ loaded: false, error: 'Timeout after 60s' }), 60000);
              try {
                const { FFmpeg } = FFmpegWASM;
                const ffmpeg = new FFmpeg();
                await ffmpeg.load({ coreURL, wasmURL });
                clearTimeout(timeout);
                resolve({ loaded: true });
              } catch (e) {
                clearTimeout(timeout);
                resolve({ loaded: false, error: e.message });
              }
            });
          }, CORE_URL, WASM_URL);

          results.tests.push({
            name: testName,
            passed: result.loaded,
            detail: result.loaded ? 'FFmpeg WASM loaded successfully' : `Failed: ${result.error}`
          });
        }
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 5: Write a test file and verify FS operations ----
    {
      const testName = 'FFmpeg can write input file and list FS';
      try {
        // Ensure we're on blank page with scripts loaded
        const hasGlobals = await page.evaluate(() => typeof FFmpegWASM !== 'undefined');
        if (!hasGlobals) {
          await page.goto('about:blank');
          await page.addScriptTag({ url: FFMPEG_JS_URL });
          await page.addScriptTag({ url: UTIL_JS_URL });
        }

        const result = await page.evaluate(async (coreURL, wasmURL) => {
          return new Promise(async (resolve) => {
            const timeout = setTimeout(() => resolve({ success: false, error: 'Timeout after 90s' }), 90000);
            try {
              const { FFmpeg } = FFmpegWASM;
              const ffmpeg = new FFmpeg();
              await ffmpeg.load({ coreURL, wasmURL });

              // Create a minimal valid WAV file (1 second, 8000Hz mono 16-bit PCM, 440Hz sine)
              const sampleRate = 8000;
              const numSamples = sampleRate;
              const dataSize = numSamples * 2;
              const buffer = new ArrayBuffer(44 + dataSize);
              const view = new DataView(buffer);
              const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
              ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
              ws(8, 'WAVE'); ws(12, 'fmt ');
              view.setUint32(16, 16, true); view.setUint16(20, 1, true);
              view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
              view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
              view.setUint16(34, 16, true); ws(36, 'data');
              view.setUint32(40, dataSize, true);
              for (let i = 0; i < numSamples; i++) {
                const value = Math.floor(Math.sin(2 * Math.PI * 440 * i / sampleRate) * 16000);
                view.setInt16(44 + i * 2, value, true);
              }

              await ffmpeg.writeFile('input.wav', new Uint8Array(buffer));
              const files = await ffmpeg.listDir('/');
              const hasInput = files.some(f => f.name === 'input.wav');

              clearTimeout(timeout);
              resolve({ success: hasInput, files: files.map(f => f.name) });
            } catch (e) {
              clearTimeout(timeout);
              resolve({ success: false, error: e.message });
            }
          });
        }, CORE_URL, WASM_URL);

        results.tests.push({
          name: testName,
          passed: result.success,
          detail: result.success ? `Files in FS: ${result.files.join(', ')}` : `Failed: ${result.error}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 6: Run FFmpeg MP4 encoding (WAV to MP4 with AAC) ----
    {
      const testName = 'FFmpeg encodes WAV to MP4 (AAC audio, tests MP4 muxer)';
      try {
        const hasGlobals = await page.evaluate(() => typeof FFmpegWASM !== 'undefined');
        if (!hasGlobals) {
          await page.goto('about:blank');
          await page.addScriptTag({ url: FFMPEG_JS_URL });
          await page.addScriptTag({ url: UTIL_JS_URL });
        }

        const result = await page.evaluate(async (coreURL, wasmURL) => {
          return new Promise(async (resolve) => {
            const timeout = setTimeout(() => resolve({ success: false, error: 'Timeout after 90s' }), 90000);
            try {
              const { FFmpeg } = FFmpegWASM;
              const ffmpeg = new FFmpeg();
              await ffmpeg.load({ coreURL, wasmURL });

              // Create WAV with sine wave
              const sampleRate = 8000;
              const numSamples = sampleRate;
              const dataSize = numSamples * 2;
              const buffer = new ArrayBuffer(44 + dataSize);
              const view = new DataView(buffer);
              const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
              ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
              ws(8, 'WAVE'); ws(12, 'fmt ');
              view.setUint32(16, 16, true); view.setUint16(20, 1, true);
              view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
              view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
              view.setUint16(34, 16, true); ws(36, 'data');
              view.setUint32(40, dataSize, true);
              for (let i = 0; i < numSamples; i++) {
                view.setInt16(44 + i * 2, Math.floor(Math.sin(2 * Math.PI * 440 * i / sampleRate) * 16000), true);
              }

              await ffmpeg.writeFile('test_mp4.wav', new Uint8Array(buffer));
              await ffmpeg.exec(['-i', 'test_mp4.wav', '-c:a', 'aac', '-b:a', '64k', 'output.mp4']);

              const outputData = await ffmpeg.readFile('output.mp4');
              const outputSize = outputData.length;

              clearTimeout(timeout);
              resolve({ success: outputSize > 0, outputSize });
            } catch (e) {
              clearTimeout(timeout);
              resolve({ success: false, error: e.message });
            }
          });
        }, CORE_URL, WASM_URL);

        results.tests.push({
          name: testName,
          passed: result.success,
          detail: result.success ? `Output size: ${result.outputSize} bytes` : `Failed: ${result.error}`
        });
      } catch (err) {
        results.tests.push({ name: testName, passed: false, detail: err.message });
      }
    }

    // ---- Test 7: Run FFmpeg WebM encoding ----
    {
      const testName = 'FFmpeg encodes WAV to WebM (tests WebM muxer)';
      try {
        const hasGlobals = await page.evaluate(() => typeof FFmpegWASM !== 'undefined');
        if (!hasGlobals) {
          await page.goto('about:blank');
          await page.addScriptTag({ url: FFMPEG_JS_URL });
          await page.addScriptTag({ url: UTIL_JS_URL });
        }

        const result = await page.evaluate(async (coreURL, wasmURL) => {
          return new Promise(async (resolve) => {
            const timeout = setTimeout(() => resolve({ success: false, error: 'Timeout after 90s' }), 90000);
            try {
              const { FFmpeg } = FFmpegWASM;
              const ffmpeg = new FFmpeg();
              await ffmpeg.load({ coreURL, wasmURL });

              // Create WAV
              const sampleRate = 8000;
              const numSamples = sampleRate;
              const dataSize = numSamples * 2;
              const buffer = new ArrayBuffer(44 + dataSize);
              const view = new DataView(buffer);
              const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
              ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
              ws(8, 'WAVE'); ws(12, 'fmt ');
              view.setUint32(16, 16, true); view.setUint16(20, 1, true);
              view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
              view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
              view.setUint16(34, 16, true); ws(36, 'data');
              view.setUint32(40, dataSize, true);
              for (let i = 0; i < numSamples; i++) {
                view.setInt16(44 + i * 2, Math.floor(Math.sin(2 * Math.PI * 440 * i / sampleRate) * 16000), true);
              }

              await ffmpeg.writeFile('test_webm.wav', new Uint8Array(buffer));

              // Try libopus first, then libvorbis as fallback
              let outputSize = 0;
              let codec = 'libopus';
              try {
                await ffmpeg.exec(['-i', 'test_webm.wav', '-c:a', 'libopus', '-b:a', '32k', 'output.webm']);
                const data = await ffmpeg.readFile('output.webm');
                outputSize = data.length;
              } catch (e1) {
                codec = 'libvorbis';
                try {
                  await ffmpeg.exec(['-i', 'test_webm.wav', '-c:a', 'libvorbis', '-b:a', '32k', 'output_vorbis.webm']);
                  const data = await ffmpeg.readFile('output_vorbis.webm');
                  outputSize = data.length;
                } catch (e2) {
                  clearTimeout(timeout);
                  return resolve({ success: false, error: `libopus: ${e1.message}, libvorbis: ${e2.message}` });
                }
              }

              clearTimeout(timeout);
              resolve({ success: outputSize > 0, outputSize, codec });
            } catch (e) {
              clearTimeout(timeout);
              resolve({ success: false, error: e.message });
            }
          });
        }, CORE_URL, WASM_URL);

        results.tests.push({
          name: testName,
          passed: result.success,
          detail: result.success ? `Output: ${result.outputSize} bytes (codec: ${result.codec})` : `Failed: ${result.error}`
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
  console.error(JSON.stringify({ suite: 'e2e-ffmpeg', error: err.message }));
  process.exit(1);
});
