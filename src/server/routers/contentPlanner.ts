import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

/**
 * Content Planner tRPC Router
 *
 * Stores the content planner state (items, ideas) server-side
 * using a sentinel Project with title `__tf_content_planner__`.
 * This avoids Prisma schema changes while providing persistence
 * and team-level visibility.
 */

const PLANNER_PROJECT_TITLE = '__tf_content_planner__';

/** Rate limit: 30 reads per minute per user */
async function checkPlannerReadRate(userId: string) {
  const { success } = await rateLimit({ identifier: `planner-read:${userId}`, limit: 30, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/** Rate limit: 20 writes per minute per user */
async function checkPlannerWriteRate(userId: string) {
  const { success } = await rateLimit({ identifier: `planner-write:${userId}`, limit: 20, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/* ── Zod schemas for content planner data ──────────────────── */

const contentItemSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().max(200),
  description: z.string().max(5000),
  script: z.string().max(20000),
  platforms: z.array(z.enum(['YouTube', 'TikTok', 'Instagram', 'Twitter', 'Facebook'])).max(5),
  contentType: z.enum(['Video', 'Short', 'Post', 'Story', 'Reel']),
  scheduledDate: z.string().max(30).nullable(),
  status: z.enum(['Idea', 'Draft', 'Scheduled', 'Published']),
  tags: z.array(z.string().max(50)).max(20),
  notes: z.string().max(5000),
  thumbnailColor: z.string().max(20).nullable(),
  thumbnailUrl: z.string().max(2000).nullable().optional(),
  createdAt: z.string().max(30),
  updatedAt: z.string().max(30),
});

const ideaItemSchema = z.object({
  id: z.string().min(1).max(50),
  text: z.string().max(500),
  category: z.string().max(50),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  createdAt: z.string().max(30),
});

const plannerStateSchema = z.object({
  contentItems: z.array(contentItemSchema).max(500),
  ideas: z.array(ideaItemSchema).max(500),
});

export const contentPlannerRouter = router({
  /**
   * Get the current content planner state for the authenticated user.
   * Returns contentItems and ideas arrays.
   */
  getState: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    await checkPlannerReadRate(userId);

    const project = await ctx.db.project.findFirst({
      where: {
        userId,
        title: PLANNER_PROJECT_TITLE,
      },
      select: { thumbnailData: true, updatedAt: true },
    });

    if (!project?.thumbnailData) {
      return { contentItems: [], ideas: [], updatedAt: null };
    }

    const data = project.thumbnailData as Record<string, unknown>;
    return {
      contentItems: Array.isArray(data.contentItems) ? data.contentItems : [],
      ideas: Array.isArray(data.ideas) ? data.ideas : [],
      updatedAt: project.updatedAt.toISOString(),
    };
  }),

  /**
   * Save (upsert) the content planner state.
   * Creates or updates the sentinel project with the full state.
   */
  saveState: protectedProcedure
    .input(plannerStateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await checkPlannerWriteRate(userId);

      const existing = await ctx.db.project.findFirst({
        where: { userId, title: PLANNER_PROJECT_TITLE },
        select: { id: true },
      });

      const data = {
        contentItems: input.contentItems,
        ideas: input.ideas,
      };

      if (existing) {
        await ctx.db.project.update({
          where: { id: existing.id },
          data: { thumbnailData: data },
          select: { id: true },
        });
      } else {
        await ctx.db.project.create({
          data: {
            userId,
            title: PLANNER_PROJECT_TITLE,
            thumbnailData: data,
            status: 'DRAFT',
          },
          select: { id: true },
        });
      }

      return { ok: true };
    }),

  /**
   * Add a single content item (append to the existing state).
   * More efficient than saving the entire state for single additions.
   */
  addItem: protectedProcedure
    .input(contentItemSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await checkPlannerWriteRate(userId);

      const project = await ctx.db.project.findFirst({
        where: { userId, title: PLANNER_PROJECT_TITLE },
        select: { id: true, thumbnailData: true },
      });

      const current = (project?.thumbnailData as Record<string, unknown>) ?? {};
      const items = Array.isArray(current.contentItems) ? [...current.contentItems] : [];
      items.push(input);

      const data = { ...current, contentItems: items };

      if (project) {
        await ctx.db.project.update({
          where: { id: project.id },
          data: { thumbnailData: data },
          select: { id: true },
        });
      } else {
        await ctx.db.project.create({
          data: {
            userId,
            title: PLANNER_PROJECT_TITLE,
            thumbnailData: data,
            status: 'DRAFT',
          },
          select: { id: true },
        });
      }

      return { ok: true, id: input.id };
    }),

  /**
   * Update a single content item by ID.
   */
  updateItem: protectedProcedure
    .input(z.object({
      id: z.string().min(1).max(50),
      updates: contentItemSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await checkPlannerWriteRate(userId);

      const project = await ctx.db.project.findFirst({
        where: { userId, title: PLANNER_PROJECT_TITLE },
        select: { id: true, thumbnailData: true },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No planner state found' });
      }

      const current = (project.thumbnailData as Record<string, unknown>) ?? {};
      const items = Array.isArray(current.contentItems) ? [...current.contentItems] : [];
      const idx = items.findIndex((item: Record<string, unknown>) => item.id === input.id);

      if (idx === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Content item not found' });
      }

      items[idx] = { ...items[idx], ...input.updates, updatedAt: new Date().toISOString() };

      await ctx.db.project.update({
        where: { id: project.id },
        data: { thumbnailData: { ...current, contentItems: items } },
        select: { id: true },
      });

      return { ok: true };
    }),

  /**
   * Delete a single content item by ID.
   */
  deleteItem: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await checkPlannerWriteRate(userId);

      const project = await ctx.db.project.findFirst({
        where: { userId, title: PLANNER_PROJECT_TITLE },
        select: { id: true, thumbnailData: true },
      });

      if (!project) return { ok: true };

      const current = (project.thumbnailData as Record<string, unknown>) ?? {};
      const items = Array.isArray(current.contentItems) ? current.contentItems : [];
      const filtered = items.filter((item: Record<string, unknown>) => item.id !== input.id);

      await ctx.db.project.update({
        where: { id: project.id },
        data: { thumbnailData: { ...current, contentItems: filtered } },
        select: { id: true },
      });

      return { ok: true };
    }),

  /**
   * Get publish-ready summary: items with status 'Scheduled' that have a date.
   * Useful for dashboard/overview display.
   */
  getScheduled: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    await checkPlannerReadRate(userId);

    const project = await ctx.db.project.findFirst({
      where: { userId, title: PLANNER_PROJECT_TITLE },
      select: { thumbnailData: true },
    });

    if (!project?.thumbnailData) return { items: [] };

    const data = project.thumbnailData as Record<string, unknown>;
    const items = Array.isArray(data.contentItems) ? data.contentItems : [];

    const scheduled = items.filter((item: Record<string, unknown>) =>
      item.status === 'Scheduled' && item.scheduledDate,
    );

    return { items: scheduled };
  }),
});
