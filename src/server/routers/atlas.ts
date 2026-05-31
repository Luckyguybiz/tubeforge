/**
 * Atlas TRPC router — conversation + message reads.
 *
 * Writes happen in /api/atlas/chat (streaming endpoint). This router
 * is purely for the UI's hydration needs: list conversations,
 * fetch messages on drawer open, delete a conversation.
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const atlasRouter = router({
  /** List the current user's conversations, newest first. */
  listConversations: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
          archived: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conversations = await ctx.db.atlasConversation.findMany({
        where: {
          userId: ctx.session.user.id,
          archived: input?.archived ?? false,
        },
        orderBy: { updatedAt: 'desc' },
        take: input?.limit ?? 20,
        select: {
          id: true,
          title: true,
          archived: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { messages: true } },
        },
      });
      return { items: conversations };
    }),

  /** Fetch full message history for one conversation. */
  listMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const conv = await ctx.db.atlasConversation.findFirst({
        where: { id: input.conversationId, userId: ctx.session.user.id },
        select: { id: true, title: true, createdAt: true },
      });
      if (!conv) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }
      const messages = await ctx.db.atlasMessage.findMany({
        where: { conversationId: input.conversationId },
        orderBy: { createdAt: 'asc' },
        take: input.limit,
        select: {
          id: true,
          role: true,
          content: true,
          usage: true,
          createdAt: true,
        },
      });
      return { conversation: conv, items: messages };
    }),

  /** Soft-archive a conversation. */
  archiveConversation: protectedProcedure
    .input(z.object({ conversationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const conv = await ctx.db.atlasConversation.findFirst({
        where: { id: input.conversationId, userId: ctx.session.user.id },
      });
      if (!conv) throw new TRPCError({ code: 'NOT_FOUND' });
      await ctx.db.atlasConversation.update({
        where: { id: conv.id },
        data: { archived: true },
      });
      return { archived: true };
    }),

  /** Hard-delete a conversation + all its messages (cascade). */
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const conv = await ctx.db.atlasConversation.findFirst({
        where: { id: input.conversationId, userId: ctx.session.user.id },
      });
      if (!conv) throw new TRPCError({ code: 'NOT_FOUND' });
      await ctx.db.atlasConversation.delete({ where: { id: conv.id } });
      return { deleted: true };
    }),

  /** Current user's daily token usage — for the UI to show a budget bar. */
  todayUsage: protectedProcedure.query(async ({ ctx }) => {
    const today = todayUtcDate();
    const row = await ctx.db.atlasUsageDaily.findUnique({
      where: { userId_date: { userId: ctx.session.user.id, date: today } },
    });
    return {
      inputTokens: row?.inputTokens ?? 0,
      outputTokens: row?.outputTokens ?? 0,
      cacheReads: row?.cacheReads ?? 0,
    };
  }),
});

function todayUtcDate(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
