/**
 * Atlas — tool execution dispatch.
 *
 * Maps the 7 tool names defined for Claude to actual data fetches via
 * the project's existing TRPC caller. By going through `createCaller`
 * rather than HTTP, we:
 *   - Reuse the same `protectedProcedure` guard that every other API
 *     route uses (defence-in-depth — even if the model hallucinates
 *     `userId` in args, the executor ignores it and reads from
 *     `ctx.session.user.id`).
 *   - Avoid network round-trips inside the tool loop (latency).
 *   - Get full TS types end-to-end.
 *
 * Errors:
 *   - `ToolError` thrown for expected problems (window too wide, no
 *     data) → caller wraps into `tool_result.is_error: true` so
 *     Claude self-recovers.
 *   - Anything else bubbles up → SSE `error` event.
 */

import type { Session } from 'next-auth';
import { db } from '@/server/db';
import { appRouter } from '@/server/routers/_app';
import { ToolError } from './tool-error';
import {
  computeHealthScore,
  aggregateHeatmap,
  isoDaysAgo,
} from './health-score';

export interface AtlasExecContext {
  userId: string;
  session: Session;
}

const MAX_HEATMAP_WINDOW_DAYS = 90;

/**
 * Dispatch a tool call by name. Throws `ToolError` on expected
 * failures; anything else bubbles to the API route which terminates
 * the stream.
 */
export async function executeAtlasTool(
  name: string,
  rawArgs: unknown,
  ctx: AtlasExecContext,
): Promise<unknown> {
  const args = (rawArgs ?? {}) as Record<string, unknown>;
  const caller = appRouter.createCaller({ db, session: ctx.session });

  switch (name) {
    case 'get_jobs': {
      const status = typeof args.status === 'string' ? args.status.toUpperCase() : undefined;
      const channelId = typeof args.channelId === 'string' ? args.channelId : undefined;
      const limit = clampInt(args.limit, 1, 50, 20);
      const cursor = typeof args.cursor === 'string' ? args.cursor : undefined;
      return await caller.uploadJobs.list({
        status: status as never,
        channelId,
        limit,
        cursor,
      });
    }

    case 'get_job': {
      const jobId = expectString(args.jobId, 'jobId');
      try {
        return await caller.uploadJobs.get({ jobId });
      } catch (e) {
        // If the user passed a bad ID, surface as ToolError so Claude
        // explains it gracefully.
        if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'NOT_FOUND') {
          throw new ToolError(`Job ${jobId} not found or doesn't belong to this user.`);
        }
        throw e;
      }
    }

    case 'get_channel': {
      return await caller.youtube.getChannels();
    }

    case 'get_heatmap': {
      const from = expectIsoDate(args.from, 'from');
      const to = expectIsoDate(args.to, 'to');
      if (new Date(from).getTime() > new Date(to).getTime()) {
        throw new ToolError('`from` must be <= `to`.');
      }
      const days =
        (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
      if (days > MAX_HEATMAP_WINDOW_DAYS) {
        throw new ToolError(
          `Date range exceeds ${MAX_HEATMAP_WINDOW_DAYS} days. Narrow the window.`,
        );
      }
      const channelId = typeof args.channelId === 'string' ? args.channelId : undefined;
      const result = await caller.uploadJobs.byMonth({
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
        channelId,
      });
      return { range: { from, to }, days: aggregateHeatmap(result.items) };
    }

    case 'get_health_score': {
      const channelId = typeof args.channelId === 'string' ? args.channelId : undefined;
      const from = isoDaysAgo(14);
      const to = isoDaysAgo(0);
      const result = await caller.uploadJobs.byMonth({ from, to, channelId });
      return computeHealthScore(result.items);
    }

    case 'get_webhooks_health': {
      const limit = clampInt(args.limit, 1, 50, 10);
      const webhookId = typeof args.webhookId === 'string' ? args.webhookId : undefined;
      if (webhookId) {
        return await caller.webhook.deliveries({ webhookId, limit });
      }
      // Aggregate path: fetch user's webhooks, sample recent deliveries each.
      const hooks = await caller.webhook.list();
      if (!hooks || hooks.length === 0) {
        return { webhooks: [], note: 'No webhooks registered.' };
      }
      const summaries = await Promise.all(
        hooks.map(async (h) => {
          const deliveries = await caller.webhook.deliveries({
            webhookId: h.id,
            limit: 5,
          });
          return {
            id: h.id,
            url: h.url,
            active: h.active,
            successRate: deliveries.stats?.successRate ?? null,
            recentFailures: deliveries.stats?.failed ?? 0,
          };
        }),
      );
      return { webhooks: summaries };
    }

    case 'search_user_video_titles': {
      const query = expectString(args.query, 'query').slice(0, 120);
      const limit = clampInt(args.limit, 1, 20, 10);
      const rows = await db.uploadJob.findMany({
        where: {
          userId: ctx.userId,
          title: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return { matches: rows };
    }

    default:
      throw new ToolError(`Unknown tool: ${name}`);
  }
}

/* ── tiny validators (Zod runs at the SDK boundary, these are
   belt-and-suspenders) ──────────────────────────────────────── */

function expectString(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new ToolError(`Missing or invalid \`${field}\` parameter.`);
  }
  return v;
}

function expectIsoDate(v: unknown, field: string): string {
  if (typeof v !== 'string') {
    throw new ToolError(`\`${field}\` must be a YYYY-MM-DD string.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}/.test(v)) {
    throw new ToolError(`\`${field}\` must be a YYYY-MM-DD string.`);
  }
  const t = Date.parse(v);
  if (Number.isNaN(t)) {
    throw new ToolError(`\`${field}\` is not a valid date.`);
  }
  return v;
}

function clampInt(v: unknown, min: number, max: number, def: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : def;
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
