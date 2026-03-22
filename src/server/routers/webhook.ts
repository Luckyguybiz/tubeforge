import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { sanitizeUrl, stripTags } from '@/lib/sanitize';
import { randomBytes, createHmac } from 'crypto';

export const WEBHOOK_EVENTS = ['video.completed', 'project.created'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Mutation rate limit */
async function checkRate(userId: string) {
  const { success } = await rateLimit({ identifier: `webhook:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/**
 * Sign a webhook payload with HMAC-SHA256.
 * Used by deliverWebhook() in src/lib/webhook-delivery.ts.
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
    .input(z.object({ id: z.string() }))
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
