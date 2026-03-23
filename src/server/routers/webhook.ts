import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { sanitizeUrl, stripTags } from '@/lib/sanitize';
import { randomBytes, createHmac } from 'crypto';
import { createLogger } from '@/lib/logger';
import { db } from '@/server/db';

const log = createLogger('webhook');

export const WEBHOOK_EVENTS = ['video.completed', 'project.created'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Delivery timeout in milliseconds */
const DELIVERY_TIMEOUT_MS = 5_000;

/** Number of retries on delivery failure */
const MAX_RETRIES = 1;

/** Mutation rate limit */
async function checkRate(userId: string) {
  const { success } = await rateLimit({ identifier: `webhook:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/**
 * Sign a webhook payload with HMAC-SHA256.
 */
export function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Deliver a single webhook POST to one endpoint with retry logic.
 * Returns true on success, false on failure.
 */
async function deliverToEndpoint(
  url: string,
  secret: string,
  event: string,
  body: string,
): Promise<boolean> {
  const signature = signPayload(secret, body);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-TubeForge-Event': event,
    'X-TubeForge-Signature': `sha256=${signature}`,
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });

      if (res.ok) {
        return true;
      }

      log.warn('Webhook delivery non-OK response', {
        url,
        event,
        status: res.status,
        attempt: attempt + 1,
      });
    } catch (err) {
      log.warn('Webhook delivery failed', {
        url,
        event,
        attempt: attempt + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return false;
}

/**
 * Deliver a webhook event to all active endpoints registered by a user for the given event type.
 *
 * Queries all active WebhookEndpoint records matching the user and event,
 * POSTs the payload to each URL with HMAC-SHA256 signature,
 * retries once on failure, and logs success/failure for each endpoint.
 *
 * Runs in the background (fire-and-forget) so it does not block the caller.
 */
export function deliverWebhooks(userId: string, event: WebhookEvent, payload: Record<string, unknown>): void {
  // Fire-and-forget — errors are logged but never thrown to the caller
  void deliverWebhooksAsync(userId, event, payload);
}

async function deliverWebhooksAsync(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const endpoints = await db.webhookEndpoint.findMany({
      where: {
        userId,
        active: true,
        events: { has: event },
      },
      select: { id: true, url: true, secret: true },
    });

    if (endpoints.length === 0) {
      return;
    }

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const results = await Promise.allSettled(
      endpoints.map(async (ep) => {
        const ok = await deliverToEndpoint(ep.url, ep.secret, event, body);
        if (ok) {
          log.info('Webhook delivered', { endpointId: ep.id, event, url: ep.url });
        } else {
          log.error('Webhook delivery failed after retries', { endpointId: ep.id, event, url: ep.url });
        }
        return { endpointId: ep.id, ok };
      }),
    );

    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && r.value.ok,
    ).length;
    log.info('Webhook delivery batch complete', {
      event,
      userId,
      total: endpoints.length,
      succeeded,
      failed: endpoints.length - succeeded,
    });
  } catch (err) {
    log.error('Webhook delivery query error', {
      event,
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export const webhookRouter = router({
  /** Register a new webhook endpoint. */
  register: protectedProcedure
    .input(z.object({
      url: z.string().url().max(2000),
      events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).max(WEBHOOK_EVENTS.length),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRate(ctx.session.user.id);

      // Check plan - only STUDIO users get webhook access
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { plan: true },
      });
      if (user?.plan !== 'STUDIO') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Webhooks are available on the Studio plan only.',
        });
      }

      // Validate URL
      const url = sanitizeUrl(input.url);
      if (!url) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid URL. Only https:// URLs are allowed.' });
      }

      // Limit: max 10 webhooks per user
      const existingCount = await ctx.db.webhookEndpoint.count({
        where: { userId: ctx.session.user.id },
      });
      if (existingCount >= 10) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Maximum 10 webhooks allowed. Delete an existing webhook first.',
        });
      }

      const secret = `whsec_${randomBytes(24).toString('hex')}`;

      const entry = await ctx.db.webhookEndpoint.create({
        data: {
          userId: ctx.session.user.id,
          url: stripTags(url),
          events: input.events,
          secret,
          active: true,
        },
        select: {
          id: true,
          url: true,
          events: true,
          secret: true,
          active: true,
          createdAt: true,
        },
      });

      return {
        id: entry.id,
        url: entry.url,
        events: entry.events,
        /** Secret - shown only once at registration */
        secret: entry.secret,
        active: entry.active,
        createdAt: entry.createdAt,
      };
    }),

  /** List all webhooks for the current user. Secrets are NOT returned. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const webhooks = await ctx.db.webhookEndpoint.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks;
  }),

  /** Delete a webhook by id. */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkRate(ctx.session.user.id);

      const entry = await ctx.db.webhookEndpoint.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!entry) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found.' });
      }

      await ctx.db.webhookEndpoint.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
