import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { channelAnalytics, getChannel } from '@/lib/youtube/api';
import { hasScope, YT_ANALYTICS_READONLY_SCOPE } from '@/lib/youtube/token';
import { credentialsFor, mdTable, num, ok, resolveChannel, run, ToolError, type McpContext } from '../context';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Own-channel statistics via the YouTube Analytics API. Only raw report
 * rows are returned (no scores, projections or benchmarks) and the window
 * is capped at 28 days, matching the 30-day retention commitment in
 * YOUTUBE_API_COMPLIANCE.md.
 */
export function registerStatsTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    'tubeforge_get_channel_stats',
    {
      title: 'Channel statistics (last 7 or 28 days)',
      description:
        'Report views, watch time, average view duration, likes, comments, shares and subscriber changes for one of your connected channels over the last 7 or 28 days, ' +
        'as reported by the YouTube Analytics API. breakdown="day" returns one row per day; breakdown="video" returns the top videos by views in the window; breakdown="total" returns a single row. ' +
        'Also includes the channel\'s lifetime totals from channels.list. Costs 1 Data API unit; Analytics API calls do not consume Data API quota.',
      inputSchema: {
        channelId: z.string().regex(/^UC[\w-]{22}$/).optional(),
        days: z.union([z.literal(7), z.literal(28)]).default(28),
        breakdown: z.enum(['total', 'day', 'video']).default('total'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ channelId, days, breakdown }) =>
      run(ctx, async () => {
        const channel = await resolveChannel(ctx, channelId);
        const creds = await credentialsFor(ctx, channel);
        if (!hasScope(creds.scopes, YT_ANALYTICS_READONLY_SCOPE)) {
          throw new ToolError(
            'insufficient_scope',
            `Channel statistics need the YouTube Analytics (read-only) permission. Reconnect the channel at ${ctx.origin}/settings#channels.`,
            { grantedScopes: creds.scopes },
          );
        }

        const end = new Date();
        end.setUTCDate(end.getUTCDate() - 1); // Analytics data lags ~1 day
        const start = new Date(end);
        start.setUTCDate(start.getUTCDate() - (days - 1));

        const metrics = ['views', 'estimatedMinutesWatched', 'averageViewDuration', 'likes', 'comments', 'shares', 'subscribersGained', 'subscribersLost'];
        const report = await channelAnalytics(creds.accessToken, {
          channelId: channel.channelId,
          startDate: isoDate(start),
          endDate: isoDate(end),
          metrics,
          dimensions: breakdown === 'total' ? undefined : breakdown,
          sort: breakdown === 'video' ? '-views' : breakdown === 'day' ? 'day' : undefined,
          maxResults: breakdown === 'video' ? 25 : undefined,
        });
        const headers = (report.columnHeaders ?? []).map((h) => h.name);
        const rows = (report.rows ?? []).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));

        const info = await getChannel({ accessToken: creds.accessToken }, channel.channelId);
        const lifetime = {
          subscribers: num(info?.statistics?.subscriberCount),
          totalViews: num(info?.statistics?.viewCount),
          videoCount: num(info?.statistics?.videoCount),
        };

        const structured = {
          channelId: channel.channelId,
          channelTitle: info?.snippet?.title ?? channel.title,
          period: { startDate: isoDate(start), endDate: isoDate(end), days },
          breakdown,
          columns: headers,
          rows,
          lifetime,
          source: 'YouTube Analytics API (raw report rows) + YouTube Data API channels.list',
          quotaUnits: 1,
        };
        const text =
          `Stats for ${structured.channelTitle} (${structured.period.startDate} → ${structured.period.endDate})\n\n` +
          mdTable(headers, rows.map((r) => headers.map((h) => r[h] as string | number))) +
          `\n\nLifetime: ${lifetime.subscribers ?? '?'} subscribers · ${lifetime.totalViews ?? '?'} views · ${lifetime.videoCount ?? '?'} videos`;
        return ok(structured, text);
      }),
  );
}
