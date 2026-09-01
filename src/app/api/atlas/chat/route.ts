/**
 * POST /api/atlas/chat — Server-Sent Events streaming chat endpoint.
 *
 * Flow:
 *   1. Authenticate via NextAuth.
 *   2. Validate body (zod).
 *   3. Rate-limit per user (messages/hour) + token budget (input/day).
 *   4. Load conversation history from Prisma (last 20 messages).
 *   5. Iterate the tool loop. Each iteration:
 *      a) Stream text deltas from Anthropic.
 *      b) On tool_use stop, emit tool_use_start/end events and run
 *         executor in parallel.
 *      c) Feed tool_results back and continue.
 *   6. On done: persist assistant message + token usage.
 *
 * v1 simplification: text streaming uses the SDK's MessageStream helper
 * which exposes incremental text via the `text` event. We buffer those
 * into a queue that the outer async generator drains.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';
import {
  ATLAS_MODEL,
  AtlasConfigError,
  getAnthropicClient,
  getLimitsForPlan,
} from '@/server/atlas/anthropic-client';
import { getSystemPromptBlocks } from '@/server/atlas/system-prompt';
import { ATLAS_TOOLS } from '@/server/atlas/tools';
import { executeAtlasTool } from '@/server/atlas/executor';
import { ToolError } from '@/server/atlas/tool-error';
import {
  createSSEStream,
  SSE_HEADERS,
  type AtlasStreamEvent,
} from '@/server/atlas/sse';
import type Anthropic from '@anthropic-ai/sdk';
import type { Session } from 'next-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const BodySchema = z.object({
  conversationId: z.string().min(1).max(60),
  message: z.string().min(1).max(4000),
  context: z.object({ route: z.string().max(200).optional() }).partial().optional(),
});

const MAX_ITERATIONS = 8;
const HISTORY_LIMIT = 20;
const MAX_TOKENS_PER_TURN = 1500;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError(401, 'UNAUTHORIZED', 'Sign in to chat with Atlas.');
  }
  const userId = session.user.id;

  let parsed: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    parsed = BodySchema.parse(raw);
  } catch (e) {
    return jsonError(400, 'BAD_REQUEST', 'Invalid request body.', {
      issues: e instanceof z.ZodError ? e.issues : undefined,
    });
  }

  const limits = getLimitsForPlan((session.user as { plan?: string }).plan);

  // Rate limit — messages per hour
  const msgRate = await rateLimit({
    identifier: `atlas:msg:${userId}`,
    limit: limits.messagesPerHour,
    window: 3600,
  });
  if (!msgRate.success) {
    return jsonError(429, 'RATE_LIMITED', 'Atlas message rate limit reached.', {
      resetAt: msgRate.reset,
    });
  }

  // Token budget — input tokens per day
  const today = todayUtcDate();
  const usage = await db.atlasUsageDaily.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if ((usage?.inputTokens ?? 0) >= limits.tokensPerDay) {
    return jsonError(429, 'TOKEN_BUDGET', 'Daily Atlas budget used up.', {
      resetAt: tomorrowUtcMs(),
    });
  }

  // Anthropic client
  let client: ReturnType<typeof getAnthropicClient>;
  try {
    client = getAnthropicClient();
  } catch (e) {
    if (e instanceof AtlasConfigError) {
      return jsonError(503, 'SERVICE_UNAVAILABLE', e.message);
    }
    throw e;
  }

  // Conversation + user message persistence
  const conversation = await db.atlasConversation.upsert({
    where: { id: parsed.conversationId },
    update: { updatedAt: new Date() },
    create: {
      id: parsed.conversationId,
      userId,
      title: parsed.message.slice(0, 60),
    },
  });
  if (conversation.userId !== userId) {
    return jsonError(403, 'FORBIDDEN', 'Conversation belongs to another user.');
  }

  const userMessage = await db.atlasMessage.create({
    data: {
      conversationId: conversation.id,
      userId,
      role: 'user',
      content: [{ type: 'text', text: parsed.message }],
    },
  });

  // Build context — last 20 messages (newest first → reverse for chrono)
  const history = await db.atlasMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
    select: { role: true, content: true },
  });
  const historyAsc = history.reverse();

  const anthropicMessages: Anthropic.MessageParam[] = historyAsc.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content as Anthropic.MessageParam['content'],
  }));

  // Run the streaming tool loop
  const stream = createSSEStream(
    runAtlasTurn({
      client,
      userId,
      session,
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      messages: anthropicMessages,
    }),
  );

  return new Response(stream, { headers: SSE_HEADERS });
}

/* ════════════════════════════════════════════════════════════════════
   Tool-loop generator
   ════════════════════════════════════════════════════════════════════ */

async function* runAtlasTurn(opts: {
  client: ReturnType<typeof getAnthropicClient>;
  userId: string;
  session: Session;
  conversationId: string;
  userMessageId: string;
  messages: Anthropic.MessageParam[];
}): AsyncGenerator<AtlasStreamEvent, void, unknown> {
  const assistantMessageId = generatedId();
  yield {
    type: 'meta',
    data: {
      conversationId: opts.conversationId,
      userMessageId: opts.userMessageId,
      assistantMessageId,
    },
  };

  let messages = [...opts.messages];
  const finalAssistantContent: Anthropic.ContentBlock[] = [];
  const usageAccum = { input: 0, output: 0, cache_read: 0, cache_write: 0 };
  let stopReason: string | null = null;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Use streaming API to emit text deltas live. The stream helper
    // exposes `.on('text', cb)` and a final `.finalMessage()`.
    const stream = opts.client.messages.stream({
      model: ATLAS_MODEL,
      max_tokens: MAX_TOKENS_PER_TURN,
      system: getSystemPromptBlocks(),
      tools: ATLAS_TOOLS,
      messages,
    });

    // Buffer deltas as they arrive; the outer generator drains them
    // periodically between awaits.
    const deltaQueue: string[] = [];
    let streamFinished = false;
    let streamError: unknown = null;

    stream.on('text', (delta: string) => {
      deltaQueue.push(delta);
    });
    stream.on('error', (err: unknown) => {
      streamError = err;
    });
    stream.on('end', () => {
      streamFinished = true;
    });

    // Pump deltas to client until the stream ends.
    while (!streamFinished && !streamError) {
      if (deltaQueue.length > 0) {
        const delta = deltaQueue.shift()!;
        yield { type: 'text_delta', data: { delta } };
      } else {
        // Yield to event loop so the stream's text events fire.
        await new Promise((r) => setTimeout(r, 25));
      }
    }
    // Drain any remaining deltas
    while (deltaQueue.length > 0) {
      yield { type: 'text_delta', data: { delta: deltaQueue.shift()! } };
    }

    if (streamError) {
      const message = streamError instanceof Error ? streamError.message : String(streamError);
      yield {
        type: 'error',
        data: { code: 'STREAM_ERROR', message, retriable: true },
      };
      return;
    }

    const finalMessage = await stream.finalMessage();

    // Track usage
    if (finalMessage.usage) {
      usageAccum.input += finalMessage.usage.input_tokens || 0;
      usageAccum.output += finalMessage.usage.output_tokens || 0;
      usageAccum.cache_read +=
        (finalMessage.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens || 0;
      usageAccum.cache_write +=
        (finalMessage.usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens || 0;
      yield { type: 'usage', data: { ...usageAccum } };
    }

    // Capture content for persistence
    for (const block of finalMessage.content) {
      finalAssistantContent.push(block as Anthropic.ContentBlock);
    }

    stopReason = finalMessage.stop_reason;
    if (stopReason !== 'tool_use') break;

    // Run tool_use blocks
    const toolUseBlocks = finalMessage.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUseBlocks) {
      yield {
        type: 'tool_use_start',
        data: { id: tu.id, name: tu.name, args: tu.input },
      };
      const t0 = Date.now();
      try {
        const result = await executeAtlasTool(tu.name, tu.input, {
          userId: opts.userId,
          session: opts.session,
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: [{ type: 'text', text: JSON.stringify(result) }],
        });
        yield {
          type: 'tool_use_end',
          data: { id: tu.id, ok: true, durationMs: Date.now() - t0 },
        };
      } catch (e) {
        const isExpected = e instanceof ToolError;
        const message = e instanceof Error ? e.message : String(e);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          is_error: true,
          content: [{ type: 'text', text: message }],
        });
        yield {
          type: 'tool_use_end',
          data: { id: tu.id, ok: false, durationMs: Date.now() - t0, error: message },
        };
        if (!isExpected) {
          // Unexpected — still feed back to Claude but log + signal
          // a retriable failure to the client.
          yield {
            type: 'error',
            data: { code: 'TOOL_ERROR', message, retriable: false },
          };
        }
      }
    }

    // Feed assistant turn + tool results into next iteration
    messages = [
      ...messages,
      { role: 'assistant', content: finalMessage.content as never },
      { role: 'user', content: toolResults },
    ];
  }

  // Persist assistant turn + usage
  try {
    await db.atlasMessage.create({
      data: {
        id: assistantMessageId,
        conversationId: opts.conversationId,
        userId: opts.userId,
        role: 'assistant',
        content: finalAssistantContent as never,
        usage: usageAccum,
      },
    });
    await db.atlasUsageDaily.upsert({
      where: { userId_date: { userId: opts.userId, date: todayUtcDate() } },
      update: {
        inputTokens: { increment: usageAccum.input },
        outputTokens: { increment: usageAccum.output },
        cacheReads: { increment: usageAccum.cache_read },
      },
      create: {
        userId: opts.userId,
        date: todayUtcDate(),
        inputTokens: usageAccum.input,
        outputTokens: usageAccum.output,
        cacheReads: usageAccum.cache_read,
      },
    });
  } catch {
    // Persistence failure shouldn't block the stream's `done` event.
  }

  yield {
    type: 'done',
    data: { stopReason, totalUsage: usageAccum },
  };
}

/* ── helpers ──────────────────────────────────────────────────── */

function jsonError(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: { code, message, ...extra } },
    { status },
  );
}

function todayUtcDate(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function tomorrowUtcMs(): number {
  return todayUtcDate().getTime() + 24 * 3600_000;
}

function generatedId(): string {
  // Client-friendly assistant message id. Persistence uses this same
  // id so the client's optimistic state and server state line up.
  return (
    'atlas_' +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 9)
  );
}
