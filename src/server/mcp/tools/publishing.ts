import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db } from '@/server/db';
import { createUploadJobs, UploadItemSchema } from '@/lib/publishing/create-upload-jobs';
import { fail, listAccessibleChannels, mdTable, ok, run, type McpContext } from '../context';

const JOB_SELECT = {
  id: true,
  channelId: true,
  title: true,
  privacyStatus: true,
  status: true,
  scheduledAt: true,
  youtubeVideoId: true,
  errorMessage: true,
  retryCount: true,
  uploadProgress: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  consumerRef: true,
} as const;

type JobRow = {
  id: string;
  channelId: string;
  title: string;
  privacyStatus: string;
  status: string;
  scheduledAt: Date | null;
  youtubeVideoId: string | null;
  errorMessage: string | null;
  retryCount: number;
  uploadProgress: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  consumerRef: string | null;
};

function shapeJob(j: JobRow) {
  return {
    jobId: j.id,
    channelId: j.channelId,
    title: j.title,
    privacyStatus: j.privacyStatus,
    status: j.status.toLowerCase(),
    scheduledAt: j.scheduledAt?.toISOString() ?? null,
    youtubeVideoId: j.youtubeVideoId,
    youtubeUrl: j.youtubeVideoId ? `https://youtube.com/watch?v=${j.youtubeVideoId}` : null,
    errorMessage: j.errorMessage,
    retryCount: j.retryCount,
    uploadProgress: j.uploadProgress,
    consumerRef: j.consumerRef,
    createdAt: j.createdAt.toISOString(),
    startedAt: j.startedAt?.toISOString() ?? null,
    completedAt: j.completedAt?.toISOString() ?? null,
  };
}

export function registerPublishingTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    'tubeforge_schedule_uploads',
    {
      title: 'Upload / schedule videos',
      description:
        'Queue one or more videos for upload to a connected channel through TubeForge\'s publishing worker. Each item needs a direct https videoUrl (mp4/mov reachable without login), a title and either channelId or externalUserId; ' +
        'optional description, tags, thumbnailUrl, privacyStatus (default private) and scheduledAt (ISO 8601 — the video is uploaded private and YouTube publishes it at that time). ' +
        'Returns job ids immediately; use tubeforge_get_upload_job or tubeforge_get_calendar to follow progress. Pass an idempotencyKey to make retries safe. Max 50 items. ' +
        'Each upload consumes 1 of the API key\'s monthly upload quota and ~1600 YouTube quota units when it runs.',
      inputSchema: {
        items: z.array(UploadItemSchema).min(1).max(50),
        idempotencyKey: z.string().min(8).max(120).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ items, idempotencyKey }) =>
      run(ctx, async () => {
        // Default the channel when the caller gave neither target and only one channel exists.
        const channels = await listAccessibleChannels(ctx);
        const filled = items.map((i) =>
          !i.channelId && !i.externalUserId && channels.length === 1 ? { ...i, channelId: channels[0].channelId } : i,
        );
        const result = await createUploadJobs(ctx.auth, filled, idempotencyKey);
        if (!result.ok) return fail(result.code, result.message, { details: result.details });
        const text =
          `${result.created ? 'Queued' : 'Already queued (idempotent replay)'} ${result.jobs.length} upload(s).\n\n` +
          mdTable(['jobId', 'channel', 'status', 'scheduledAt'], result.jobs.map((j) => [j.jobId, j.channelId, j.status, j.scheduledAt ?? 'asap']));
        return ok({ created: result.created, jobs: result.jobs }, text);
      }),
  );

  server.registerTool(
    'tubeforge_get_upload_job',
    {
      title: 'Get an upload job',
      description: 'Status of one upload job created by tubeforge_schedule_uploads (queued / uploading / completed / failed / cancelled), with the YouTube URL once published and the error message if it failed.',
      inputSchema: { jobId: z.string().min(1).max(100) },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ jobId }) =>
      run(ctx, async () => {
        const job = await db.uploadJob.findFirst({
          where: { id: jobId, OR: [{ apiKeyId: ctx.auth.apiKeyId }, { userId: ctx.auth.userId }] },
          select: JOB_SELECT,
        });
        if (!job) return fail('not_found', `Upload job "${jobId}" was not found for this account.`);
        return ok({ job: shapeJob(job) });
      }),
  );

  server.registerTool(
    'tubeforge_get_calendar',
    {
      title: 'Publishing calendar',
      description:
        'What is scheduled and what was published through TubeForge, grouped by day. Covers upload jobs from `daysBack` days ago to `daysAhead` days ahead (defaults: 7 back, 30 ahead). ' +
        'Use it to answer "what goes out this week?", to find free slots before scheduling, or to check that a batch landed.',
      inputSchema: {
        channelId: z.string().regex(/^UC[\w-]{22}$/).optional(),
        daysBack: z.number().int().min(0).max(30).default(7),
        daysAhead: z.number().int().min(0).max(90).default(30),
        status: z.enum(['queued', 'uploading', 'completed', 'failed', 'cancelled']).optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ channelId, daysBack, daysAhead, status }) =>
      run(ctx, async () => {
        const channels = await listAccessibleChannels(ctx);
        const ids = channelId ? channels.filter((c) => c.channelId === channelId).map((c) => c.channelId) : channels.map((c) => c.channelId);
        if (channelId && ids.length === 0) return fail('channel_not_found', `Channel "${channelId}" is not connected to this API key.`);

        const now = Date.now();
        const from = new Date(now - daysBack * 86_400_000);
        const to = new Date(now + daysAhead * 86_400_000);
        const jobs = await db.uploadJob.findMany({
          where: {
            channelId: { in: ids },
            OR: [{ apiKeyId: ctx.auth.apiKeyId }, { userId: ctx.auth.userId }],
            ...(status ? { status: status.toUpperCase() as 'QUEUED' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' } : {}),
            AND: [
              {
                OR: [
                  { scheduledAt: { gte: from, lte: to } },
                  { scheduledAt: null, createdAt: { gte: from, lte: to } },
                ],
              },
            ],
          },
          select: JOB_SELECT,
          orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
          take: 500,
        });

        const byDay = new Map<string, ReturnType<typeof shapeJob>[]>();
        for (const j of jobs) {
          const when = j.scheduledAt ?? j.completedAt ?? j.createdAt;
          const day = when.toISOString().slice(0, 10);
          if (!byDay.has(day)) byDay.set(day, []);
          byDay.get(day)!.push(shapeJob(j));
        }
        const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({ date, count: items.length, jobs: items }));
        const text =
          `${jobs.length} job(s) between ${from.toISOString().slice(0, 10)} and ${to.toISOString().slice(0, 10)}\n\n` +
          mdTable(
            ['date', 'jobId', 'title', 'status', 'time (UTC)'],
            days.flatMap((d) => d.jobs.map((j) => [d.date, j.jobId, j.title, j.status, (j.scheduledAt ?? j.createdAt).slice(11, 16)])),
          );
        return ok({ from: from.toISOString(), to: to.toISOString(), channels: ids, total: jobs.length, days }, text);
      }),
  );
}
