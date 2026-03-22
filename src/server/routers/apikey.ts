import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';
import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  getApiUsage,
} from '@/lib/api-keys';

/** Mutation rate limit: 10 per minute per user */
async function checkRate(userId: string) {
  const { success } = await rateLimit({ identifier: `apikey:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const apikeyRouter = router({
  /** Generate a new API key. Only for STUDIO plan users. */
  generate: protectedProcedure
    .input(z.object({ label: z.string().max(50).optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkRate(ctx.session.user.id);

      // Check plan - only STUDIO users get API access
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { plan: true },
      });
      if (user?.plan !== 'STUDIO') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'API access is available on the Studio plan only.',
        });
      }

      // Limit: max 5 keys per user
      const existing = await listApiKeys(ctx.session.user.id);
      if (existing.length >= 5) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Maximum 5 API keys allowed. Revoke an existing key first.',
        });
      }

      const label = stripTags(input.label ?? 'Default');
      const { fullKey, entry } = await generateApiKey(ctx.session.user.id, label);

      return {
        /** Full key - shown only once */
        key: fullKey,
        id: entry.id,
        last4: entry.last4,
        label: entry.label,
        createdAt: entry.createdAt,
      };
    }),

  /** List all API keys for the current user (last 4 chars only). */
  list: protectedProcedure.query(async ({ ctx }) => {
    return listApiKeys(ctx.session.user.id);
  }),

  /** Revoke an API key by id. */
  revoke: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkRate(ctx.session.user.id);
      const ok = await revokeApiKey(ctx.session.user.id, input.id);
      if (!ok) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'API key not found.' });
      }
      return { success: true };
    }),

  /** Get API usage count for the current month. */
  usage: protectedProcedure.query(async ({ ctx }) => {
    return { count: await getApiUsage(ctx.session.user.id), month: new Date().toISOString().slice(0, 7) };
  }),
});
