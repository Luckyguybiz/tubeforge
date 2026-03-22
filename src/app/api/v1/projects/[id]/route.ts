/**
 * REST API v1 — Single project operations.
 *
 * GET    /api/v1/projects/:id  — Get project details
 * PUT    /api/v1/projects/:id  — Update project
 * DELETE /api/v1/projects/:id  — Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';
import { lookupApiKey } from '@/lib/api-keys';
import { stripTags } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function authenticateRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  return lookupApiKey(token);
}

async function checkRateLimit(userId: string) {
  const { success, remaining, reset } = await rateLimit({
    identifier: `api:v1:${userId}`,
    limit: 60,
    window: 60,
  });
  return { success, remaining, reset };
}

function rateLimitHeaders(remaining: number, reset: number) {
  return {
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
  };
}

type RouteContext = { params: Promise<Record<string, string>> };

/** GET /api/v1/projects/:id */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const userId = await authenticateRequest(req);
  if (!userId) return jsonError('Unauthorized', 401);

  const rl = await checkRateLimit(userId);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, {
      status: 429,
      headers: { ...rateLimitHeaders(0, rl.reset), 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    });
  }

  const { id } = await ctx.params;

  try {
    const project = await db.project.findFirst({
      where: { id, userId },
      select: {
        id: true, title: true, description: true, status: true,
        tags: true, thumbnailUrl: true, createdAt: true, updatedAt: true,
        _count: { select: { scenes: true } },
        scenes: {
          select: { id: true, label: true, prompt: true, duration: true, order: true, status: true, model: true, videoUrl: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!project) return jsonError('Project not found', 404);

    return NextResponse.json({
      data: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        tags: project.tags,
        thumbnailUrl: project.thumbnailUrl,
        sceneCount: project._count.scenes,
        scenes: project.scenes,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    }, { headers: rateLimitHeaders(rl.remaining, rl.reset) });
  } catch (err) {
    console.error('[API v1] GET /projects/:id error:', err);
    return jsonError('Internal server error', 500);
  }
}

/** PUT /api/v1/projects/:id */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const userId = await authenticateRequest(req);
  if (!userId) return jsonError('Unauthorized', 401);

  const rl = await checkRateLimit(userId);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, {
      status: 429,
      headers: { ...rateLimitHeaders(0, rl.reset), 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    });
  }

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  // Verify ownership
  const existing = await db.project.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return jsonError('Project not found', 404);

  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string') data.title = stripTags(body.title).slice(0, 100);
  if (typeof body.description === 'string') data.description = stripTags(body.description).slice(0, 5000);
  if (Array.isArray(body.tags)) {
    data.tags = body.tags
      .filter((t): t is string => typeof t === 'string')
      .slice(0, 30)
      .map((t) => stripTags(t).slice(0, 100));
  }
  const validStatuses = ['DRAFT', 'RENDERING', 'READY', 'PUBLISHED'];
  if (typeof body.status === 'string' && validStatuses.includes(body.status.toUpperCase())) {
    data.status = body.status.toUpperCase();
  }

  if (Object.keys(data).length === 0) {
    return jsonError('No valid fields to update', 400);
  }

  try {
    const project = await db.project.update({
      where: { id },
      data,
      select: {
        id: true, title: true, description: true, status: true,
        tags: true, createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ data: project }, { headers: rateLimitHeaders(rl.remaining, rl.reset) });
  } catch (err) {
    console.error('[API v1] PUT /projects/:id error:', err);
    return jsonError('Internal server error', 500);
  }
}

/** DELETE /api/v1/projects/:id */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const userId = await authenticateRequest(req);
  if (!userId) return jsonError('Unauthorized', 401);

  const rl = await checkRateLimit(userId);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, {
      status: 429,
      headers: { ...rateLimitHeaders(0, rl.reset), 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    });
  }

  const { id } = await ctx.params;

  const existing = await db.project.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return jsonError('Project not found', 404);

  try {
    await db.project.delete({ where: { id } });
    return NextResponse.json({ data: { id, deleted: true } }, { headers: rateLimitHeaders(rl.remaining, rl.reset) });
  } catch (err) {
    console.error('[API v1] DELETE /projects/:id error:', err);
    return jsonError('Internal server error', 500);
  }
}
