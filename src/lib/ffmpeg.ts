/**
 * Custom FFmpeg WASM wrapper that bypasses @ffmpeg/ffmpeg's Worker creation.
 *
 * Why: The @ffmpeg/ffmpeg package uses `new Worker(new URL('./worker.js', import.meta.url))`
 * which conflicts with Next.js webpack bundling — either the worker chunk isn't emitted
 * correctly or dynamic imports inside the worker fail with "Cannot find module".
 *
 * This wrapper creates a classic Worker from inline blob code and loads the
 * @ffmpeg/core UMD build via `importScripts`, which is universally reliable.
 */

const CORE_CDNS = [
  'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd',
];

/* ── Worker inline code (classic worker, uses importScripts) ── */
const WORKER_JS = /* js */ `
let ff = null;

async function loadCore(coreURL, wasmURL) {
  importScripts(coreURL);
  if (!self.createFFmpegCore) throw new Error("createFFmpegCore not defined");
  ff = await self.createFFmpegCore({
    mainScriptUrlOrBlob: coreURL + "#" + btoa(JSON.stringify({ wasmURL, workerURL: "" })),
  });
  ff.setLogger(function (d) { self.postMessage({ t: "log", d: d }); });
  ff.setProgress(function (d) { self.postMessage({ t: "progress", d: d }); });
}

self.onmessage = async function (e) {
  var msg = e.data, id = msg.id, t = msg.t, p = msg.p;
  try {
    var r, tr = [];
    switch (t) {
      case "load":
        await loadCore(p.coreURL, p.wasmURL);
        r = true;
        break;
      case "exec":
        ff.setTimeout(p.timeout || -1);
        ff.exec.apply(ff, p.args);
        r = ff.ret;
        ff.reset();
        break;
      case "write":
        ff.FS.writeFile(p.path, p.data);
        r = true;
        break;
      case "read":
        r = ff.FS.readFile(p.path, { encoding: p.enc || "binary" });
        break;
      case "del":
        ff.FS.unlink(p.path);
        r = true;
        break;
    }
    if (r instanceof Uint8Array) tr.push(r.buffer);
    self.postMessage({ id: id, t: t, d: r }, tr);
  } catch (err) {
    self.postMessage({ id: id, t: "error", d: err.toString() });
  }
};
`;

/* ── Blob URL helper ── */
async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Fetch ${url}: ${resp.status}`);
  const buf = await resp.arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type: mimeType }));
}

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
    // Create worker from blob
    const blob = new Blob([WORKER_JS], { type: 'text/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = ({ data }) => {
      if (data.t === 'progress') {
        this.progressCbs.forEach((cb) => cb(data.d));
        return;
      }
      if (data.t === 'log') return; // ignore logs
      const { id } = data;
      if (data.t === 'error') {
        this.rejects[id]?.(new Error(data.d));
      } else {
        this.resolves[id]?.(data.d);
      }
      delete this.resolves[id];
      delete this.rejects[id];
    };

    // Try CDNs in order
    let lastErr: unknown;
    for (const base of CORE_CDNS) {
      try {
        const coreURL = await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm');
        await this.send('load', { coreURL, wasmURL });
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    this.terminate();
    throw lastErr ?? new Error('All CDNs failed');
  }

  private send(t: string, p: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error('Worker not ready'));
      const id = ++msgId;
      this.resolves[id] = resolve;
      this.rejects[id] = reject;
      const trans: Transferable[] = [];
      if (p.data instanceof Uint8Array) trans.push(p.data.buffer);
      this.worker.postMessage({ id, t, p }, trans);
    });
  }

  async exec(args: string[]): Promise<number> {
    return (await this.send('exec', { args })) as number;
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

/** Read a File into a Uint8Array (replaces @ffmpeg/util's fetchFile). */
export async function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
