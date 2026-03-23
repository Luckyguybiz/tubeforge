import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';

/** Rate limit: 20 comment actions per minute per user */
async function checkCommentRate(userId: string) {
  const { success } = await rateLimit({ identifier: `comment:${userId}`, limit: 20, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const commentRouter = router({
  /** Add a comment to a project (optionally tied to a scene) */
  add: protectedProcedure
    .input(z.object({
      projectId: z.string().min(1).max(100),
      text: z.string().min(1).max(2000),
      sceneId: z.string().min(1).max(100).nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkCommentRate(ctx.session.user.id);

      // Verify access to project
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id } } } },
          ],
        },
        select: { id: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      const comment = await ctx.db.comment.create({
        data: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          text: stripTags(input.text),
          sceneId: input.sceneId ?? null,
        },
        include: {
          user: { select: { name: true, image: true } },
        },
      });

      return {
        id: comment.id,
        projectId: comment.projectId,
        sceneId: comment.sceneId,
        userId: comment.userId,
        userName: comment.user.name ?? 'User',
        userImage: comment.user.image ?? null,
        text: comment.text,
        resolved: comment.resolved,
        createdAt: comment.createdAt.toISOString(),
      };
    }),

  /** List comments for a project */
  list: protectedProcedure
    .input(z.object({
      projectId: z.string().min(1).max(100),
      sceneId: z.string().min(1).max(100).nullish(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify access
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id } } } },
          ],
        },
        select: { id: true },
      });
      if (!project) return [];

      const where: { projectId: string; sceneId?: string } = { projectId: input.projectId };
      if (input.sceneId) {
        where.sceneId = input.sceneId;
      }

      const comments = await ctx.db.comment.findMany({
        where,
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      return comments.map((c) => ({
        id: c.id,
        projectId: c.projectId,
        sceneId: c.sceneId,
        userId: c.userId,
        userName: c.user.name ?? 'User',
        userImage: c.user.image ?? null,
        text: c.text,
        resolved: c.resolved,
        createdAt: c.createdAt.toISOString(),
      }));
    }),

  /** Resolve (or unresolve) a comment */
  resolve: protectedProcedure
    .input(z.object({
      projectId: z.string().min(1).max(100),
      commentId: z.string().min(1).max(100),
      resolved: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkCommentRate(ctx.session.user.id);

      // Verify access to project
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id } } } },
          ],
        },
        select: { id: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      const comment = await ctx.db.comment.findFirst({
        where: { id: input.commentId, projectId: input.projectId },
      });
      if (!comment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });

      const updated = await ctx.db.comment.update({
        where: { id: input.commentId },
        data: { resolved: input.resolved },
        include: {
          user: { select: { name: true, image: true } },
        },
      });

      return {
        id: updated.id,
        projectId: updated.projectId,
        sceneId: updated.sceneId,
        userId: updated.userId,
        userName: updated.user.name ?? 'User',
        userImage: updated.user.image ?? null,
        text: updated.text,
        resolved: updated.resolved,
        createdAt: updated.createdAt.toISOString(),
      };
    }),

  /** Delete a comment (author or project owner only) */
  delete: protectedProcedure
    .input(z.object({
      projectId: z.string().min(1).max(100),
      commentId: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkCommentRate(ctx.session.user.id);

      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id } } } },
          ],
        },
        select: { id: true, userId: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      const comment = await ctx.db.comment.findFirst({
        where: { id: input.commentId, projectId: input.projectId },
      });
      if (!comment) throw new TRPCError({ code: 'NOT_FOUND' });

      // Only author or project owner can delete
      if (comment.userId !== ctx.session.user.id && project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.comment.delete({ where: { id: input.commentId } });
      return { success: true };
    }),
});
