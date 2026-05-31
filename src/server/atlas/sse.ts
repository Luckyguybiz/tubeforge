/**
 * Minimal SSE helpers for the Atlas chat endpoint.
 *
 * We do NOT use Vercel's `streamingTextResponse` / `OpenAIStream`
 * helpers because they're tailored to OpenAI's chunk format. Atlas
 * streams a discriminated-union of event types (text_delta,
 * tool_use_start, tool_use_end, usage, done, error), each with its
 * own data shape. A small custom encoder handles this clean.
 */

export type AtlasStreamEventType =
  | 'meta'
  | 'text_delta'
  | 'tool_use_start'
  | 'tool_use_end'
  | 'usage'
  | 'done'
  | 'error';

export interface AtlasStreamEvent<T = unknown> {
  type: AtlasStreamEventType;
  data: T;
}

/** Encode a single SSE frame to a UTF-8 Uint8Array. */
export function encodeEvent(type: AtlasStreamEventType, data: unknown): Uint8Array {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

/**
 * Wrap an async generator of AtlasStreamEvent into a ReadableStream
 * suitable for `new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })`.
 */
export function createSSEStream(
  generator: AsyncGenerator<AtlasStreamEvent, void, unknown>,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const evt of generator) {
          controller.enqueue(encodeEvent(evt.type, evt.data));
        }
      } catch (err) {
        // Surface unhandled errors as a final 'error' event so the
        // client knows the stream died with a reason.
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encodeEvent('error', { code: 'STREAM_ERROR', message, retriable: false }),
        );
      } finally {
        controller.close();
      }
    },
  });
}

export const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no', // disable nginx buffering — critical for live streaming
  Connection: 'keep-alive',
};
