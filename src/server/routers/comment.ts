import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';

/**
 * In-memory comment store.
 *
 * Since there is no Comment model in Prisma, we store comments in-memory.
 * This is suitable for a single-server deployment and provides a working
 * commenting system that degrades gracefully on restart (comments reset).
 *
 * A persistent DB-backed version can be added later by creating a Comment model.
 */

interface Comment {
  id: string;
  projectId: string;
  sceneId: string | null;
  userId: string;
  userName: string;
  userImage: string | null;
  text: string;
  resolved: boolean;
  createdAt: string;
}

/** In-memory store keyed by projectId */
const commentStore = new Map<string, Comment[]>();
let commentIdCounter = 1;

function getProjectComments(projectId: string): Comment[] {
  return commentStore.get(projectId) ?? [];
}

/** Rate limit: 20 comment actions per minute per user */
async function checkCommentRate(userId: string) {
  const { success } = await rateLimit({ identifier: `comment:${userId}`, limit: 20, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const commentRouter = router({
  /** Add a comment to a project (optionally tied to a scene) */
  add: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      text: z.string().min(1).max(2000),
      sceneId: z.string().nullish(),
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

      const comment: Comment = {
        id: `cmt_${Date.now()}_${commentIdCounter++}`,
        projectId: input.projectId,
        sceneId: input.sceneId ?? null,
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? 'User',
        userImage: ctx.session.user.image ?? null,
        text: stripTags(input.text),
        resolved: false,
        createdAt: new Date().toISOString(),
      };

      const existing = commentStore.get(input.projectId) ?? [];
      // Keep max 100 comments per project
      if (existing.length >= 100) {
        existing.shift();
      }
      existing.push(comment);
      commentStore.set(input.projectId, existing);

      return comment;
    }),

  /** List comments for a project */
  list: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      sceneId: z.string().nullish(),
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

      let comments = getProjectComments(input.projectId);
      if (input.sceneId) {
        comments = comments.filter((c) => c.sceneId === input.sceneId);
      }
      return comments;
    }),

  /** Resolve (or unresolve) a comment */
  resolve: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      commentId: z.string(),
      resolved: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkCommentRate(ctx.session.user.id);

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
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      const comments = getProjectComments(input.projectId);
      const comment = comments.find((c) => c.id === input.commentId);
      if (!comment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });

      comment.resolved = input.resolved;
      return comment;
    }),

  /** Delete a comment (author or project owner only) */
  delete: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      commentId: z.string(),
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

      const comments = getProjectComments(input.projectId);
      const idx = comments.findIndex((c) => c.id === input.commentId);
      if (idx === -1) throw new TRPCError({ code: 'NOT_FOUND' });

      const comment = comments[idx];
      // Only author or project owner can delete
      if (comment.userId !== ctx.session.user.id && project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      comments.splice(idx, 1);
      return { success: true };
    }),
});
