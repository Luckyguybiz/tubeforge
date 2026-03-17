import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { API_ENDPOINTS } from '@/lib/constants';
import { env } from '@/lib/env';

export const videoTaskRouter = router({
  checkStatus: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify the requesting user owns the scene associated with this taskId
      const scene = await ctx.db.scene.findFirst({
        where: { taskId: input.taskId },
        include: { project: { select: { userId: true } } },
      });
      if (!scene || scene.project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Нет доступа к этой задаче' });
      }

      const res = await fetch(`${API_ENDPOINTS.RUNWAY_TASKS}/${input.taskId}`, {
        headers: {
          Authorization: `Bearer ${env.RUNWAY_API_KEY}`,
        },
      });

      if (!res.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Не удалось проверить статус задачи',
        });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ Runway API' }); });
      return {
        status: data.status as 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED',
        progress: data.progress as number | undefined,
        output: data.output?.[0] as string | undefined,
        error: data.failure as string | undefined,
      };
    }),
});
