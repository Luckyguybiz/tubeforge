import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { API_ENDPOINTS } from '@/lib/constants';
import { env } from '@/lib/env';
import { deliverWebhooks } from './webhook';

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
    .input(z.object({ taskId: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      // Verify the requesting user owns the scene associated with this taskId
      const scene = await ctx.db.scene.findFirst({
        where: { taskId: input.taskId },
        select: { id: true, project: { select: { userId: true } } },
      });
      if (!scene || scene.project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
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
          message: 'Failed to check task status',
        });
      }

      if (!res.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check task status',
        });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse Runway API response' }); });

      const status = data.status as 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
      const videoUrl = data.output?.[0] as string | undefined;

      // Fire webhook when a video task completes successfully
      if (status === 'SUCCEEDED' && videoUrl) {
        const sceneWithProject = await ctx.db.scene.findFirst({
          where: { taskId: input.taskId },
          select: { project: { select: { id: true, userId: true } } },
        });
        if (sceneWithProject) {
          deliverWebhooks(sceneWithProject.project.userId, 'video.completed', {
            projectId: sceneWithProject.project.id,
            videoUrl,
          });
        }
      }

      return {
        status,
        progress: data.progress as number | undefined,
        output: videoUrl,
        error: data.failure as string | undefined,
      };
    }),
});
