import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';
import { Prisma } from '@prisma/client';

/** Mutation rate limit: 30 scene actions per minute per user */
async function checkSceneRate(userId: string) {
  const { success } = await rateLimit({ identifier: `scene:${userId}`, limit: 30, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/** Validated scene metadata — transformed to Prisma InputJsonValue after validation */
const sceneMetadataSchema = z.object({
  ck: z.string().optional(),
  sf: z.string().nullish(),
  ef: z.string().nullish(),
  enh: z.boolean().optional(),
  snd: z.boolean().optional(),
  chars: z.array(z.string()).optional(),
  transition: z.enum(['none', 'fade', 'slide', 'zoom']).optional(),
  voiceoverUrl: z.string().nullish(),
  voiceoverStatus: z.enum(['idle', 'generating', 'done', 'error']).optional(),
}).transform((v) => v as unknown as Prisma.InputJsonValue);

export const sceneRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        prompt: z.string().max(2000).default(''),
        label: z.string().max(100).default(''),
        model: z.enum(['turbo', 'standard', 'pro', 'cinematic']).default('standard'),
        duration: z.number().min(1).max(60).default(5),
        order: z.number().optional(),
        metadata: sceneMetadataSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkSceneRate(ctx.session.user.id);

      // Use interactive transaction to atomically check limit and create
      return ctx.db.$transaction(async (tx) => {
        const [project, user] = await Promise.all([
          tx.project.findFirst({
            where: { id: input.projectId, userId: ctx.session.user.id },
            select: { id: true, _count: { select: { scenes: true } } },
          }),
          tx.user.findUnique({
            where: { id: ctx.session.user.id },
            select: { plan: true },
          }),
        ]);
        if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Проект не найден' });

        const SCENE_LIMITS: Record<string, number> = { FREE: 10, PRO: 50, STUDIO: 200 };
        const maxScenes = SCENE_LIMITS[user?.plan ?? 'FREE'] ?? 10;
        if (project._count.scenes >= maxScenes) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Scene limit reached (${maxScenes}). Upgrade your plan for more scenes.`,
          });
        }

        const order = input.order ?? project._count.scenes;
        return tx.scene.create({
          data: {
            projectId: input.projectId,
            prompt: stripTags(input.prompt),
            label: stripTags(input.label),
            model: input.model,
            duration: input.duration,
            order,
            metadata: input.metadata ?? undefined,
          },
          select: { id: true, projectId: true, prompt: true, label: true, model: true, duration: true, order: true, status: true },
        });
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        prompt: z.string().max(2000).optional(),
        label: z.string().max(100).optional(),
        model: z.enum(['turbo', 'standard', 'pro', 'cinematic']).optional(),
        duration: z.number().min(1).max(60).optional(),
        status: z.enum(['EMPTY', 'EDITING', 'GENERATING', 'READY', 'ERROR']).optional(),
        videoUrl: z.string().url().nullish(),
        metadata: sceneMetadataSchema.optional(),
        taskId: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkSceneRate(ctx.session.user.id);
      const scene = await ctx.db.scene.findFirst({
        where: { id: input.id },
        select: { id: true, project: { select: { userId: true } } },
      });
      if (!scene || scene.project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const { id, ...data } = input;
      // Sanitize text fields
      if (data.prompt) data.prompt = stripTags(data.prompt);
      if (data.label) data.label = stripTags(data.label);
      return ctx.db.scene.update({ where: { id, project: { userId: ctx.session.user.id } }, data, select: { id: true, prompt: true, label: true, model: true, duration: true, order: true, status: true, videoUrl: true } });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkSceneRate(ctx.session.user.id);
      await ctx.db.$transaction(async (tx) => {
        const scene = await tx.scene.findFirst({
          where: { id: input.id, project: { userId: ctx.session.user.id } },
          select: { id: true },
        });
        if (!scene) throw new TRPCError({ code: 'NOT_FOUND', message: 'Сцена не найдена' });
        await tx.scene.delete({ where: { id: input.id } });
      });
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        sceneIds: z.array(z.string()).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkSceneRate(ctx.session.user.id);
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      // Verify all scene IDs belong to this project and all project scenes are included
      const [matchingCount, totalCount] = await Promise.all([
        ctx.db.scene.count({
          where: { id: { in: input.sceneIds }, projectId: project.id },
        }),
        ctx.db.scene.count({
          where: { projectId: project.id },
        }),
      ]);
      if (matchingCount !== input.sceneIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Некорректные ID сцен' });
      }
      if (totalCount !== input.sceneIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Необходимо указать все сцены проекта' });
      }

      // Single raw SQL batch update using CASE statement instead of N individual updates
      const cases = input.sceneIds.map((id, idx) =>
        Prisma.sql`WHEN id = ${id} THEN ${idx}`
      ).reduce((a, b) => Prisma.sql`${a} ${b}`);

      await ctx.db.$executeRaw`
        UPDATE "Scene" SET "order" = CASE ${cases} END
        WHERE id IN (${Prisma.join(input.sceneIds)})
        AND "projectId" = ${project.id}
      `;
      return { success: true };
    }),
});
