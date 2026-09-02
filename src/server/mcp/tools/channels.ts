import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db } from '@/server/db';
import { listMyChannels } from '@/lib/youtube/api';
import { getYouTubeCredentials } from '@/lib/youtube/token';
import { listAccessibleChannels, num, ok, run, type McpContext } from '../context';

export function registerChannelTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    'tubeforge_list_channels',
    {
      title: 'List connected YouTube channels',
      description:
        'List the YouTube channels connected to this TubeForge account (your own channels plus channels onboarded through the Publishing API). ' +
        'Returns channelId, title, subscriber count and which channels can be edited. Call this first when you need a channelId. ' +
        'Set refresh=true to re-sync titles and subscriber counts from YouTube (costs 1 quota unit).',
      inputSchema: {
        refresh: z.boolean().default(false).describe('Re-sync channel title/subscribers from YouTube before answering'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ refresh }) =>
      run(ctx, async () => {
        let quotaUnits = 0;
        if (refresh) {
          const creds = await getYouTubeCredentials(db, { userId: ctx.auth.userId });
          const mine = await listMyChannels(creds.accessToken);
          quotaUnits += 1;
          for (const ch of mine) {
            await db.channel.upsert({
              where: { id: ch.id },
              create: {
                id: ch.id,
                title: ch.snippet?.title ?? ch.id,
                thumbnail: ch.snippet?.thumbnails?.default?.url,
                subscribers: num(ch.statistics?.subscriberCount) ?? 0,
                userId: ctx.auth.userId,
              },
              update: {
                title: ch.snippet?.title ?? ch.id,
                thumbnail: ch.snippet?.thumbnails?.default?.url,
                subscribers: num(ch.statistics?.subscriberCount) ?? 0,
              },
            });
          }
        }

        const accessible = await listAccessibleChannels(ctx);
        const rows = await db.channel.findMany({
          where: { id: { in: accessible.map((c) => c.channelId) } },
          select: { id: true, title: true, thumbnail: true, subscribers: true, createdAt: true, updatedAt: true },
        });
        const byId = new Map(rows.map((r) => [r.id, r]));

        const channels = accessible.map((c) => {
          const r = byId.get(c.channelId);
          return {
            channelId: c.channelId,
            title: r?.title ?? c.title,
            url: `https://www.youtube.com/channel/${c.channelId}`,
            thumbnail: r?.thumbnail ?? null,
            subscribers: r?.subscribers ?? null,
            source: c.externalUserId ? 'publishing_api' : 'own',
            externalUserId: c.externalUserId,
            connectedAt: r?.createdAt.toISOString() ?? null,
            lastSyncedAt: r?.updatedAt.toISOString() ?? null,
          };
        });

        return ok({ channels, count: channels.length, quotaUnits });
      }),
  );
}
