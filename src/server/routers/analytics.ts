import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

const AI_LIMITS: Record<string, number> = { FREE: 5, PRO: 100, STUDIO: Infinity };

/** Allowlist of valid tool IDs — must match TOOL_LABELS in src/lib/toolUsageTracker.ts
 *  Note: 'youtube-downloader' ID kept for backward compat — label is now "YouTube Analyzer" */
const VALID_TOOL_IDS = new Set([
  'mp3-converter',
  'video-compressor',
  'thumbnail-generator',
  'ai-scriptwriter',
  'subtitle-generator',
  'video-trimmer',
  'audio-extractor',
  'format-converter',
  'gif-maker',
  'youtube-downloader',
  'shorts-maker',
  'voice-generator',
]);

/** Max age for analytics events — reject anything older than 1 hour */
const MAX_EVENT_AGE_MS = 60 * 60 * 1000;

/** Rate limit: 30 reads per minute per user */
async function checkAnalyticsRate(userId: string) {
  const { success } = await rateLimit({ identifier: `analytics:${userId}`, limit: 30, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/** Rate limit for sync/tracking writes: 100 events per minute per user */
async function checkAnalyticsSyncRate(userId: string) {
  const { success } = await rateLimit({ identifier: `analytics-sync:${userId}`, limit: 100, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const analyticsRouter = router({
  /**
   * Overview statistics for the current user:
   * - Total projects, total scenes
   * - Projects created this week / this month
   * - Total video duration (sum of scene durations)
   * - AI plan usage (used vs limit)
   * - Projects breakdown by status
   */
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    await checkAnalyticsRate(ctx.session.user.id);
    const userId = ctx.session.user.id;

    const [user, totalProjects, totalScenes, weekProjects, monthProjects, durationResult, statusCounts] =
      await Promise.all([
        ctx.db.user.findUnique({
          where: { id: userId },
          select: { plan: true, aiUsage: true, aiResetAt: true },
        }),
        ctx.db.project.count({ where: { userId } }),
        ctx.db.scene.count({ where: { project: { userId } } }),
        ctx.db.project.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        ctx.db.project.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        ctx.db.scene.aggregate({
          where: { project: { userId } },
          _sum: { duration: true },
        }),
        ctx.db.project.groupBy({
          by: ['status'],
          where: { userId },
          _count: true,
        }),
      ]);

    const plan = user?.plan ?? 'FREE';
    const aiLimit = AI_LIMITS[plan] ?? 5;
    const aiUsage = user?.aiUsage ?? 0;

    // Build status breakdown map
    const statusBreakdown = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalProjects,
      totalScenes,
      weekProjects,
      monthProjects,
      totalDurationSeconds: durationResult._sum.duration ?? 0,
      plan,
      aiUsage,
      aiLimit: aiLimit === Infinity ? -1 : aiLimit, // -1 signals unlimited
      statusBreakdown: {
        DRAFT: statusBreakdown.DRAFT ?? 0,
        RENDERING: statusBreakdown.RENDERING ?? 0,
        READY: statusBreakdown.READY ?? 0,
        PUBLISHED: statusBreakdown.PUBLISHED ?? 0,
      },
    };
  }),

  /**
   * Daily project creation/update activity for the last 30 days.
   * Returns an array of { date, created, updated } entries.
   */
  getProjectActivity: protectedProcedure.query(async ({ ctx }) => {
    await checkAnalyticsRate(ctx.session.user.id);
    const userId = ctx.session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    type ActivityRow = { day: Date; created: bigint; updated: bigint };

    const activity = await ctx.db.$queryRaw<ActivityRow[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        COUNT(*) AS created,
        (
          SELECT COUNT(*)
          FROM "Project" p2
          WHERE p2."userId" = ${userId}
            AND DATE_TRUNC('day', p2."updatedAt") = DATE_TRUNC('day', p."createdAt")
            AND p2."updatedAt" != p2."createdAt"
        ) AS updated
      FROM "Project" p
      WHERE p."userId" = ${userId}
        AND p."createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `;

    // Fill in missing days with zeros
    const result: Array<{ date: string; created: number; updated: number }> = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const activityMap = new Map(
      activity.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        { created: Number(row.created), updated: Number(row.updated) },
      ]),
    );

    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * dayMs).toISOString().slice(0, 10);
      const entry = activityMap.get(date);
      result.push({
        date,
        created: entry?.created ?? 0,
        updated: entry?.updated ?? 0,
      });
    }

    return result;
  }),

  /**
   * Tool usage breakdown.
   * Accepts client-side usage data and returns combined counts.
   * The tool counters are tracked in localStorage on the client and
   * optionally synced here for server-side aggregation.
   */
  getToolUsage: protectedProcedure
    .input(
      z
        .object({
          counters: z
            .record(z.string(), z.number().int().min(0))
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // For now, return the client-provided counters echoed back,
      // since there's no server-side usage tracking table yet.
      // In production this would merge with a server-side store.
      // Filter to only valid tool IDs to prevent injection of arbitrary keys.
      const counters = input?.counters ?? {};
      return {
        tools: Object.entries(counters)
          .filter(([tool]) => VALID_TOOL_IDS.has(tool))
          .map(([tool, count]) => ({
            tool,
            count,
          })),
      };
    }),

  /**
   * Sync tool usage from client to server.
   * Accepts a batch of tool usage deltas and stores them.
   *
   * Server-side validation:
   *   - Tool names must be in the VALID_TOOL_IDS allowlist
   *   - Timestamp (if provided) must be within the last hour
   *   - Rate limited to 100 events per user per minute
   */
  syncToolUsage: protectedProcedure
    .input(
      z.object({
        counters: z.record(z.string(), z.number().int().min(0)),
        /** ISO timestamp of when the batch was collected on the client */
        timestamp: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Dedicated sync rate limit: 100 events/min per user
      await checkAnalyticsSyncRate(ctx.session.user.id);

      // Validate timestamp freshness — reject stale or manipulated events
      if (input.timestamp) {
        const eventTime = new Date(input.timestamp).getTime();
        const now = Date.now();
        if (isNaN(eventTime) || now - eventTime > MAX_EVENT_AGE_MS || eventTime > now + 60_000) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Event timestamp is stale or invalid. Must be within the last hour.',
          });
        }
      }

      // Filter to only valid/known tool IDs — silently drop unknown tools
      const validCounters: Record<string, number> = {};
      const invalidTools: string[] = [];
      for (const [toolId, count] of Object.entries(input.counters)) {
        if (VALID_TOOL_IDS.has(toolId)) {
          validCounters[toolId] = count;
        } else {
          invalidTools.push(toolId);
        }
      }

      // Persist tool usage to AuditLog for server-side aggregation
      const syncedCount = Object.keys(validCounters).length;
      if (syncedCount > 0) {
        await ctx.db.auditLog.create({
          data: {
            userId: ctx.session.user.id,
            action: 'tool-usage',
            target: 'analytics-sync',
            metadata: {
              counters: validCounters,
              timestamp: input.timestamp ?? new Date().toISOString(),
            },
          },
        });
      }

      return {
        synced: syncedCount,
        rejected: invalidTools.length,
      };
    }),

  /**
   * SEO score calculation for a project's metadata.
   * Analyzes title, description, and tags against YouTube best practices.
   * Returns a breakdown of scores and actionable suggestions.
   */
  getSeoScore: protectedProcedure
    .input(z.object({
      projectId: z.string().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      await checkAnalyticsRate(ctx.session.user.id);

      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          OR: [
            { userId: ctx.session.user.id },
            { team: { members: { some: { userId: ctx.session.user.id } } } },
          ],
        },
        select: {
          title: true,
          description: true,
          tags: true,
          thumbnailUrl: true,
          thumbnailData: true,
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const title = project.title ?? '';
      const description = project.description ?? '';
      const tags = project.tags ?? [];
      const hasThumbnail = !!(project.thumbnailUrl || project.thumbnailData);

      // --- Title scoring (0-25) ---
      let titleScore = 0;
      const titleSuggestions: string[] = [];

      if (title.length >= 30 && title.length <= 70) {
        titleScore += 10; // Optimal length
      } else if (title.length >= 20 && title.length <= 100) {
        titleScore += 6;
        titleSuggestions.push('Title should be 30-70 characters for optimal CTR');
      } else {
        titleScore += 2;
        titleSuggestions.push('Title is too short or too long. Aim for 30-70 characters');
      }

      // Check for power words / emotional triggers
      const powerWords = ['how to', 'best', 'top', 'ultimate', 'guide', 'review', 'secret', 'tips', 'tutorial', 'free', 'new', 'complete'];
      const hasPowerWord = powerWords.some((w) => title.toLowerCase().includes(w));
      if (hasPowerWord) {
        titleScore += 8;
      } else {
        titleScore += 2;
        titleSuggestions.push('Add engaging words like "How to", "Best", "Guide", "Tips" to your title');
      }

      // Number in title bonus
      if (/\d/.test(title)) {
        titleScore += 4;
      } else {
        titleScore += 1;
        titleSuggestions.push('Titles with numbers (e.g., "5 Tips...") tend to perform better');
      }

      // Brackets bonus
      if (/[\[\(]/.test(title)) {
        titleScore += 3;
      } else {
        titleSuggestions.push('Adding brackets like [2026] or (Tutorial) can boost CTR');
      }

      // --- Description scoring (0-25) ---
      let descScore = 0;
      const descSuggestions: string[] = [];

      if (description.length >= 200) {
        descScore += 8;
      } else if (description.length >= 100) {
        descScore += 5;
        descSuggestions.push('Descriptions over 200 characters perform better for SEO');
      } else if (description.length > 0) {
        descScore += 2;
        descSuggestions.push('Your description is too short. Aim for 200+ characters');
      } else {
        descSuggestions.push('Add a description! It is critical for YouTube SEO');
      }

      // Timestamps check
      const hasTimestamps = /\d{1,2}:\d{2}/.test(description);
      if (hasTimestamps) {
        descScore += 5;
      } else if (description.length > 0) {
        descSuggestions.push('Add timestamps (e.g., 0:00 Intro, 1:30 Main topic) for better engagement');
      }

      // Links/CTA check
      const hasLink = /https?:\/\//.test(description) || /subscribe|follow|like|comment/i.test(description);
      if (hasLink) {
        descScore += 5;
      } else if (description.length > 0) {
        descSuggestions.push('Include a call-to-action (Subscribe, Like) and relevant links');
      }

      // Hashtags in description
      const hasHashtags = /#\w+/.test(description);
      if (hasHashtags) {
        descScore += 4;
      } else if (description.length > 0) {
        descSuggestions.push('Add 3-5 hashtags at the end of your description');
      }

      // Line breaks / structure
      const lineBreaks = (description.match(/\n/g) ?? []).length;
      if (lineBreaks >= 3) {
        descScore += 3;
      } else if (description.length > 100) {
        descSuggestions.push('Structure your description with line breaks and sections');
      }

      // --- Tags scoring (0-25) ---
      let tagsScore = 0;
      const tagsSuggestions: string[] = [];

      if (tags.length >= 8 && tags.length <= 15) {
        tagsScore += 12;
      } else if (tags.length >= 5) {
        tagsScore += 8;
        tagsSuggestions.push('Add more tags (8-15 is optimal)');
      } else if (tags.length >= 1) {
        tagsScore += 4;
        tagsSuggestions.push('You need more tags. Aim for 8-15 relevant tags');
      } else {
        tagsSuggestions.push('Add tags! They help YouTube understand your video content');
      }

      // Tag variety (mix of short and long-tail)
      const shortTags = tags.filter((t) => t.split(' ').length <= 2);
      const longTags = tags.filter((t) => t.split(' ').length >= 3);
      if (shortTags.length > 0 && longTags.length > 0) {
        tagsScore += 8;
      } else if (tags.length > 0) {
        tagsScore += 3;
        tagsSuggestions.push('Mix short tags ("tutorial") with long-tail tags ("how to edit video 2026")');
      }

      // Tag-title relevance
      const titleWords = new Set(title.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
      const tagOverlap = tags.filter((tag) =>
        tag.toLowerCase().split(/\s+/).some((w) => titleWords.has(w)),
      ).length;
      if (tagOverlap >= 2) {
        tagsScore += 5;
      } else if (tags.length > 0) {
        tagsScore += 1;
        tagsSuggestions.push('Include your title keywords in your tags for better SEO');
      }

      // --- Thumbnail scoring (0-25) ---
      let thumbnailScore = 0;
      const thumbnailSuggestions: string[] = [];

      if (hasThumbnail) {
        thumbnailScore += 20;
        // Bonus for custom thumbnail data (not just URL)
        if (project.thumbnailData) {
          thumbnailScore += 5;
        } else {
          thumbnailScore += 2;
          thumbnailSuggestions.push('Consider customizing your thumbnail with text overlay and branding');
        }
      } else {
        thumbnailSuggestions.push('Upload a custom thumbnail! Videos with custom thumbnails get 90% more clicks');
      }

      const totalScore = Math.min(titleScore, 25) + Math.min(descScore, 25) + Math.min(tagsScore, 25) + Math.min(thumbnailScore, 25);

      return {
        totalScore,
        maxScore: 100,
        grade: totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : totalScore >= 20 ? 'D' : 'F',
        breakdown: {
          title: { score: Math.min(titleScore, 25), max: 25, suggestions: titleSuggestions },
          description: { score: Math.min(descScore, 25), max: 25, suggestions: descSuggestions },
          tags: { score: Math.min(tagsScore, 25), max: 25, suggestions: tagsSuggestions },
          thumbnail: { score: Math.min(thumbnailScore, 25), max: 25, suggestions: thumbnailSuggestions },
        },
      };
    }),

  /**
   * Get publish history for the current user.
   * Returns recent projects with their publish timestamps and status.
   */
  getPublishHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      await checkAnalyticsRate(ctx.session.user.id);
      const userId = ctx.session.user.id;
      const limit = input?.limit ?? 20;

      const projects = await ctx.db.project.findMany({
        where: {
          userId,
          status: 'PUBLISHED',
          NOT: { title: { startsWith: '__tf_' } },
        },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { scenes: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      return { items: projects };
    }),
});
