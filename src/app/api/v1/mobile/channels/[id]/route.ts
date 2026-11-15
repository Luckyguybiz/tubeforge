/**
 * GET    /api/v1/mobile/channels/:id
 * PATCH  /api/v1/mobile/channels/:id  { autopostEnabled?, pausedUntil?, rules? }
 * DELETE /api/v1/mobile/channels/:id  disconnects: Google access revoked,
 *        the channel and its schedule removed. Videos already on YouTube stay.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp, fail, ok, readBody, requireUser } from '@/lib/autopost/http';
import { listMobileChannels } from '@/lib/autopost/present';
import { AutopostError, ownedChannel, updateSettings } from '@/lib/autopost/service';
import { disconnectChannel } from '@/lib/autopost/account';
import { isValidTimeZone, normaliseSlot } from '@/lib/autopost/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const Patch = z
  .object({
    autopostEnabled: z.boolean().optional(),
    pausedUntil: z.string().datetime({ offset: true }).nullable().optional(),
    rules: z
      .object({
        slotTimes: z
          .array(z.string().max(5))
          .max(12)
          .transform((list, ctx) => {
            const out: string[] = [];
            for (const s of list) {
              const n = normaliseSlot(s);
              if (!n) {
                ctx.addIssue({ code: 'custom', message: `Bad slot time: ${s}` });
                return z.NEVER;
              }
              out.push(n);
            }
            return out;
          })
          .optional(),
        weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
        postsPerDay: z.number().int().min(1).max(10).optional(),
        minGapMinutes: z.number().int().min(0).max(1440).optional(),
        timezone: z.string().max(64).refine(isValidTimeZone, 'Unknown time zone').optional(),
      })
      .optional(),
  })
  .strict();

async function one(userId: string, id: string) {
  const found = (await listMobileChannels(userId)).find((c) => c.id === id);
  if (!found) throw new AutopostError(404, 'channel_not_found', 'Channel not found');
  return found;
}

function handle(e: unknown) {
  if (e instanceof AutopostError) return fail(e.status, e.code, e.message);
  throw e;
}

export async function GET(req: Request, { params }: Ctx) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    return ok({ channel: await one(auth.userId, id) });
  } catch (e) {
    return handle(e);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await readBody(req, Patch);
  if (!body.ok) return body.response;
  try {
    await ownedChannel(auth.userId, id);
    await updateSettings(id, body.data);
    return ok({ channel: await one(auth.userId, id) });
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const result = await disconnectChannel(
      { userId: auth.userId, apiKeyId: auth.apiKeyId, ip: clientIp(req), userAgent: req.headers.get('user-agent') },
      id,
    );
    return ok({ disconnected: true, ...result });
  } catch (e) {
    return handle(e);
  }
}
