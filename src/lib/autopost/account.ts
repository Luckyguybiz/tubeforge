/**
 * Destructive actions of the autopost app: disconnecting a channel and
 * deleting the whole account. Each one: audit row first, Google access
 * revoked, then data removed; account deletion also emails the owner.
 *
 * Money is never touched here. An account with a paid plan, a Stripe
 * customer, payouts or referral earnings is not deleted through the app:
 * the request is refused with a code the app explains.
 */
import { createHash } from 'node:crypto';
import { db } from '@/server/db';
import { sendEmail } from '@/lib/email';
import { createLogger } from '@/lib/logger';
import { removeMediaByUrl, removeUserMedia } from './media';
import { AutopostError, ownedChannel } from './service';
import { revokeGoogleToken } from './youtube-connect';

const log = createLogger('autopost-account');

interface Who {
  userId: string;
  apiKeyId: string;
  ip: string;
  userAgent: string | null;
}

export async function disconnectChannel(who: Who, channelId: string): Promise<{ revoked: boolean; jobsRemoved: number }> {
  const channel = await ownedChannel(who.userId, channelId);
  const [accounts, jobs] = await Promise.all([
    db.account.findMany({
      where: { userId: who.userId, provider: 'google', providerAccountId: channel.id },
      select: { id: true, refresh_token: true, access_token: true },
    }),
    db.uploadJob.findMany({
      where: { channelId: channel.id },
      select: { id: true, status: true, videoUrl: true, thumbnailUrl: true },
    }),
  ]);
  if (jobs.some((j) => j.status === 'UPLOADING')) {
    throw new AutopostError(409, 'upload_in_progress', 'A video is uploading right now. Try again in a few minutes.');
  }

  await db.auditLog.create({
    data: {
      userId: who.userId,
      action: 'autopost.channel.disconnect',
      target: channel.id,
      metadata: { title: channel.title, jobs: jobs.length, apiKeyId: who.apiKeyId },
      ipAddress: who.ip,
      userAgent: who.userAgent?.slice(0, 200) ?? null,
    },
  });

  let revoked = accounts.length === 0;
  for (const a of accounts) revoked = (await revokeGoogleToken(a.refresh_token ?? a.access_token)) || revoked;
  if (accounts.length) await db.account.deleteMany({ where: { id: { in: accounts.map((a) => a.id) } } });

  for (const j of jobs) await removeMediaByUrl(j.videoUrl, { thumbUrl: j.thumbnailUrl });
  // Cascades to the channel jobs and its autopost settings.
  await db.channel.delete({ where: { id: channel.id } });
  log.info('Channel disconnected', { userId: who.userId, channelId: channel.id, revoked });
  return { revoked, jobsRemoved: jobs.length };
}

export async function deleteAccount(who: Who, locale: 'ru' | 'en'): Promise<{ channels: number; jobs: number }> {
  const user = await db.user.findUnique({
    where: { id: who.userId },
    select: {
      id: true,
      email: true,
      plan: true,
      stripeId: true,
      referralEarnings: true,
      _count: { select: { payouts: true, ownedTeams: true, channels: true, uploadJobs: true } },
    },
  });
  if (!user) throw new AutopostError(404, 'not_found', 'Account not found');
  if (user.plan !== 'FREE' || user.stripeId) {
    throw new AutopostError(409, 'billing_active', 'The account has a TubeForge subscription. Cancel it on tubeforge.co first.');
  }
  if (user._count.payouts > 0 || user.referralEarnings > 0) {
    throw new AutopostError(409, 'payouts_exist', 'The account has payouts. Write to support to delete it.');
  }
  if (user._count.ownedTeams > 0) {
    throw new AutopostError(409, 'team_owner', 'The account owns a team on tubeforge.co. Hand it over or delete it first.');
  }
  const uploading = await db.uploadJob.count({ where: { userId: user.id, status: 'UPLOADING' } });
  if (uploading > 0) {
    throw new AutopostError(409, 'upload_in_progress', 'A video is uploading right now. Try again in a few minutes.');
  }

  // Soft state first: no key of this account works from here on.
  await db.apiKey.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });

  await db.auditLog.create({
    data: {
      // userId becomes NULL when the user row goes; target keeps the id.
      userId: user.id,
      action: 'autopost.account.delete',
      target: user.id,
      metadata: {
        emailSha256: user.email ? createHash('sha256').update(user.email).digest('hex') : null,
        channels: user._count.channels,
        jobs: user._count.uploadJobs,
        apiKeyId: who.apiKeyId,
      },
      ipAddress: who.ip,
      userAgent: who.userAgent?.slice(0, 200) ?? null,
    },
  });

  const accounts = await db.account.findMany({
    where: { userId: user.id, provider: 'google' },
    select: { refresh_token: true, access_token: true },
  });
  for (const a of accounts) await revokeGoogleToken(a.refresh_token ?? a.access_token);

  await removeUserMedia(user.id);
  // Cascades: accounts, sessions, channels, jobs, keys, settings, notifications.
  await db.user.delete({ where: { id: user.id } });

  if (user.email) {
    await sendEmail({
      to: user.email,
      template: 'autopost-account-deleted',
      data: { locale, channels: user._count.channels },
    }).catch(() => undefined);
  }
  log.info('Account deleted from the app', { channels: user._count.channels, jobs: user._count.uploadJobs });
  return { channels: user._count.channels, jobs: user._count.uploadJobs };
}
