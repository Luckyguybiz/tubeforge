// Test 2: FFmpeg audio converter — create test WAV, convert to MP3, AAC, OGG, WAV
// Uses the exact same Worker pattern as the production FFmpegClient
const puppeteer = require('puppeteer');

(async () => {
  const start = Date.now();
  let browser;
  const results = { test: 'Audio Converter (FFmpeg)', passed: true, details: [] };

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-web-security']
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(180000);

    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => consoleLogs.push(`[pageerror] ${err.message}`));

    await page.goto('https://tubeforge.co', { waitUntil: 'networkidle2', timeout: 30000 });

    const formats = ['mp3', 'aac', 'ogg', 'wav'];

    for (const fmt of formats) {
      const fmtStart = Date.now();
      try {
        const result = await page.evaluate(async (outputFormat) => {
          // Use the site's own self-hosted FFmpeg files
          const CDNS = [
            window.location.origin + '/ffmpeg',
            'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd',
            'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd',
          ];

          // Create a 1-second 440Hz WAV (mono, 16-bit, 8000Hz)
          const sampleRate = 8000;
          const duration = 1;
          const numSamples = sampleRate * duration;
          const buffer = new ArrayBuffer(44 + numSamples * 2);
          const view = new DataView(buffer);
          const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
          writeStr(0, 'RIFF');
          view.setUint32(4, 36 + numSamples * 2, true);
          writeStr(8, 'WAVE');
          writeStr(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * 2, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          writeStr(36, 'data');
          view.setUint32(40, numSamples * 2, true);
          for (let i = 0; i < numSamples; i++) {
            view.setInt16(44 + i * 2, Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0x7FFF * 0.5, true);
          }
          const wavData = new Uint8Array(buffer);

          // The exact same worker code from production ffmpeg.ts
          const WORKER_JS = `
let ff = null;

async function loadCore(baseURL) {
  var jsResp = await fetch(baseURL + '/ffmpeg-core.js');
  if (!jsResp.ok) throw new Error('JS fetch ' + jsResp.status);
  var jsBlob = new Blob([await jsResp.arrayBuffer()], { type: 'text/javascript' });
  var jsBlobURL = URL.createObjectURL(jsBlob);
  importScripts(jsBlobURL);
  URL.revokeObjectURL(jsBlobURL);
  if (!self.createFFmpegCore) throw new Error('createFFmpegCore not found');

  var wasmResp = await fetch(baseURL + '/ffmpeg-core.wasm');
  if (!wasmResp.ok) throw new Error('WASM fetch ' + wasmResp.status);
  var wasmBinary = await wasmResp.arrayBuffer();

  ff = await self.createFFmpegCore({
    wasmBinary: wasmBinary,
    locateFile: function(path, scriptDir) {
      if (path.endsWith('.wasm')) return baseURL + '/' + path;
      return (scriptDir || baseURL + '/') + path;
    }
  });
}

self.onmessage = async function (e) {
  var msg = e.data, id = msg.id, t = msg.t, p = msg.p;
  try {
    var r, tr = [];
    switch (t) {
      case 'load':
        await loadCore(p.baseURL);
        r = true;
        break;
      case 'exec':
        ff.setTimeout(p.timeout || -1);
        ff.exec.apply(ff, p.args);
        r = ff.ret;
        ff.reset();
        break;
      case 'write':
        ff.FS.writeFile(p.path, p.data);
        r = true;
        break;
      case 'read':
        r = ff.FS.readFile(p.path, { encoding: p.enc || 'binary' });
        break;
      case 'del':
        ff.FS.unlink(p.path);
        r = true;
        break;
    }
    if (r instanceof Uint8Array) tr.push(r.buffer);
    self.postMessage({ id: id, t: t, d: r }, tr);
  } catch (err) {
    self.postMessage({ id: id, t: 'error', d: err.toString() });
  }
};
`;

          // Helper to send messages to the worker
          let msgId = 0;
          const resolves = {};
          const rejects = {};

          function send(worker, t, p) {
            return new Promise((resolve, reject) => {
              const id = ++msgId;
              resolves[id] = resolve;
              rejects[id] = reject;
              const trans = [];
              if (p.data instanceof Uint8Array) trans.push(p.data.buffer);
              worker.postMessage({ id, t, p }, trans);
            });
          }

          const blob = new Blob([WORKER_JS], { type: 'text/javascript' });
          const worker = new Worker(URL.createObjectURL(blob));

          worker.onmessage = ({ data }) => {
            if (data.t === 'progress' || data.t === 'log') return;
            const { id } = data;
            if (data.t === 'error') {
              (rejects[id] || (() => {}))(new Error(data.d));
            } else {
              (resolves[id] || (() => {}))(data.d);
            }
            delete resolves[id];
            delete rejects[id];
          };

          // Try each CDN
          let loadErr = null;
          for (const cdn of CDNS) {
            try {
              await send(worker, 'load', { baseURL: cdn });
              loadErr = null;
              break;
            } catch (e) {
              loadErr = e;
            }
          }
          if (loadErr) {
            worker.terminate();
            return { success: false, error: 'All CDNs failed: ' + loadErr.message };
          }

          // Write input file
          await send(worker, 'write', { path: 'input.wav', data: wavData });

          // Determine FFmpeg args
          let ffArgs;
          switch (outputFormat) {
            case 'mp3': ffArgs = ['-i', 'input.wav', '-c:a', 'libmp3lame', '-b:a', '64k', 'output.' + outputFormat]; break;
            case 'aac': ffArgs = ['-i', 'input.wav', '-c:a', 'aac', '-b:a', '64k', 'output.' + outputFormat]; break;
            case 'ogg': ffArgs = ['-i', 'input.wav', '-c:a', 'libvorbis', '-b:a', '64k', 'output.' + outputFormat]; break;
            case 'wav': ffArgs = ['-i', 'input.wav', '-c:a', 'pcm_s16le', 'output.' + outputFormat]; break;
          }

          // Run FFmpeg
          const ret = await send(worker, 'exec', { args: ffArgs });

          // Read output
          const output = await send(worker, 'read', { path: 'output.' + outputFormat });
          worker.terminate();

          return { success: true, outputSize: output.byteLength || output.length, returnCode: ret };
        }, fmt);

        const elapsed = ((Date.now() - fmtStart) / 1000).toFixed(1);
        if (result.success) {
          results.details.push({
            check: `WAV -> ${fmt.toUpperCase()}`,
            status: 'PASS',
            value: `Output ${result.outputSize} bytes, ret=${result.returnCode} (${elapsed}s)`
          });
        } else {
          results.passed = false;
          results.details.push({
            check: `WAV -> ${fmt.toUpperCase()}`,
            status: 'FAIL',
            value: `${result.error} (${elapsed}s)`
          });
        }
      } catch (err) {
        const elapsed = ((Date.now() - fmtStart) / 1000).toFixed(1);
        results.passed = false;
        results.details.push({
          check: `WAV -> ${fmt.toUpperCase()}`,
          status: 'FAIL',
          value: `${err.message} (${elapsed}s)`
        });
      }
    }

    // Log any console errors for debugging
    const errors = consoleLogs.filter(l => l.startsWith('[error]') || l.startsWith('[pageerror]'));
    if (errors.length > 0) {
      results.details.push({
        check: 'Console errors during test',
        status: 'INFO',
        value: errors.slice(0, 3).join(' | ')
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
