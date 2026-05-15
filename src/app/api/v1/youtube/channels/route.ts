import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { authenticateApiRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/youtube/channels
 *
 * Returns channels associated with the API key's user (Phase 3a) plus
 * channels linked to any ExternalUser of this API key (Phase 3b).
 */
export async function GET(req: Request) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  const [ownChannels, externalUsers] = await Promise.all([
    db.channel.findMany({
      where: { userId: auth.userId },
      select: { id: true, title: true, thumbnail: true, subscribers: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.externalUser.findMany({
      where: { apiKeyId: auth.apiKeyId, channelId: { not: null } },
      select: {
        externalUserId: true,
        displayName: true,
        channel: { select: { id: true, title: true, thumbnail: true, subscribers: true } },
      },
    }),
  ]);

  return NextResponse.json({
    own: ownChannels.map((c) => ({
      channelId: c.id,
      title: c.title,
      thumbnail: c.thumbnail,
      subscribers: c.subscribers,
      connectedAt: c.createdAt.toISOString(),
    })),
    external: externalUsers
      .filter((e) => e.channel !== null)
      .map((e) => ({
        externalUserId: e.externalUserId,
        displayName: e.displayName,
        channelId: e.channel!.id,
        title: e.channel!.title,
        thumbnail: e.channel!.thumbnail,
        subscribers: e.channel!.subscribers,
      })),
  });
}
