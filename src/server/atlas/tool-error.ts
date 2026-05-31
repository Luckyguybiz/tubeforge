/**
 * Errors thrown by Atlas tool executors. Caught by the API route and
 * fed back to Claude as `tool_result.is_error: true` so the model can
 * apologize/recover conversationally.
 *
 * Distinguishes "expected" tool problems (range too large, no data,
 * not found) from "unexpected" errors (DB down, TRPC throws). Only
 * the former should round-trip to Claude; the latter should bubble up
 * and end the stream with an `error` event.
 */

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}
