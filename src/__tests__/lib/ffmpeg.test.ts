import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* ── Mock Worker ──────────────────────────────────────────────── */

type MessageHandler = ((evt: { data: unknown }) => void) | null;

// Mutable handler that tests can override before calling load()
let postMessageHandler: (msg: { id: number; t: string; p?: Record<string, unknown> }, onmessage: MessageHandler) => void;
let workerTerminateFn: ReturnType<typeof vi.fn<() => void>>;
let lastWorkerOnMessage: MessageHandler = null;
let postMessageCallCount = 0;

function defaultPostMessageHandler(
  msg: { id: number; t: string },
  onmessage: MessageHandler,
) {
  setTimeout(() => {
    if (!onmessage) return;
    const { id, t } = msg;
    if (t === 'load') onmessage({ data: { id, t, d: true } });
    else if (t === 'exec') onmessage({ data: { id, t, d: { ret: 0, logs: [] } } });
    else if (t === 'write') onmessage({ data: { id, t, d: true } });
    else if (t === 'read') onmessage({ data: { id, t, d: new Uint8Array([1, 2, 3]) } });
    else if (t === 'del') onmessage({ data: { id, t, d: true } });
  }, 0);
}

class MockWorker {
  onmessage: MessageHandler = null;

  constructor() {
    workerTerminateFn = vi.fn();
    lastWorkerOnMessage = (evt) => this.onmessage?.(evt);
  }

  postMessage = (msg: unknown) => {
    postMessageCallCount++;
    const typedMsg = msg as { id: number; t: string; p?: Record<string, unknown> };
    postMessageHandler(typedMsg, this.onmessage);
  };

  terminate = () => workerTerminateFn();
}

// Preserve the original URL constructor, just add mock static methods
const OriginalURL = globalThis.URL;
vi.stubGlobal('URL', class extends OriginalURL {
  static createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  static revokeObjectURL = vi.fn();
});

vi.stubGlobal('Worker', MockWorker);

/* ── Import after mocks ───────────────────────────────────────── */

const { FFmpegClient, readFileAsUint8Array } = await import('@/lib/ffmpeg');

describe('FFmpegClient', () => {
  let client: InstanceType<typeof FFmpegClient>;

  beforeEach(() => {
    postMessageHandler = defaultPostMessageHandler;
    postMessageCallCount = 0;
    client = new FFmpegClient();
  });

  afterEach(() => {
    client.terminate();
  });

  describe('load', () => {
    it('creates a Worker and sends a load message', async () => {
      let receivedBaseURL = '';
      postMessageHandler = (msg, onmessage) => {
        if (msg.t === 'load') {
          receivedBaseURL = (msg.p?.baseURL as string) ?? '';
        }
        defaultPostMessageHandler(msg, onmessage);
      };

      await client.load();
      expect(receivedBaseURL).toContain('unpkg');
      expect(postMessageCallCount).toBe(1);
    });

    it('falls back to second CDN when first fails', async () => {
      let callNum = 0;
      postMessageHandler = (msg, onmessage) => {
        callNum++;
        setTimeout(() => {
          if (!onmessage) return;
          if (callNum === 1) {
            // First CDN fails
            onmessage({ data: { id: msg.id, t: 'error', d: 'CDN failed' } });
          } else {
            // Second CDN succeeds
            onmessage({ data: { id: msg.id, t: 'load', d: true } });
          }
        }, 0);
      };

      await client.load();
      expect(postMessageCallCount).toBe(2);
    });

    it('throws when all CDNs fail', async () => {
      postMessageHandler = (msg, onmessage) => {
        setTimeout(() => {
          onmessage?.({ data: { id: msg.id, t: 'error', d: 'All CDNs failed' } });
        }, 0);
      };

      await expect(client.load()).rejects.toThrow('All CDNs failed');
    });
  });

  describe('exec', () => {
    it('sends exec command to worker and returns return code', async () => {
      let receivedArgs: unknown = null;
      const origHandler = defaultPostMessageHandler;
      postMessageHandler = (msg, onmessage) => {
        if (msg.t === 'exec') {
          receivedArgs = msg.p?.args;
        }
        origHandler(msg, onmessage);
      };

      await client.load();
      const result = await client.exec(['-i', 'input.mp4', 'output.mp3']);
      expect(receivedArgs).toEqual(['-i', 'input.mp4', 'output.mp3']);
      expect(result).toEqual({ ret: 0, logs: [] });
    });
  });

  describe('writeFile', () => {
    it('sends write command with file data', async () => {
      let receivedPath = '';
      postMessageHandler = (msg, onmessage) => {
        if (msg.t === 'write') {
          receivedPath = msg.p?.path as string;
        }
        defaultPostMessageHandler(msg, onmessage);
      };

      await client.load();
      const data = new Uint8Array([10, 20, 30]);
      await client.writeFile('/input.mp4', data);
      expect(receivedPath).toBe('/input.mp4');
    });
  });

  describe('readFile', () => {
    it('sends read command and returns Uint8Array', async () => {
      let receivedPath = '';
      postMessageHandler = (msg, onmessage) => {
        if (msg.t === 'read') {
          receivedPath = msg.p?.path as string;
        }
        defaultPostMessageHandler(msg, onmessage);
      };

      await client.load();
      const result = await client.readFile('/output.mp3');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(receivedPath).toBe('/output.mp3');
    });
  });

  describe('deleteFile', () => {
    it('sends del command', async () => {
      let receivedPath = '';
      postMessageHandler = (msg, onmessage) => {
        if (msg.t === 'del') {
          receivedPath = msg.p?.path as string;
        }
        defaultPostMessageHandler(msg, onmessage);
      };

      await client.load();
      await client.deleteFile('/temp.txt');
      expect(receivedPath).toBe('/temp.txt');
    });
  });

  describe('progress callbacks', () => {
    it('registers and calls progress callbacks', async () => {
      const cb = vi.fn();
      client.on('progress', cb);

      await client.load();

      // Simulate a progress message from worker
      lastWorkerOnMessage?.({ data: { t: 'progress', d: { progress: 0.5, time: 100 } } });
      expect(cb).toHaveBeenCalledWith({ progress: 0.5, time: 100 });
    });

    it('removes progress callbacks with off()', async () => {
      const cb = vi.fn();
      client.on('progress', cb);
      client.off('progress', cb);

      await client.load();
      lastWorkerOnMessage?.({ data: { t: 'progress', d: { progress: 0.5, time: 100 } } });
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('terminate', () => {
    it('terminates the worker', async () => {
      await client.load();
      client.terminate();
      expect(workerTerminateFn).toHaveBeenCalled();
    });

    it('rejects pending promises with Terminated error', async () => {
      await client.load();

      // Make the next messages not auto-resolve
      postMessageHandler = () => {
        // Do nothing — don't resolve
      };

      const promise = client.exec(['-h']);
      client.terminate();
      await expect(promise).rejects.toThrow('Terminated');
    });

    it('can be called multiple times without error', async () => {
      await client.load();
      client.terminate();
      expect(() => client.terminate()).not.toThrow();
    });
  });

  describe('send without worker', () => {
    it('rejects when worker is not initialized', async () => {
      // Don't call load — worker is null
      await expect(client.exec(['-h'])).rejects.toThrow('Worker not initialised');
    });
  });
});

describe('readFileAsUint8Array', () => {
  it('converts a File to Uint8Array', async () => {
    const blob = new Blob(['hello world'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });
    const result = await readFileAsUint8Array(file);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(11); // "hello world" = 11 bytes
  });
});
