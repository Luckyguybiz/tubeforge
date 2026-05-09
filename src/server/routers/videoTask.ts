import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { API_ENDPOINTS } from '@/lib/constants';
import { env } from '@/lib/env';
import { deliverWebhooks } from './webhook';
import jwt from 'jsonwebtoken';

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

/* ── Kling JWT (shared cache) ── */
let _klingToken: string | null = null;
let _klingTokenExp = 0;

function getKlingJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  if (_klingToken && now < _klingTokenExp - 60) return _klingToken;
  const payload = { iss: env.KLING_ACCESS_KEY, exp: now + 1800, nbf: now - 5 };
  _klingToken = jwt.sign(payload, env.KLING_SECRET_KEY, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });
  _klingTokenExp = now + 1800;
  return _klingToken;
}

/** Parse provider prefix from task ID: "kling:abc123" → { provider: "kling", rawId: "abc123" } */
function parseTaskId(taskId: string): { provider: 'kling' | 'kling-i2v' | 'runway'; rawId: string } {
  if (taskId.startsWith('kling-i2v:')) return { provider: 'kling-i2v', rawId: taskId.slice(10) };
  if (taskId.startsWith('kling:')) return { provider: 'kling', rawId: taskId.slice(6) };
  if (taskId.startsWith('runway:')) return { provider: 'runway', rawId: taskId.slice(7) };
  return { provider: 'runway', rawId: taskId };
}

export const videoTaskRouter = router({
  checkStatus: protectedProcedure
    .input(z.object({ taskId: z.string().min(1).max(200) }))
    .query(async ({ ctx, input }) => {
      // Verify the requesting user owns the scene associated with this taskId
      const scene = await ctx.db.scene.findFirst({
        where: { taskId: input.taskId },
        select: { id: true, project: { select: { userId: true } } },
      });
      if (!scene || scene.project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { provider, rawId } = parseTaskId(input.taskId);

      /* ── Kling polling ── */
      if (provider === 'kling' || provider === 'kling-i2v') {
        const klingPollEndpoint = provider === 'kling-i2v' ? API_ENDPOINTS.KLING_IMAGE2VIDEO : API_ENDPOINTS.KLING_TEXT2VIDEO;
        let res: Response;
        try {
          res = await fetchWithTimeout(`${klingPollEndpoint}/${rawId}`, {
            headers: { Authorization: `Bearer ${getKlingJWT()}` },
          });
        } catch {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to check Kling task status' });
        }

        if (!res.ok) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Kling status check failed' });
        }

        const data = await res.json().catch(() => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse Kling response' });
        });

        // Kling statuses: submitted, processing, succeed, failed
        const klingStatus = data.data?.task_status as string;
        const videoUrl = data.data?.task_result?.videos?.[0]?.url as string | undefined;

        // Map to our unified status
        let status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
        if (klingStatus === 'submitted') status = 'PENDING';
        else if (klingStatus === 'processing') status = 'RUNNING';
        else if (klingStatus === 'succeed') status = 'SUCCEEDED';
        else status = 'FAILED';

        // Fire webhook on success
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
          progress: klingStatus === 'processing' ? 50 : klingStatus === 'succeed' ? 100 : 0,
          output: videoUrl,
          error: status === 'FAILED' ? (data.data?.task_status_msg || 'Kling generation failed') : undefined,
        };
      }

      /* ── Runway polling (default) ── */
      let res: Response;
      try {
        res = await fetchWithTimeout(`${API_ENDPOINTS.RUNWAY_TASKS}/${rawId}`, {
          headers: { Authorization: `Bearer ${env.RUNWAY_API_KEY}` },
        });
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to check task status' });
      }

      if (!res.ok) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to check task status' });
      }

      const data = await res.json().catch(() => {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse Runway API response' });
      });

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
