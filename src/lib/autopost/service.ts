/**
 * Autopost mobile app: channel rules, stock and schedule on top of UploadJob.
 *
 * A video of the app is an UploadJob with consumerRef = AUTOPOST_REF:
 *   QUEUED + scheduledAt = NULL  -> «в запасе» (stock), the worker skips it
 *   QUEUED + scheduledAt         -> scheduled into a slot, uploaded at that time
 *   UPLOADING / COMPLETED / FAILED / CANCELLED as for any job
 * Per-video extras live in UploadJob.metadata.autopost.
 */
import type { AutopostChannel, Prisma, UploadJob } from '@prisma/client';
import { db } from '@/server/db';
import { DAY, MINUTE, safeTimeZone } from './time';
import { checkManualTime, nextFreeSlots, usedOnDay, type ManualTimeProblem, type Rules, type SlotContext, type SlotReason } from './slots';

export const AUTOPOST_REF = 'autopost-app';
/** Protection ceiling per channel and day. The rules may ask for less. */
export const DAILY_CAP = 10;
export const MAX_POSTS_PER_DAY = 10;
export const MAX_SLOTS = 12;

export class AutopostError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AutopostError';
  }
}

// ───────── metadata ─────────

export interface AutopostMeta {
  fileId?: string;
  ext?: string;
  size?: number;
  durationSec?: number | null;
  slotReason?: SlotReason | 'manual' | 'now' | null;
}

export function metaOf(job: Pick<UploadJob, 'metadata'>): AutopostMeta {
  const m = job.metadata as Record<string, unknown> | null;
  const a = m && typeof m === 'object' ? (m.autopost as AutopostMeta | undefined) : undefined;
  return a && typeof a === 'object' ? a : {};
}

function withMeta(job: Pick<UploadJob, 'metadata'>, patch: AutopostMeta): Prisma.InputJsonValue {
  const m = (job.metadata && typeof job.metadata === 'object' ? job.metadata : {}) as Record<string, unknown>;
  return { ...m, autopost: { ...metaOf(job), ...patch } } as Prisma.InputJsonValue;
}

// ───────── settings ─────────

export function rulesOf(s: AutopostChannel): Rules {
  return {
    slotTimes: [...s.slotTimes].sort(),
    weekdays: [...s.weekdays].sort((a, b) => a - b),
    postsPerDay: s.postsPerDay,
    minGapMinutes: s.minGapMinutes,
    timezone: safeTimeZone(s.timezone),
  };
}

export async function ensureSettings(channelId: string, timezone?: string | null): Promise<AutopostChannel> {
  return db.autopostChannel.upsert({
    where: { channelId },
    create: { channelId, timezone: safeTimeZone(timezone) },
    update: {},
  });
}

export async function ownedChannel(userId: string, channelId: string) {
  const channel = await db.channel.findFirst({ where: { id: channelId, userId } });
  if (!channel) throw new AutopostError(404, 'channel_not_found', 'Channel not found');
  return channel;
}

export async function ownedJob(userId: string, jobId: string): Promise<UploadJob> {
  const job = await db.uploadJob.findFirst({ where: { id: jobId, userId } });
  if (!job) throw new AutopostError(404, 'post_not_found', 'Video not found');
  return job;
}

// ───────── occupancy and slot context ─────────

/** Times this channel already uses (recent and planned). */
async function occupied(channelId: string, now: Date, exceptIds: string[] = []): Promise<Date[]> {
  const since = new Date(now.getTime() - 2 * DAY);
  const jobs = await db.uploadJob.findMany({
    where: {
      channelId,
      ...(exceptIds.length ? { id: { notIn: exceptIds } } : {}),
      OR: [
        { status: { in: ['QUEUED', 'UPLOADING', 'COMPLETED'] }, scheduledAt: { gte: since } },
        { status: 'COMPLETED', scheduledAt: null, completedAt: { gte: since } },
        { status: 'UPLOADING', scheduledAt: null },
      ],
    },
    select: { scheduledAt: true, completedAt: true, startedAt: true },
  });
  return jobs
    .map((j) => j.scheduledAt ?? j.completedAt ?? j.startedAt)
    .filter((d): d is Date => d instanceof Date);
}

export async function slotContext(s: AutopostChannel, now: Date, exceptIds: string[] = []): Promise<SlotContext> {
  return {
    rules: rulesOf(s),
    dailyCap: DAILY_CAP,
    occupied: await occupied(s.channelId, now, exceptIds),
    pausedUntil: s.pausedUntil && s.pausedUntil.getTime() > now.getTime() ? s.pausedUntil : null,
  };
}

// ───────── planning ─────────

type Placeable = Pick<UploadJob, 'id' | 'metadata'>;

/**
 * Puts jobs into the nearest free slots one after another, in the given
 * order. Jobs without a slot go to the stock. Returns how many were placed.
 */
async function placeInOrder(s: AutopostChannel, jobs: Placeable[], now: Date): Promise<number> {
  if (jobs.length === 0) return 0;
  const ctx = await slotContext(s, now, jobs.map((j) => j.id));
  let placed = 0;
  const writes: Prisma.PrismaPromise<unknown>[] = [];
  for (const job of jobs) {
    const [slot] = s.autopostEnabled ? nextFreeSlots(ctx, now, 1) : [];
    if (slot) {
      ctx.occupied.push(slot.at);
      placed++;
    }
    writes.push(
      db.uploadJob.updateMany({
        where: { id: job.id, status: 'QUEUED' },
        data: { scheduledAt: slot ? slot.at : null, metadata: withMeta(job, { slotReason: slot ? slot.reason : null }) },
      }),
    );
  }
  await db.$transaction(writes);
  return placed;
}

const stockWhere = (channelId: string): Prisma.UploadJobWhereInput => ({
  channelId,
  consumerRef: AUTOPOST_REF,
  status: 'QUEUED',
  scheduledAt: null,
});

/** Future planned jobs of the app, earliest first. */
async function futurePlan(channelId: string, now: Date, before?: Date) {
  return db.uploadJob.findMany({
    where: {
      channelId,
      consumerRef: AUTOPOST_REF,
      status: 'QUEUED',
      scheduledAt: { gt: new Date(now.getTime() + MINUTE), ...(before ? { lt: before } : {}) },
    },
    orderBy: { scheduledAt: 'asc' },
    select: { id: true, metadata: true },
  });
}

/** Moves stock into free slots while the channel publishes. */
export async function fillStock(s: AutopostChannel, now = new Date()): Promise<number> {
  if (!s.autopostEnabled) return 0;
  const stock = await db.uploadJob.findMany({
    where: stockWhere(s.channelId),
    orderBy: { createdAt: 'asc' },
    select: { id: true, metadata: true },
    take: 500,
  });
  return placeInOrder(s, stock, now);
}

/** New rules: the whole future plan is laid out again, order kept. */
export async function replan(s: AutopostChannel, now = new Date()): Promise<void> {
  const plan = await futurePlan(s.channelId, now);
  const stock = await db.uploadJob.findMany({
    where: stockWhere(s.channelId),
    orderBy: { createdAt: 'asc' },
    select: { id: true, metadata: true },
    take: 500,
  });
  await placeInOrder(s, [...plan, ...stock], now);
}

/** Autopost switched off: the future plan goes back to the stock. */
export async function releasePlan(s: AutopostChannel, now = new Date()): Promise<void> {
  const plan = await futurePlan(s.channelId, now);
  if (plan.length === 0) return;
  await db.$transaction(
    plan.map((job) =>
      db.uploadJob.updateMany({
        where: { id: job.id, status: 'QUEUED' },
        data: { scheduledAt: null, metadata: withMeta(job, { slotReason: null }) },
      }),
    ),
  );
}

/** Pause: everything planned inside the pause moves to slots after it. */
export async function shiftOutOfPause(s: AutopostChannel, now = new Date()): Promise<void> {
  if (!s.pausedUntil || s.pausedUntil.getTime() <= now.getTime()) return;
  const inside = await futurePlan(s.channelId, now, s.pausedUntil);
  await placeInOrder(s, inside, now);
}

const lastMaintain = new Map<string, number>();

/** Cheap catch-up on reads: stock flows into slots that opened with time. */
export async function maintain(userId: string, now = new Date()): Promise<void> {
  const last = lastMaintain.get(userId) ?? 0;
  if (now.getTime() - last < 30_000) return;
  lastMaintain.set(userId, now.getTime());
  if (lastMaintain.size > 5000) lastMaintain.clear();
  const settings = await db.autopostChannel.findMany({
    where: { autopostEnabled: true, channel: { userId } },
  });
  for (const s of settings) {
    const has = await db.uploadJob.count({ where: stockWhere(s.channelId) });
    if (has > 0) await fillStock(s, now);
  }
}

// ───────── rules ─────────

export interface RulesPatch {
  slotTimes?: string[];
  weekdays?: number[];
  postsPerDay?: number;
  minGapMinutes?: number;
  timezone?: string;
}

export async function updateSettings(
  channelId: string,
  patch: { rules?: RulesPatch; autopostEnabled?: boolean; pausedUntil?: string | null },
  now = new Date(),
): Promise<AutopostChannel> {
  const current = await ensureSettings(channelId);
  const data: Prisma.AutopostChannelUpdateInput = {};
  const r = patch.rules;
  if (r) {
    if (r.slotTimes) {
      const slots = [...new Set(r.slotTimes)].sort();
      if (slots.length === 0) throw new AutopostError(400, 'no_slots', 'At least one slot is required');
      if (slots.length > MAX_SLOTS) throw new AutopostError(400, 'too_many_slots', `At most ${MAX_SLOTS} slots`);
      data.slotTimes = slots;
    }
    if (r.weekdays) {
      const days = [...new Set(r.weekdays)].sort((a, b) => a - b);
      if (days.length === 0) throw new AutopostError(400, 'no_weekdays', 'At least one weekday is required');
      data.weekdays = days;
    }
    if (r.postsPerDay != null) data.postsPerDay = Math.max(1, Math.min(MAX_POSTS_PER_DAY, Math.round(r.postsPerDay)));
    if (r.minGapMinutes != null) data.minGapMinutes = Math.max(0, Math.min(24 * 60, Math.round(r.minGapMinutes)));
    if (r.timezone != null) data.timezone = safeTimeZone(r.timezone);
  }
  if (patch.autopostEnabled != null) data.autopostEnabled = patch.autopostEnabled;
  if (patch.pausedUntil !== undefined) {
    if (patch.pausedUntil === null) data.pausedUntil = null;
    else {
      const until = new Date(patch.pausedUntil);
      if (Number.isNaN(until.getTime()) || until.getTime() <= now.getTime()) {
        throw new AutopostError(400, 'invalid_pause', 'The pause must end in the future');
      }
      if (until.getTime() > now.getTime() + 366 * DAY) throw new AutopostError(400, 'invalid_pause', 'The pause is too long');
      data.pausedUntil = until;
    }
  }

  const next = await db.autopostChannel.update({ where: { channelId }, data });

  if (r) await replan(next, now);
  if (patch.autopostEnabled === false && current.autopostEnabled) await releasePlan(next, now);
  if (patch.autopostEnabled === true) await fillStock(next, now);
  if (patch.pausedUntil) await shiftOutOfPause(next, now);
  if (patch.pausedUntil === null) await fillStock(next, now);
  return next;
}

// ───────── videos ─────────

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 5000;

export function checkTitle(raw: string): string {
  const title = raw.trim();
  if (!title) throw new AutopostError(400, 'title_empty', 'Add a title');
  if (title.length > TITLE_MAX) throw new AutopostError(400, 'title_long', 'The title is over 100 characters');
  if (/[<>]/.test(title)) throw new AutopostError(400, 'title_symbols', 'YouTube does not allow < and > in titles');
  return title;
}

export function checkDescription(raw: string): string {
  const d = raw.trim();
  if (d.length > DESCRIPTION_MAX) throw new AutopostError(400, 'description_long', 'The description is over 5000 characters');
  if (/[<>]/.test(d)) throw new AutopostError(400, 'description_symbols', 'YouTube does not allow < and > in descriptions');
  return d;
}

function timeError(problem: ManualTimeProblem): AutopostError {
  const messages: Record<ManualTimeProblem, string> = {
    past: 'That time has passed',
    too_soon: 'Too soon: at least 15 minutes are needed',
    gap: 'Too close to another video of this channel',
    cap: 'The daily limit of the channel is already used that day',
    paused: 'The channel is paused at that time',
    horizon: 'That time is too far ahead',
  };
  return new AutopostError(409, problem, messages[problem]);
}

export interface NewVideo {
  channelId: string;
  title: string;
  description: string;
  fileId: string;
  ext: string;
  size: number;
  durationSec: number | null;
  publishAt: string | 'auto';
  visibility: 'public' | 'unlisted' | 'private';
  videoUrl: string;
  thumbnailUrl: string | null;
}

export async function createVideo(userId: string, apiKeyId: string, input: NewVideo, now = new Date()): Promise<UploadJob> {
  const channel = await ownedChannel(userId, input.channelId);
  const s = await ensureSettings(channel.id);
  const title = checkTitle(input.title);
  const description = checkDescription(input.description);

  let scheduledAt: Date | null = null;
  let slotReason: AutopostMeta['slotReason'] = null;
  if (input.publishAt === 'auto') {
    if (s.autopostEnabled) {
      const [slot] = nextFreeSlots(await slotContext(s, now), now, 1);
      if (slot) {
        scheduledAt = slot.at;
        slotReason = slot.reason;
      }
    }
  } else {
    const at = new Date(input.publishAt);
    const problem = checkManualTime(await slotContext(s, now), at, now);
    if (problem) throw timeError(problem);
    scheduledAt = at;
    slotReason = 'manual';
  }

  const job = await db.uploadJob.create({
    data: {
      userId,
      apiKeyId,
      source: 'API',
      consumerRef: AUTOPOST_REF,
      // One video per uploaded file: a repeated create returns the same job.
      idempotencyKey: input.fileId,
      channelId: channel.id,
      targetPlatform: 'YOUTUBE',
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl,
      title,
      description: description || null,
      privacyStatus: input.visibility,
      scheduledAt,
      status: 'QUEUED',
      metadata: {
        autopost: {
          fileId: input.fileId,
          ext: input.ext,
          size: input.size,
          durationSec: input.durationSec,
          slotReason,
        },
      },
    },
  });
  await db.apiKey.update({ where: { id: apiKeyId }, data: { monthlyUsage: { increment: 1 } } }).catch(() => undefined);
  return job;
}

function isApp(job: UploadJob) {
  return job.consumerRef === AUTOPOST_REF;
}

export async function retryVideo(job: UploadJob, now = new Date()): Promise<UploadJob> {
  if (job.status !== 'FAILED') throw new AutopostError(409, 'invalid_state', 'Only a failed video can be retried');
  const s = await ensureSettings(job.channelId);
  if (s.connectionLostAt) throw new AutopostError(409, 'channel_lost', 'Reconnect the channel first');
  await db.uploadJob.update({
    where: { id: job.id },
    data: { status: 'QUEUED', retryCount: 0, errorMessage: null, startedAt: null, completedAt: null, uploadProgress: 0, scheduledAt: null },
  });
  await placeInOrder(s, [job], now);
  return db.uploadJob.findUniqueOrThrow({ where: { id: job.id } });
}

export async function rescheduleVideo(job: UploadJob, at: string | 'auto', now = new Date()): Promise<UploadJob> {
  if (job.status !== 'QUEUED' && job.status !== 'FAILED') {
    throw new AutopostError(409, 'invalid_state', 'This video can no longer be moved');
  }
  const s = await ensureSettings(job.channelId);
  const ctx = await slotContext(s, now, [job.id]);
  let scheduledAt: Date;
  let slotReason: AutopostMeta['slotReason'];
  if (at === 'auto') {
    // Its own current slot counts as taken: «move» means the next free one.
    if (job.scheduledAt) ctx.occupied.push(job.scheduledAt);
    const [slot] = nextFreeSlots(ctx, now, 1);
    if (!slot) throw new AutopostError(409, 'no_free_slots', 'No free slots: check the channel slots and weekdays');
    scheduledAt = slot.at;
    slotReason = slot.reason;
  } else {
    const when = new Date(at);
    const problem = checkManualTime(ctx, when, now);
    if (problem) throw timeError(problem);
    scheduledAt = when;
    slotReason = 'manual';
  }
  return db.uploadJob.update({
    where: { id: job.id },
    data: {
      status: 'QUEUED',
      scheduledAt,
      errorMessage: null,
      retryCount: 0,
      startedAt: null,
      completedAt: null,
      metadata: withMeta(job, { slotReason }),
    },
  });
}

export async function cancelVideo(job: UploadJob, now = new Date()): Promise<UploadJob> {
  if (job.status !== 'QUEUED' && job.status !== 'FAILED') {
    throw new AutopostError(409, 'invalid_state', `Cannot cancel a video that is ${job.status.toLowerCase()}`);
  }
  const res = await db.uploadJob.updateMany({
    where: { id: job.id, status: { in: ['QUEUED', 'FAILED'] } },
    data: { status: 'CANCELLED', completedAt: now, scheduledAt: null, metadata: withMeta(job, { slotReason: null }) },
  });
  if (res.count === 0) throw new AutopostError(409, 'invalid_state', 'The upload has already started');
  return db.uploadJob.findUniqueOrThrow({ where: { id: job.id } });
}

export async function restoreVideo(job: UploadJob, fileExists: boolean, now = new Date()): Promise<UploadJob> {
  if (job.status !== 'CANCELLED' || !isApp(job)) throw new AutopostError(409, 'invalid_state', 'Only a cancelled video can be restored');
  if (!fileExists) throw new AutopostError(409, 'file_missing', 'The video file is gone, upload it again');
  await db.uploadJob.update({
    where: { id: job.id },
    data: { status: 'QUEUED', scheduledAt: null, completedAt: null, errorMessage: null, retryCount: 0, startedAt: null },
  });
  const s = await ensureSettings(job.channelId);
  await fillStock(s, now);
  return db.uploadJob.findUniqueOrThrow({ where: { id: job.id } });
}

export async function publishVideoNow(job: UploadJob, now = new Date()): Promise<UploadJob> {
  if (job.status !== 'QUEUED') throw new AutopostError(409, 'invalid_state', 'Only a waiting video can go out now');
  const s = await ensureSettings(job.channelId);
  if (s.connectionLostAt) throw new AutopostError(409, 'channel_lost', 'Reconnect the channel first');
  if (s.pausedUntil && s.pausedUntil.getTime() > now.getTime()) throw new AutopostError(409, 'paused', 'The channel is paused');
  const ctx = await slotContext(s, now, [job.id]);
  const used = usedOnDay(
    ctx.occupied.filter((d) => d.getTime() <= now.getTime()),
    now,
    ctx.rules.timezone,
  );
  if (used >= DAILY_CAP) throw new AutopostError(409, 'cap', 'The daily limit of the channel is used up');
  return db.uploadJob.update({
    where: { id: job.id },
    data: { scheduledAt: now, metadata: withMeta(job, { slotReason: 'now' }) },
  });
}

export async function editVideo(job: UploadJob, patch: { title?: string; description?: string }): Promise<UploadJob> {
  if (job.status !== 'QUEUED' && job.status !== 'FAILED' && job.status !== 'CANCELLED') {
    throw new AutopostError(409, 'invalid_state', 'The video is already on YouTube');
  }
  const data: Prisma.UploadJobUpdateInput = {};
  if (patch.title != null) data.title = checkTitle(patch.title);
  if (patch.description != null) data.description = checkDescription(patch.description) || null;
  const res = await db.uploadJob.updateMany({ where: { id: job.id, status: job.status }, data });
  if (res.count === 0) throw new AutopostError(409, 'invalid_state', 'The upload has already started');
  return db.uploadJob.findUniqueOrThrow({ where: { id: job.id } });
}

export async function suggestSlots(channelId: string, count: number, now = new Date()) {
  const s = await ensureSettings(channelId);
  return nextFreeSlots(await slotContext(s, now), now, Math.max(1, Math.min(10, count)));
}

/** After a reconnect, videos that failed because of the token get new slots. */
export async function afterReconnect(channelId: string, now = new Date()): Promise<void> {
  const s = await db.autopostChannel.update({ where: { channelId }, data: { connectionLostAt: null } });
  const failed = await db.uploadJob.findMany({
    where: { channelId, consumerRef: AUTOPOST_REF, status: 'FAILED' },
    orderBy: { createdAt: 'asc' },
  });
  const auth = failed.filter((j) => classifyError(j.errorMessage) === 'auth');
  if (auth.length === 0) return;
  await db.uploadJob.updateMany({
    where: { id: { in: auth.map((j) => j.id) }, status: 'FAILED' },
    data: { status: 'QUEUED', scheduledAt: null, errorMessage: null, retryCount: 0, completedAt: null, startedAt: null },
  });
  await placeInOrder(s, auth, now);
}

// ───────── errors ─────────

export type ErrorCode = 'quota' | 'auth' | 'file_missing' | 'duplicate' | 'network' | 'rejected' | 'unknown';

/** Maps a worker error message to a code the app explains to people. */
export function classifyError(message: string | null | undefined): ErrorCode {
  const m = message ?? '';
  if (!m) return 'unknown';
  if (/quotaExceeded|uploadLimitExceeded|rateLimitExceeded|dailyLimitExceeded|HTTP 429/i.test(m)) return 'quota';
  if (/not connected|Token refresh failed|invalid_grant|HTTP 401|unauthorized|youtubeSignupRequired|forbidden.*channel/i.test(m)) return 'auth';
  if (/Source video fetch failed|media file is missing|ENOENT|has no body/i.test(m)) return 'file_missing';
  if (/duplicate/i.test(m)) return 'duplicate';
  if (/aborted|ECONNRESET|ETIMEDOUT|timeout|stalled|fetch failed|socket/i.test(m)) return 'network';
  if (/HTTP 400|HTTP 403|invalid|rejected/i.test(m)) return 'rejected';
  return 'unknown';
}
