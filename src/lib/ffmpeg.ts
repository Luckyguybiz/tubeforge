/**
 * Custom FFmpeg WASM wrapper — all CDN loading happens INSIDE a Web Worker.
 *
 * Architecture:
 * 1. Main thread creates a classic Worker from inline blob code
 * 2. Worker receives CDN base URL via postMessage
 * 3. Worker fetches ffmpeg-core.js and ffmpeg-core.wasm
 * 4. Worker loads JS via importScripts(blobURL) — CSP allows blob:
 * 5. Worker passes wasmBinary (ArrayBuffer) directly to createFFmpegCore
 *    so Emscripten never does its own fetch() (which fails under CSP)
 */

const CORE_CDNS = [
  'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd',
];

/* ── Worker inline code ── */
const WORKER_JS = /* js */ `
let ff = null;
var logLines = [];
var MAX_LOG_LINES = 200;

async function loadCore(baseURL) {
  // 1. Fetch JS, load via blob importScripts (bypasses CSP script-src for CDN)
  var jsResp = await fetch(baseURL + '/ffmpeg-core.js');
  if (!jsResp.ok) throw new Error('JS fetch ' + jsResp.status);
  var jsBlob = new Blob([await jsResp.arrayBuffer()], { type: 'text/javascript' });
  var jsBlobURL = URL.createObjectURL(jsBlob);
  importScripts(jsBlobURL);
  URL.revokeObjectURL(jsBlobURL);
  if (!self.createFFmpegCore) throw new Error('createFFmpegCore not found');

  // 2. Fetch WASM as ArrayBuffer
  var wasmResp = await fetch(baseURL + '/ffmpeg-core.wasm');
  if (!wasmResp.ok) throw new Error('WASM fetch ' + wasmResp.status);
  var wasmBinary = await wasmResp.arrayBuffer();

  // 3. Init Emscripten with wasmBinary — NO additional fetch needed
  ff = await self.createFFmpegCore({
    wasmBinary: wasmBinary,
    locateFile: function(path, scriptDir) {
      // Return proper CDN URL so Emscripten doesn't try to atob() the path.
      // wasmBinary is already provided so .wasm won't be re-fetched.
      if (path.endsWith('.wasm')) return baseURL + '/' + path;
      return (scriptDir || baseURL + '/') + path;
    }
  });

  ff.setLogger(function (d) {
    // Keep recent log lines for diagnostics on failure
    var msg = (d && d.message) ? d.message : String(d);
    logLines.push(msg);
    if (logLines.length > MAX_LOG_LINES) logLines.shift();
    self.postMessage({ t: 'log', d: d });
  });
  ff.setProgress(function (d) { self.postMessage({ t: 'progress', d: d }); });
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
        logLines = [];
        ff.setTimeout(p.timeout || -1);
        ff.exec.apply(ff, p.args);
        var ret = ff.ret;
        ff.reset();
        // Return both exit code and recent logs for diagnostics
        r = { ret: ret, logs: logLines.slice(-50) };
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

/* ── Public API ── */
export type ProgressCb = (p: { progress: number; time: number }) => void;

let msgId = 0;

export class FFmpegClient {
  private worker: Worker | null = null;
  private resolves: Record<number, (v: unknown) => void> = {};
  private rejects: Record<number, (e: Error) => void> = {};
  private progressCbs: ProgressCb[] = [];

  /** Load the FFmpeg WASM core. Tries multiple CDNs. */
  async load(): Promise<void> {
    const blob = new Blob([WORKER_JS], { type: 'text/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = ({ data }) => {
      if (data.t === 'progress') {
        this.progressCbs.forEach((cb) => cb(data.d));
        return;
      }
      if (data.t === 'log') return;
      const { id } = data;
      if (data.t === 'error') {
        this.rejects[id]?.(new Error(data.d));
      } else {
        this.resolves[id]?.(data.d);
      }
      delete this.resolves[id];
      delete this.rejects[id];
    };

    let lastErr: unknown;
    for (const baseURL of CORE_CDNS) {
      try {
        await this.send('load', { baseURL });
        return;
      } catch (e) {
        lastErr = e;
        console.warn(`FFmpeg CDN failed (${baseURL}):`, e);
      }
    }
    this.terminate();
    throw lastErr ?? new Error('All FFmpeg CDNs failed');
  }

  private send(t: string, p: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error('Worker not initialised'));
      const id = ++msgId;
      this.resolves[id] = resolve;
      this.rejects[id] = reject;
      const trans: Transferable[] = [];
      if (p.data instanceof Uint8Array) trans.push(p.data.buffer);
      this.worker.postMessage({ id, t, p }, trans);
    });
  }

  /** Run FFmpeg with the given args. Returns { ret, logs }. */
  async exec(args: string[]): Promise<{ ret: number; logs: string[] }> {
    const result = (await this.send('exec', { args })) as { ret: number; logs: string[] };
    return result;
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    await this.send('write', { path, data });
  }

  async readFile(path: string): Promise<Uint8Array> {
    return (await this.send('read', { path })) as Uint8Array;
  }

  async deleteFile(path: string): Promise<void> {
    await this.send('del', { path });
  }

  on(_event: 'progress', cb: ProgressCb): void {
    this.progressCbs.push(cb);
  }

  off(_event: 'progress', cb: ProgressCb): void {
    this.progressCbs = this.progressCbs.filter((c) => c !== cb);
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const id of Object.keys(this.rejects)) {
      this.rejects[Number(id)](new Error('Terminated'));
    }
    this.resolves = {};
    this.rejects = {};
  }
}

/** Read a File into a Uint8Array. */
export async function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
