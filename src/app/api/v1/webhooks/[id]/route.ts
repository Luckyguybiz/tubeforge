/**
 * REST API v1 — Single webhook operations.
 *
 * DELETE /api/v1/webhooks/:id — Delete a webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';
import { lookupApiKey } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

async function authenticateRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return lookupApiKey(authHeader.slice(7).trim());
}

type RouteContext = { params: Promise<Record<string, string>> };

/** DELETE /api/v1/webhooks/:id */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const userId = await authenticateRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await rateLimit({ identifier: `api:v1:${userId}`, limit: 60, window: 60 });
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const { id } = await ctx.params;

  const entry = await db.webhookEndpoint.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!entry) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });

  await db.webhookEndpoint.delete({ where: { id } });
  return NextResponse.json({ data: { id, deleted: true } });
}
