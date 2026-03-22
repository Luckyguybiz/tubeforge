/**
 * REST API v1 — Current user info.
 *
 * GET /api/v1/me — Get current API key owner's profile and usage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';
import { lookupApiKey, getApiUsage } from '@/lib/api-keys';
import { getPlanLimits } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7).trim();
  const userId = await lookupApiKey(token);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const { success, remaining, reset } = await rateLimit({
    identifier: `api:v1:${userId}`,
    limit: 60,
    window: 60,
  });
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, image: true, plan: true,
        aiUsage: true, aiResetAt: true,
        createdAt: true,
        _count: { select: { projects: true, webhookEndpoints: true, apiKeys: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const limits = getPlanLimits(user.plan);
    const apiUsage = await getApiUsage(userId);

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        plan: user.plan,
        usage: {
          aiGenerations: { used: user.aiUsage, limit: limits.aiGenerations, resetsAt: user.aiResetAt },
          projects: { used: user._count.projects, limit: limits.projects },
          apiCalls: apiUsage,
          webhooks: user._count.webhookEndpoints,
          apiKeys: user._count.apiKeys,
        },
        createdAt: user.createdAt,
      },
    }, {
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
      },
    });
  } catch (err) {
    console.error('[API v1] GET /me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
