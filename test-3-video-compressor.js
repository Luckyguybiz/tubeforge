// Test 3: FFmpeg video compressor — create test video, compress as MP4 and WebM
// Uses the exact same Worker pattern as the production FFmpegClient
const puppeteer = require('puppeteer');

(async () => {
  const start = Date.now();
  let browser;
  const results = { test: 'Video Compressor (FFmpeg)', passed: true, details: [] };

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

    const formats = [
      { ext: 'mp4', args: ['-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', '64x64', '-r', '2', '-i', 'input.raw', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p', '-an', '-y', 'output.mp4'] },
      { ext: 'webm', args: ['-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', '64x64', '-r', '2', '-i', 'input.raw', '-c:v', 'libvpx', '-b:v', '200k', '-crf', '30', '-an', '-y', 'output.webm'] }
    ];

    for (const fmt of formats) {
      const fmtStart = Date.now();
      try {
        const result = await page.evaluate(async (outputExt, ffArgs) => {
          const CDNS = [
            window.location.origin + '/ffmpeg',
            'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
            'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd',
          ];

          // Create raw YUV420p video: 4 frames of 64x64
          const W = 64, H = 64, FRAMES = 4;
          const frameSize = W * H * 3 / 2;
          const rawVideo = new Uint8Array(frameSize * FRAMES);
          for (let f = 0; f < FRAMES; f++) {
            const offset = f * frameSize;
            for (let i = 0; i < W * H; i++) rawVideo[offset + i] = ((i % W) * 4 + f * 64) & 0xFF;
            for (let i = 0; i < W * H / 4; i++) rawVideo[offset + W * H + i] = 128;
            for (let i = 0; i < W * H / 4; i++) rawVideo[offset + W * H + W * H / 4 + i] = 128;
          }

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
          await send(worker, 'write', { path: 'input.raw', data: rawVideo });

          // Run FFmpeg
          const ret = await send(worker, 'exec', { args: ffArgs });

          // Read output
          const output = await send(worker, 'read', { path: 'output.' + outputExt });
          worker.terminate();

          return { success: true, outputSize: output.byteLength || output.length, returnCode: ret };
        }, fmt.ext, fmt.args);

        const elapsed = ((Date.now() - fmtStart) / 1000).toFixed(1);
        if (result.success) {
          results.details.push({
            check: `Raw -> ${fmt.ext.toUpperCase()}`,
            status: 'PASS',
            value: `Output ${result.outputSize} bytes, ret=${result.returnCode} (${elapsed}s)`
          });
        } else {
          results.passed = false;
          results.details.push({
            check: `Raw -> ${fmt.ext.toUpperCase()}`,
            status: 'FAIL',
            value: `${result.error} (${elapsed}s)`
          });
        }
      } catch (err) {
        const elapsed = ((Date.now() - fmtStart) / 1000).toFixed(1);
        results.passed = false;
        results.details.push({
          check: `Raw -> ${fmt.ext.toUpperCase()}`,
          status: 'FAIL',
          value: `${err.message} (${elapsed}s)`
        });
      }
    }

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
