import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';
import { lookupApiKey, incrementApiUsage } from '@/lib/api-keys';
import { stripTags } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

/** Standard JSON error response. */
function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Authenticate the request using Bearer token from Authorization header.
 * Looks up the API key hash in the database and returns the userId.
 */
async function authenticateRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  return lookupApiKey(token);
}

/**
 * GET /api/v1/projects — List user's projects (paginated).
 *
 * Query params:
 *   page (default 1)
 *   limit (default 20, max 50)
 *   status (optional: DRAFT | RENDERING | READY | PUBLISHED)
 */
export async function GET(req: NextRequest) {
  // Auth
  const userId = await authenticateRequest(req);
  if (!userId) {
    return jsonError('Unauthorized. Provide a valid Bearer token in the Authorization header.', 401);
  }

  // Rate limit: 60 req/min per user
  const { success, remaining, reset } = await rateLimit({
    identifier: `api:v1:${userId}`,
    limit: 60,
    window: 60,
  });
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 60 requests per minute.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  // Track usage
  incrementApiUsage(userId);

  // Parse query params
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const status = url.searchParams.get('status')?.toUpperCase();

  const validStatuses = ['DRAFT', 'RENDERING', 'READY', 'PUBLISHED'];
  const where: Record<string, unknown> = { userId };
  if (status && validStatuses.includes(status)) {
    where.status = status;
  }

  try {
    const [items, total] = await Promise.all([
      db.project.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          tags: true,
          thumbnailUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { scenes: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.project.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: items.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          tags: p.tags,
          thumbnailUrl: p.thumbnailUrl,
          sceneCount: p._count.scenes,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
        },
      },
    );
  } catch (err) {
    console.error('[API v1] GET /projects error:', err);
    return jsonError('Internal server error.', 500);
  }
}

/**
 * POST /api/v1/projects — Create a new project.
 *
 * Body (JSON):
 *   title (optional, max 100 chars)
 *   description (optional, max 5000 chars)
 *   tags (optional, array of strings, max 30)
 */
export async function POST(req: NextRequest) {
  // Auth
  const userId = await authenticateRequest(req);
  if (!userId) {
    return jsonError('Unauthorized. Provide a valid Bearer token in the Authorization header.', 401);
  }

  // Rate limit: 60 req/min per user
  const { success, remaining, reset } = await rateLimit({
    identifier: `api:v1:${userId}`,
    limit: 60,
    window: 60,
  });
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 60 requests per minute.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  // Track usage
  incrementApiUsage(userId);

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body.', 400);
  }

  const title = typeof body.title === 'string' ? stripTags(body.title).slice(0, 100) : undefined;
  const description = typeof body.description === 'string' ? stripTags(body.description).slice(0, 5000) : undefined;
  const rawTags = Array.isArray(body.tags) ? body.tags : undefined;
  const tags = rawTags
    ?.filter((t): t is string => typeof t === 'string')
    .slice(0, 30)
    .map((t) => stripTags(t).slice(0, 100));

  try {
    // Atomic plan limit check + project creation inside a transaction
    // to prevent race conditions where concurrent requests bypass the limit
    const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 25, STUDIO: Infinity };

    const project = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true, _count: { select: { projects: true } } },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const planLimit = PLAN_LIMITS[user.plan] ?? 3;

      if (user._count.projects >= planLimit) {
        throw new Error('PLAN_LIMIT_REACHED');
      }

      return tx.project.create({
        data: {
          title: title || 'Untitled',
          description: description ?? null,
          tags: tags ?? [],
          userId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json(
      { data: project },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
        },
      },
    );
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'USER_NOT_FOUND') return jsonError('User not found.', 404);
      if (err.message === 'PLAN_LIMIT_REACHED') return jsonError('Project limit reached. Upgrade your plan.', 403);
    }
    console.error('[API v1] POST /projects error:', err);
    return jsonError('Internal server error.', 500);
  }
}
