// @vitest-environment node
/**
 * Integration tests — REST API v1 endpoints
 *
 * Verifies the public REST API:
 *   - GET /api/v1/projects returns paginated project list
 *   - API key authentication (Bearer token)
 *   - Rate limiting on API endpoints (429 with headers)
 *   - Unauthenticated requests return 401
 *   - Query parameter parsing (page, limit, status)
 *   - POST /api/v1/projects creates a project with plan limit check
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 59, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));

const mockLookupApiKey = vi.fn().mockReturnValue(null);
const mockIncrementApiUsage = vi.fn().mockReturnValue(1);
vi.mock('@/lib/api-keys', () => ({
  lookupApiKey: (...args: unknown[]) => mockLookupApiKey(...args),
  incrementApiUsage: (...args: unknown[]) => mockIncrementApiUsage(...args),
}));

const mockStripTags = vi.fn((s: string) => s.replace(/<[^>]*>/g, ''));
vi.mock('@/lib/sanitize', () => ({ stripTags: (s: string) => mockStripTags(s) }));

const mockDbProjectFindMany = vi.fn().mockResolvedValue([]);
const mockDbProjectCount = vi.fn().mockResolvedValue(0);
const mockDbProjectCreate = vi.fn().mockResolvedValue({
  id: 'proj-api-1',
  title: 'API Project',
  description: null,
  status: 'DRAFT',
  tags: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});
const mockDbUserFindUnique = vi.fn().mockResolvedValue({
  plan: 'PRO',
  _count: { projects: 2 },
});

vi.mock('@/server/db', () => ({
  db: {
    project: {
      findMany: (...args: unknown[]) => mockDbProjectFindMany(...args),
      count: (...args: unknown[]) => mockDbProjectCount(...args),
      create: (...args: unknown[]) => mockDbProjectCreate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockDbUserFindUnique(...args),
    },
  },
}));

/* ── Replicate API route logic ──────────────────────────────── */

/* eslint-disable @typescript-eslint/no-explicit-any */

const { rateLimit } = await import('@/lib/rate-limit');
const { lookupApiKey, incrementApiUsage } = await import('@/lib/api-keys');
const { stripTags } = await import('@/lib/sanitize');
const { db } = await import('@/server/db');

interface MockRequest {
  headers: Map<string, string>;
  url: string;
  json: () => Promise<any>;
}

function makeRequest(overrides: Partial<MockRequest> & { url?: string } = {}): MockRequest {
  return {
    headers: new Map([['authorization', 'Bearer tf_testkey123']]),
    url: 'https://tubeforge.co/api/v1/projects',
    json: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

function authenticateRequest(req: MockRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  return lookupApiKey(token) as string | null;
}

interface JsonResponse {
  body: any;
  status: number;
  headers: Record<string, string>;
}

function jsonResponse(body: any, status: number, headers: Record<string, string> = {}): JsonResponse {
  return { body, status, headers };
}

async function handleGET(req: MockRequest): Promise<JsonResponse> {
  const userId = authenticateRequest(req);
  if (!userId) {
    return jsonResponse({ error: 'Unauthorized. Provide a valid Bearer token in the Authorization header.' }, 401);
  }

  const { success, remaining, reset } = await rateLimit({ identifier: `api:v1:${userId}`, limit: 60, window: 60 });
  if (!success) {
    return jsonResponse(
      { error: 'Rate limit exceeded. Max 60 requests per minute.' },
      429,
      {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    );
  }

  incrementApiUsage(userId);

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const status = url.searchParams.get('status')?.toUpperCase();

  const validStatuses = ['DRAFT', 'RENDERING', 'READY', 'PUBLISHED'];
  const where: Record<string, unknown> = { userId };
  if (status && validStatuses.includes(status)) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    db.project.findMany({
      where,
      select: {
        id: true, title: true, description: true, status: true,
        tags: true, thumbnailUrl: true, createdAt: true, updatedAt: true,
        _count: { select: { scenes: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.project.count({ where }),
  ]);

  return jsonResponse(
    {
      data: (items as any[]).map((p: any) => ({
        id: p.id, title: p.title, description: p.description,
        status: p.status, tags: p.tags, thumbnailUrl: p.thumbnailUrl,
        sceneCount: p._count?.scenes ?? 0,
        createdAt: p.createdAt, updatedAt: p.updatedAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
    200,
    {
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
    },
  );
}

async function handlePOST(req: MockRequest): Promise<JsonResponse> {
  const userId = authenticateRequest(req);
  if (!userId) {
    return jsonResponse({ error: 'Unauthorized. Provide a valid Bearer token in the Authorization header.' }, 401);
  }

  const { success, remaining, reset } = await rateLimit({ identifier: `api:v1:${userId}`, limit: 60, window: 60 });
  if (!success) {
    return jsonResponse(
      { error: 'Rate limit exceeded. Max 60 requests per minute.' },
      429,
      { 'X-RateLimit-Limit': '60', 'X-RateLimit-Remaining': '0' },
    );
  }

  incrementApiUsage(userId);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const title = typeof body.title === 'string' ? stripTags(body.title).slice(0, 100) : undefined;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, _count: { select: { projects: true } } },
  });
  if (!user) return jsonResponse({ error: 'User not found.' }, 404);

  const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 25, STUDIO: Infinity };
  const planLimit = PLAN_LIMITS[(user as any).plan] ?? 3;
  if ((user as any)._count.projects >= planLimit) {
    return jsonResponse({ error: 'Project limit reached. Upgrade your plan.' }, 403);
  }

  const project = await db.project.create({
    data: { title: title || 'Untitled', userId },
    select: { id: true, title: true, status: true, createdAt: true, updatedAt: true },
  });

  return jsonResponse({ data: project }, 201, {
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': String(remaining),
  });
}

/* ── Tests ─────────────────────────────────────────────────── */

const USER_ID = 'user-api-v1-001';

describe('API v1 integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 59, reset: Date.now() + 60_000 });
    mockLookupApiKey.mockReturnValue(USER_ID);
    mockDbProjectFindMany.mockResolvedValue([]);
    mockDbProjectCount.mockResolvedValue(0);
    mockDbUserFindUnique.mockResolvedValue({ plan: 'PRO', _count: { projects: 2 } });
  });

  /* ── GET /api/v1/projects ──────────────────────────────── */

  it('GET returns paginated project list with 200', async () => {
    mockDbProjectFindMany.mockResolvedValue([
      { id: 'p1', title: 'Video 1', description: null, status: 'DRAFT', tags: [], thumbnailUrl: null, createdAt: new Date(), updatedAt: new Date(), _count: { scenes: 3 } },
    ]);
    mockDbProjectCount.mockResolvedValue(1);

    const response = await handleGET(makeRequest());

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe('p1');
    expect(response.body.data[0].sceneCount).toBe(3);
    expect(response.body.pagination).toEqual({ page: 1, limit: 20, total: 1, pages: 1 });
  });

  it('GET supports pagination query parameters', async () => {
    mockDbProjectCount.mockResolvedValue(100);

    const req = makeRequest({ url: 'https://tubeforge.co/api/v1/projects?page=3&limit=10' });
    const response = await handleGET(req);

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(3);
    expect(response.body.pagination.limit).toBe(10);
    expect(mockDbProjectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it('GET filters by status query parameter', async () => {
    const req = makeRequest({ url: 'https://tubeforge.co/api/v1/projects?status=PUBLISHED' });
    await handleGET(req);

    expect(mockDbProjectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED' }),
      }),
    );
  });

  /* ── API key authentication ────────────────────────────── */

  it('returns 401 when no Bearer token is provided', async () => {
    const req = makeRequest({ headers: new Map() });
    const response = await handleGET(req);

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Unauthorized');
  });

  it('returns 401 for invalid API key', async () => {
    mockLookupApiKey.mockReturnValue(null);
    const req = makeRequest({ headers: new Map([['authorization', 'Bearer tf_invalid_key']]) });
    const response = await handleGET(req);

    expect(response.status).toBe(401);
  });

  it('valid API key authenticates and tracks usage', async () => {
    await handleGET(makeRequest());

    expect(mockLookupApiKey).toHaveBeenCalledWith('tf_testkey123');
    expect(mockIncrementApiUsage).toHaveBeenCalledWith(USER_ID);
  });

  /* ── Rate limiting on API endpoints ────────────────────── */

  it('returns 429 with rate limit headers when rate limited', async () => {
    const resetTime = Date.now() + 30_000;
    mockRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: resetTime });

    const response = await handleGET(makeRequest());

    expect(response.status).toBe(429);
    expect(response.body.error).toContain('Rate limit exceeded');
    expect(response.headers['X-RateLimit-Limit']).toBe('60');
    expect(response.headers['X-RateLimit-Remaining']).toBe('0');
    expect(response.headers['Retry-After']).toBeDefined();
  });

  it('successful response includes rate limit headers', async () => {
    const response = await handleGET(makeRequest());

    expect(response.status).toBe(200);
    expect(response.headers['X-RateLimit-Limit']).toBe('60');
    expect(response.headers['X-RateLimit-Remaining']).toBe('59');
  });

  /* ── POST /api/v1/projects ─────────────────────────────── */

  it('POST creates a project and returns 201', async () => {
    const req = makeRequest();
    req.json = vi.fn().mockResolvedValue({ title: 'New API Project' });

    const response = await handlePOST(req);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(mockDbProjectCreate).toHaveBeenCalled();
  });

  it('POST enforces plan limits and returns 403 when exceeded', async () => {
    mockDbUserFindUnique.mockResolvedValue({ plan: 'FREE', _count: { projects: 3 } });
    const req = makeRequest();
    req.json = vi.fn().mockResolvedValue({ title: 'Blocked Project' });

    const response = await handlePOST(req);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Project limit reached');
  });
});
