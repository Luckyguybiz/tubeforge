import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';
import type { Prisma } from '@prisma/client';

/** Mutation rate limit: 20 writes per minute per user */
async function checkMutationRate(userId: string) {
  const { success } = await rateLimit({ identifier: `project:${userId}`, limit: 20, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 25, STUDIO: Infinity };

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).optional(),
      sortBy: z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { search, status, sortBy = 'updatedAt', sortOrder = 'desc', page = 1, limit = 20 } = input ?? {};

      const where: Record<string, unknown> = { userId: ctx.session.user.id };
      if (search) {
        where.title = { contains: search, mode: 'insensitive' };
      }
      if (status) {
        where.status = status;
      }

      const [items, total] = await Promise.all([
        ctx.db.project.findMany({
          where,
          select: {
            id: true,
            title: true,
            status: true,
            thumbnailUrl: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { scenes: true } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.project.count({ where }),
      ]);

      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { scenes: { orderBy: { order: 'asc' } } },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      return project;
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { plan: true, _count: { select: { projects: true } } },
      });
      const limit = PLAN_LIMITS[user?.plan ?? 'FREE'];
      if ((user?._count.projects ?? 0) >= limit) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Достигнут лимит проектов. Обновите тарифный план.' });
      }
      return ctx.db.project.create({
        data: { title: stripTags(input.title ?? 'Без названия'), userId: ctx.session.user.id },
        select: { id: true, title: true, status: true, createdAt: true },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(100).optional(),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string()).max(30).optional(),
      status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).optional(),
      characters: z.array(z.object({
        id: z.string(),
        name: z.string().max(100),
        role: z.string().max(100),
        avatar: z.string().max(10),
        ck: z.string().max(20),
        desc: z.string().max(500),
      })).max(50).optional(),
      thumbnailData: z.record(z.string(), z.unknown()).optional(),
      thumbnailUrl: z.string().nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, characters, thumbnailData, ...rest } = input;
      // Sanitize text fields to prevent stored XSS
      if (rest.title) rest.title = stripTags(rest.title);
      if (rest.description) rest.description = stripTags(rest.description);
      if (rest.tags) rest.tags = rest.tags.map((t) => stripTags(t));
      const data: Prisma.ProjectUpdateInput = { ...rest };
      if (characters !== undefined) data.characters = characters as unknown as Prisma.InputJsonValue;
      if (thumbnailData !== undefined) data.thumbnailData = thumbnailData as unknown as Prisma.InputJsonValue;
      return ctx.db.project.update({
        where: { id, userId: ctx.session.user.id },
        data,
        select: { id: true, title: true, status: true, updatedAt: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);
      return ctx.db.project.delete({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
    }),
});
