import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { API_ENDPOINTS } from '@/lib/constants';
import { env } from '@/lib/env';

/** Fetch wrapper with AbortController timeout */
async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const videoTaskRouter = router({
  checkStatus: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify the requesting user owns the scene associated with this taskId
      const scene = await ctx.db.scene.findFirst({
        where: { taskId: input.taskId },
        select: { id: true, project: { select: { userId: true } } },
      });
      if (!scene || scene.project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Нет доступа к этой задаче' });
      }

      let res: Response;
      try {
        res = await fetchWithTimeout(`${API_ENDPOINTS.RUNWAY_TASKS}/${input.taskId}`, {
          headers: {
            Authorization: `Bearer ${env.RUNWAY_API_KEY}`,
          },
        });
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Не удалось проверить статус задачи',
        });
      }

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
