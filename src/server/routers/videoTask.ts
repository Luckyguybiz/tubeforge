import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { API_ENDPOINTS } from '@/lib/constants';
import { env } from '@/lib/env';

export const videoTaskRouter = router({
  checkStatus: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
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

      const data = await res.json();
      return {
        status: data.status as 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED',
        progress: data.progress as number | undefined,
        output: data.output?.[0] as string | undefined,
        error: data.failure as string | undefined,
      };
    }),
});
