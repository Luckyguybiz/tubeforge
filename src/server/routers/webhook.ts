import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { sanitizeUrl, stripTags } from '@/lib/sanitize';
import { randomBytes, createHmac } from 'crypto';

/* ── In-memory webhook store ─────────────────────────
 * No Webhook model in Prisma yet, so we store in memory.
 * Production upgrade: add Webhook model and persist to DB.
 */

export const WEBHOOK_EVENTS = ['video.completed', 'project.created'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookEntry {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: Date;
}

/** Map from webhook id -> WebhookEntry */
const webhookStore = new Map<string, WebhookEntry>();

/** Map from userId -> Set of webhook ids */
const userWebhooks = new Map<string, Set<string>>();

/** Mutation rate limit */
async function checkRate(userId: string) {
  const { success } = await rateLimit({ identifier: `webhook:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/**
 * Sign a webhook payload with HMAC-SHA256.
 * This is used when delivering webhooks (future implementation).
 */
export function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
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

      // Check plan — only STUDIO users get webhook access
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
      const existing = userWebhooks.get(ctx.session.user.id);
      if (existing && existing.size >= 10) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Maximum 10 webhooks allowed. Delete an existing webhook first.',
        });
      }

      const id = randomBytes(12).toString('hex');
      const secret = `whsec_${randomBytes(24).toString('hex')}`;

      const entry: WebhookEntry = {
        id,
        userId: ctx.session.user.id,
        url: stripTags(url),
        events: input.events,
        secret,
        active: true,
        createdAt: new Date(),
      };

      webhookStore.set(id, entry);
      if (!userWebhooks.has(ctx.session.user.id)) {
        userWebhooks.set(ctx.session.user.id, new Set());
      }
      userWebhooks.get(ctx.session.user.id)!.add(id);

      return {
        id: entry.id,
        url: entry.url,
        events: entry.events,
        /** Secret — shown only once at registration */
        secret: entry.secret,
        active: entry.active,
        createdAt: entry.createdAt,
      };
    }),

  /** List all webhooks for the current user. Secrets are NOT returned. */
  list: protectedProcedure.query(({ ctx }) => {
    const ids = userWebhooks.get(ctx.session.user.id);
    if (!ids) return [];
    const result: Array<Omit<WebhookEntry, 'secret' | 'userId'>> = [];
    for (const id of ids) {
      const entry = webhookStore.get(id);
      if (entry) {
        const { secret: _s, userId: _u, ...rest } = entry;
        result.push(rest);
      }
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }),

  /** Delete a webhook by id. */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkRate(ctx.session.user.id);
      const entry = webhookStore.get(input.id);
      if (!entry || entry.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Webhook not found.' });
      }
      webhookStore.delete(input.id);
      userWebhooks.get(ctx.session.user.id)?.delete(input.id);
      return { success: true };
    }),
});
