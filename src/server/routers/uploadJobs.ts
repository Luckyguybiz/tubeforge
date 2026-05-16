import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import type { UploadJobStatus } from '@prisma/client';

/**
 * uploadJobs router — async video upload queue + lifecycle.
 *
 * Phase 2 plan reference: writes UploadJob rows. Worker route at
 * /api/cron/youtube-upload-processor picks them up minute-by-minute,
 * fetches source video bytes server-side, PUTs to YouTube resumable
 * session, updates status, calls deliverWebhooks() on terminal states.
 *
 * Phase 3 plan reference: same data model serves external REST callers
 * authenticating via X-Forge-Key. apiKeyId + externalUserId fields are
 * populated by /api/v1/youtube/upload route, while WEB_UI rows from this
 * router leave them null.
 */
export const uploadJobsRouter = router({
  /** Create a new upload job. WEB_UI source — TubeForge user via /publish. */
  create: protectedProcedure
    .input(
      z.object({
        channelId: z.string().min(1).max(100),
        videoUrl: z.string().url().max(2048),
        title: z.string().min(1).max(100),
        description: z.string().max(5000).optional(),
        tags: z.array(z.string().max(50)).max(30).optional(),
        thumbnailUrl: z.string().url().max(2048).optional(),
        privacyStatus: z.enum(['public', 'unlisted', 'private']).default('private'),
        scheduledAt: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate user owns the channel
      const channel = await ctx.db.channel.findFirst({
        where: { id: input.channelId, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!channel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found or you do not own it',
        });
      }

      // YouTube requires scheduled videos to be private until publishAt
      const effectivePrivacy = input.scheduledAt ? 'private' : input.privacyStatus;

      const job = await ctx.db.uploadJob.create({
        data: {
          userId: ctx.session.user.id,
          channelId: input.channelId,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
          title: input.title,
          description: input.description,
          tags: input.tags ?? [],
          privacyStatus: effectivePrivacy,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          source: 'WEB_UI',
          status: 'QUEUED',
        },
        select: { id: true, status: true, scheduledAt: true, createdAt: true },
      });

      // Estimated completion: 30s for immediate, scheduledAt+30s for scheduled
      const estimatedCompletion = input.scheduledAt
        ? new Date(new Date(input.scheduledAt).getTime() + 30_000).toISOString()
        : new Date(Date.now() + 30_000).toISOString();

      return {
        jobId: job.id,
        status: job.status,
        scheduledAt: job.scheduledAt?.toISOString() ?? null,
        estimatedCompletion,
      };
    }),

  /** List jobs for current user with optional filters and pagination. */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['QUEUED', 'UPLOADING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
        channelId: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
        cursor: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 30;
      const jobs = await ctx.db.uploadJob.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.channelId ? { channelId: input.channelId } : {}),
        },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          videoUrl: true,
          status: true,
          uploadProgress: true,
          youtubeVideoId: true,
          errorMessage: true,
          retryCount: true,
          scheduledAt: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
          webhookDelivered: true,
          webhookFailed: true,
          channelId: true,
          channel: { select: { id: true, title: true, thumbnail: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      const hasMore = jobs.length > limit;
      const items = hasMore ? jobs.slice(0, limit) : jobs;
      return {
        items,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      };
    }),

  /** Get a single job by id. */
  get: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.uploadJob.findFirst({
        where: { id: input.jobId, userId: ctx.session.user.id },
        include: {
          channel: { select: { id: true, title: true, thumbnail: true } },
        },
      });
      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }
      return job;
    }),

  /** Cancel a queued/scheduled job before the worker picks it up. */
  cancel: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.uploadJob.findFirst({
        where: { id: input.jobId, userId: ctx.session.user.id },
        select: { id: true, status: true },
      });
      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }
      if (job.status !== 'QUEUED') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Cannot cancel a job in ${job.status} state`,
        });
      }
      await ctx.db.uploadJob.update({
        where: { id: input.jobId },
        data: { status: 'CANCELLED', completedAt: new Date() },
      });
      return { cancelled: true };
    }),

  /** Retry a failed job (resets to QUEUED if retryCount < 3). */
  retry: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.uploadJob.findFirst({
        where: { id: input.jobId, userId: ctx.session.user.id },
        select: { id: true, status: true, retryCount: true },
      });
      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }
      if (job.status !== 'FAILED') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Only FAILED jobs can be retried (this one is ${job.status})`,
        });
      }
      if (job.retryCount >= 3) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Maximum retries exceeded. Create a new job instead.',
        });
      }
      await ctx.db.uploadJob.update({
        where: { id: input.jobId },
        data: {
          status: 'QUEUED',
          errorMessage: null,
          startedAt: null,
          completedAt: null,
          lockedBy: null,
          lockedAt: null,
        },
      });
      return { requeued: true, retryCount: job.retryCount + 1 };
    }),

  /** Count of jobs in active states — used by Sidebar badge. */
  pendingCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.uploadJob.count({
      where: {
        userId: ctx.session.user.id,
        status: { in: ['QUEUED', 'UPLOADING'] satisfies UploadJobStatus[] },
      },
    });
    return { count };
  }),

  /**
   * Calendar view feed: returns jobs whose effective-day falls in the
   * [from, to) range. Effective-day = scheduledAt if set (future post),
   * else createdAt (for the row to still appear on the day it was
   * filed). Used by /publish/calendar to populate the month grid.
   *
   * Returns a compact shape (no payload, no signature) so the client
   * can fetch 100s of cells without bloating the wire.
   */
  byMonth: protectedProcedure
    .input(
      z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
        channelId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const from = new Date(input.from);
      const to = new Date(input.to);
      const items = await ctx.db.uploadJob.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.channelId ? { channelId: input.channelId } : {}),
          OR: [
            { scheduledAt: { gte: from, lt: to } },
            // For non-scheduled rows, anchor by createdAt within the
            // same window so an UPLOADING/COMPLETED job appears on its
            // creation day.
            { AND: [{ scheduledAt: null }, { createdAt: { gte: from, lt: to } }] },
          ],
        },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          status: true,
          uploadProgress: true,
          youtubeVideoId: true,
          scheduledAt: true,
          createdAt: true,
          completedAt: true,
          channelId: true,
          channel: { select: { title: true, thumbnail: true } },
        },
        orderBy: [
          // Scheduled-future first within a day (alphabetical isn't
          // helpful; chronological is). For non-scheduled, fall back
          // to createdAt asc.
          { scheduledAt: 'asc' },
          { createdAt: 'asc' },
        ],
        take: 500,
      });
      return { items };
    }),
});
