// @vitest-environment node
/**
 * TubeForge MCP server — end-to-end over an in-memory transport.
 *
 * A real MCP Client talks to the real McpServer; Prisma and the YouTube
 * API are mocked. Covers: tool discovery, channel scoping, video listing
 * (no search.list), preview/confirm flow for edits, scope gating for
 * write tools, comments, calendar and upload scheduling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

/* ── Mocks ─────────────────────────────────────────────────────────── */

vi.mock('@/lib/env', () => ({
  env: { AUTH_GOOGLE_ID: 'cid', AUTH_GOOGLE_SECRET: 'csecret', YOUTUBE_API_KEY: 'yt-app-key', NEXT_PUBLIC_APP_URL: 'https://tubeforge.co' },
}));

const OWN_CHANNEL = 'UCaaaaaaaaaaaaaaaaaaaaaa';
const EXT_CHANNEL = 'UCbbbbbbbbbbbbbbbbbbbbbb';

const state = {
  scope: 'openid email https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/yt-analytics.readonly',
  channels: [
    { id: OWN_CHANNEL, title: 'Lucky Own', thumbnail: null, subscribers: 100, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-08-01') },
  ],
  externalUsers: [] as Array<{ externalUserId: string; oauthAccountId: string | null; channel: { id: string; title: string } | null }>,
  jobs: [] as Array<Record<string, unknown>>,
};

const mockDb = {
  account: {
    findFirst: vi.fn(async () => ({ id: 'acc-1', access_token: 'tok', refresh_token: 'ref', expires_at: Math.floor(Date.now() / 1000) + 3600, scope: state.scope })),
    findUnique: vi.fn(async () => ({ id: 'acc-ext', access_token: 'tok-ext', refresh_token: 'ref', expires_at: Math.floor(Date.now() / 1000) + 3600, scope: state.scope })),
    update: vi.fn(async () => ({ id: 'acc-1' })),
  },
  channel: {
    findMany: vi.fn(async (args: { where?: { id?: { in: string[] }; userId?: string } }) => {
      const ids = args.where?.id?.in;
      return state.channels.filter((c) => (ids ? ids.includes(c.id) : true));
    }),
    findFirst: vi.fn(async (args: { where: { id: string } }) => {
      const c = state.channels.find((x) => x.id === args.where.id);
      return c ? { id: c.id, platform: 'YOUTUBE' } : null;
    }),
    upsert: vi.fn(async () => ({})),
  },
  externalUser: {
    findMany: vi.fn(async () => state.externalUsers),
    findUnique: vi.fn(async () => null),
  },
  uploadJob: {
    findFirst: vi.fn(async () => null),
    findMany: vi.fn(async () => state.jobs),
    create: vi.fn((args: { data: Record<string, unknown> }) => ({ ...args.data, id: `job-${state.jobs.length + 1}` })),
  },
  apiKey: { update: vi.fn(async () => ({})) },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
};
vi.mock('@/server/db', () => ({ db: mockDb }));

type FetchHandler = (url: URL, init: RequestInit) => Response | Promise<Response>;
const fetchRoutes: Array<{ match: (u: URL, init: RequestInit) => boolean; handle: FetchHandler }> = [];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
  const route = fetchRoutes.find((r) => r.match(url, init));
  if (!route) throw new Error(`Unexpected fetch: ${init.method ?? 'GET'} ${url.toString()}`);
  return route.handle(url, init);
}));

const { createTubeForgeMcpServer } = await import('@/server/mcp/server');

async function connect(auth = { userId: 'user-1', apiKeyId: 'key-1', monthlyQuota: 1000, monthlyUsage: 0 }) {
  const server = createTubeForgeMcpServer({ auth, origin: 'https://tubeforge.co' });
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await server.connect(serverT);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientT);
  return { client, server };
}

function videoResource(id: string, title: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    snippet: { title, description: 'desc', tags: ['a'], categoryId: '22', channelId: OWN_CHANNEL, publishedAt: '2026-08-20T10:00:00Z', thumbnails: { medium: { url: 'https://i.ytimg.com/x.jpg' } } },
    status: { privacyStatus: 'public', uploadStatus: 'processed' },
    statistics: { viewCount: '1234', likeCount: '10', commentCount: '2' },
    contentDetails: { duration: 'PT1M5S' },
    ...extra,
  };
}

beforeEach(() => {
  fetchRoutes.length = 0;
  state.scope = 'openid email https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/yt-analytics.readonly';
  state.externalUsers = [];
  state.jobs = [];
  vi.clearAllMocks();
});

/* ── Tests ─────────────────────────────────────────────────────────── */

describe('MCP server: discovery', () => {
  it('exposes the channel-operator tool set and prompts', async () => {
    const { client } = await connect();
    const tools = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual([
      'tubeforge_get_calendar',
      'tubeforge_get_channel_stats',
      'tubeforge_get_upload_job',
      'tubeforge_get_video',
      'tubeforge_list_channels',
      'tubeforge_list_comments',
      'tubeforge_list_videos',
      'tubeforge_reply_comments',
      'tubeforge_schedule_uploads',
      'tubeforge_set_thumbnail',
      'tubeforge_update_videos',
    ]);
    const prompts = (await client.listPrompts()).prompts.map((p) => p.name).sort();
    expect(prompts).toEqual(['answer_comments', 'publish_week', 'retitle_underperformers', 'weekly_channel_review']);
  });

  it('write tools are annotated as non-read-only, read tools as read-only', async () => {
    const { client } = await connect();
    const byName = Object.fromEntries((await client.listTools()).tools.map((t) => [t.name, t.annotations]));
    expect(byName.tubeforge_list_videos?.readOnlyHint).toBe(true);
    expect(byName.tubeforge_update_videos?.readOnlyHint).toBe(false);
    expect(byName.tubeforge_reply_comments?.readOnlyHint).toBe(false);
  });
});

describe('tubeforge_list_channels', () => {
  it('returns own channels plus Publishing-API channels of this key', async () => {
    state.externalUsers = [{ externalUserId: 'maker_7', oauthAccountId: 'acc-ext', channel: { id: EXT_CHANNEL, title: 'Maker 7' } }];
    state.channels.push({ id: EXT_CHANNEL, title: 'Maker 7', thumbnail: null, subscribers: 5, createdAt: new Date('2026-02-01'), updatedAt: new Date('2026-08-01') });
    try {
      const { client } = await connect();
      const res = await client.callTool({ name: 'tubeforge_list_channels', arguments: {} });
      const data = res.structuredContent as { channels: Array<{ channelId: string; source: string }>; quotaUnits: number };
      expect(data.channels.map((c) => [c.channelId, c.source])).toEqual([
        [EXT_CHANNEL, 'publishing_api'],
        [OWN_CHANNEL, 'own'],
      ]);
      expect(data.quotaUnits).toBe(0);
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      state.channels.pop();
    }
  });

  it('refresh=true syncs from channels.list?mine=true (1 unit)', async () => {
    fetchRoutes.push({
      match: (u) => u.pathname === '/youtube/v3/channels' && u.searchParams.get('mine') === 'true',
      handle: () => json({ items: [{ id: OWN_CHANNEL, snippet: { title: 'Lucky Own (new)' }, statistics: { subscriberCount: '150' } }] }),
    });
    const { client } = await connect();
    const res = await client.callTool({ name: 'tubeforge_list_channels', arguments: { refresh: true } });
    expect((res.structuredContent as { quotaUnits: number }).quotaUnits).toBe(1);
    expect(mockDb.channel.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: OWN_CHANNEL } }));
  });
});

describe('tubeforge_list_videos', () => {
  it('lists uploads via the UU playlist and videos.list, never search.list', async () => {
    fetchRoutes.push({
      match: (u) => u.pathname === '/youtube/v3/playlistItems',
      handle: (u) => {
        expect(u.searchParams.get('playlistId')).toBe(`UU${OWN_CHANNEL.slice(2)}`);
        expect(u.searchParams.get('maxResults')).toBe('2');
        return json({ items: [{ id: 'p1', contentDetails: { videoId: 'vid00000001' } }, { id: 'p2', contentDetails: { videoId: 'vid00000002' } }], nextPageToken: 'NEXT', pageInfo: { totalResults: 40 } });
      },
    });
    fetchRoutes.push({
      match: (u) => u.pathname === '/youtube/v3/videos',
      handle: (u) => {
        expect(u.searchParams.get('id')).toBe('vid00000001,vid00000002');
        return json({ items: [videoResource('vid00000001', 'How to farm diamonds'), videoResource('vid00000002', 'Cat plays piano')] });
      },
    });
    const { client } = await connect();
    const res = await client.callTool({ name: 'tubeforge_list_videos', arguments: { limit: 2, query: 'diamond' } });
    const data = res.structuredContent as { videos: Array<{ videoId: string; viewCount: number; durationSeconds: number; isShorts: boolean }>; nextPageToken: string; totalUploads: number; quotaUnits: number };
    expect(data.videos).toHaveLength(1);
    expect(data.videos[0]).toMatchObject({ videoId: 'vid00000001', viewCount: 1234, durationSeconds: 65, isShorts: true });
    expect(data.nextPageToken).toBe('NEXT');
    expect(data.totalUploads).toBe(40);
    expect(data.quotaUnits).toBe(2);
    const calls = (fetch as unknown as { mock: { calls: Array<[string]> } }).mock.calls.map((c) => new URL(c[0]).pathname);
    expect(calls).not.toContain('/youtube/v3/search');
  });

  it('refuses channels not connected to this key', async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: 'tubeforge_list_videos', arguments: { channelId: EXT_CHANNEL } });
    expect(res.isError).toBe(true);
    expect((res.structuredContent as { error: { code: string } }).error.code).toBe('channel_not_found');
  });
});

describe('tubeforge_update_videos', () => {
  const videosRoute = () =>
    fetchRoutes.push({
      match: (u, init) => u.pathname === '/youtube/v3/videos' && (init.method ?? 'GET') === 'GET',
      handle: () => json({ items: [videoResource('vid00000001', 'Old title'), videoResource('vid00000002', 'Same title')] }),
    });

  it('confirm=false returns a before/after preview and performs no write', async () => {
    videosRoute();
    const { client } = await connect();
    const res = await client.callTool({
      name: 'tubeforge_update_videos',
      arguments: { items: [{ video: 'https://youtu.be/vid00000001', title: 'New title' }, { video: 'vid00000002', title: 'Same title' }] },
    });
    expect(res.isError).toBeFalsy();
    const data = res.structuredContent as { mode: string; applicable: number; plan: Array<{ changed: string[] }> };
    expect(data.mode).toBe('preview');
    expect(data.applicable).toBe(1);
    expect(data.plan[0].changed).toEqual(['title']);
    expect(data.plan[1].changed).toEqual([]);
    const text = (res.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('| Old title | New title |');
    const puts = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls.filter((c) => c[1]?.method === 'PUT');
    expect(puts).toHaveLength(0);
  });

  it('confirm=true without youtube.force-ssl is refused with an actionable insufficient_scope error', async () => {
    videosRoute();
    const { client } = await connect();
    const res = await client.callTool({ name: 'tubeforge_update_videos', arguments: { items: [{ video: 'vid00000001', title: 'New' }], confirm: true } });
    expect(res.isError).toBe(true);
    const err = (res.structuredContent as { error: { code: string; message: string } }).error;
    expect(err.code).toBe('insufficient_scope');
    expect(err.message).toContain('youtube.force-ssl');
    expect(err.message).toContain('https://tubeforge.co/settings#channels');
  });

  it('confirm=true with force-ssl applies videos.update with the full snippet', async () => {
    state.scope += ' https://www.googleapis.com/auth/youtube.force-ssl';
    videosRoute();
    const puts: unknown[] = [];
    fetchRoutes.push({
      match: (u, init) => u.pathname === '/youtube/v3/videos' && init.method === 'PUT',
      handle: (_u, init) => {
        puts.push(JSON.parse(String(init.body)));
        return json({ id: 'vid00000001' });
      },
    });
    const { client } = await connect();
    const res = await client.callTool({
      name: 'tubeforge_update_videos',
      arguments: { items: [{ video: 'vid00000001', title: 'New title' }, { video: 'vid00000002', title: 'Same title' }], confirm: true },
    });
    const data = res.structuredContent as { mode: string; updated: number; quotaUnits: number; results: Array<{ status: string }> };
    expect(data.mode).toBe('applied');
    expect(data.updated).toBe(1);
    expect(data.quotaUnits).toBe(51);
    expect(data.results.map((r) => r.status)).toEqual(['updated', 'skipped']);
    expect(puts).toEqual([{ id: 'vid00000001', snippet: { title: 'New title', description: 'desc', tags: ['a'], categoryId: '22', defaultLanguage: undefined } }]);
  });
});

describe('tubeforge_list_comments / reply', () => {
  it('lists threads with the app API key and flags owner replies', async () => {
    fetchRoutes.push({
      match: (u) => u.pathname === '/youtube/v3/commentThreads',
      handle: (u) => {
        expect(u.searchParams.get('key')).toBe('yt-app-key');
        expect(u.searchParams.get('allThreadsRelatedToChannelId')).toBe(OWN_CHANNEL);
        return json({
          items: [
            { id: 't1', snippet: { videoId: 'vid00000001', totalReplyCount: 1, canReply: true, topLevelComment: { id: 'c1', snippet: { textOriginal: 'Great!', authorDisplayName: 'Ann', likeCount: 3, publishedAt: '2026-08-30T00:00:00Z' } } }, replies: { comments: [{ id: 'r1', snippet: { authorChannelId: { value: OWN_CHANNEL }, textOriginal: 'Thanks' } }] } },
            { id: 't2', snippet: { videoId: 'vid00000001', totalReplyCount: 0, canReply: true, topLevelComment: { id: 'c2', snippet: { textOriginal: 'Part 2?', authorDisplayName: 'Bob', likeCount: 0 } } } },
          ],
        });
      },
    });
    const { client } = await connect();
    const res = await client.callTool({ name: 'tubeforge_list_comments', arguments: { unansweredOnly: true } });
    const data = res.structuredContent as { threads: Array<{ commentId: string; ownerReplied: boolean }> };
    expect(data.threads.map((t) => t.commentId)).toEqual(['c2']);
  });

  it('reply preview posts nothing; confirm needs force-ssl', async () => {
    const { client } = await connect();
    const preview = await client.callTool({ name: 'tubeforge_reply_comments', arguments: { items: [{ commentId: 'c2', text: 'Coming next week!' }] } });
    expect((preview.structuredContent as { mode: string }).mode).toBe('preview');
    expect(fetch).not.toHaveBeenCalled();

    const denied = await client.callTool({ name: 'tubeforge_reply_comments', arguments: { items: [{ commentId: 'c2', text: 'Coming next week!' }], confirm: true } });
    expect(denied.isError).toBe(true);
    expect((denied.structuredContent as { error: { code: string } }).error.code).toBe('insufficient_scope');
  });
});

describe('publishing tools', () => {
  it('schedules uploads through the shared createUploadJobs core, defaulting the only channel', async () => {
    const { client } = await connect();
    const res = await client.callTool({
      name: 'tubeforge_schedule_uploads',
      arguments: { items: [{ videoUrl: 'https://cdn.example.com/a.mp4', title: 'Day 1', privacyStatus: 'public', scheduledAt: '2026-09-10T15:00:00Z' }], idempotencyKey: 'week-37-batch' },
    });
    expect(res.isError).toBeFalsy();
    const data = res.structuredContent as { created: boolean; jobs: Array<{ jobId: string; channelId: string; status: string }> };
    expect(data.created).toBe(true);
    expect(data.jobs[0]).toMatchObject({ channelId: OWN_CHANNEL, status: 'queued' });
    expect(mockDb.uploadJob.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ channelId: OWN_CHANNEL, privacyStatus: 'private', idempotencyKey: 'week-37-batch', source: 'API' }) }),
    );
    expect(mockDb.apiKey.update).toHaveBeenCalled();
  });

  it('calendar groups jobs by day', async () => {
    state.jobs = [
      { id: 'j1', channelId: OWN_CHANNEL, title: 'A', privacyStatus: 'public', status: 'QUEUED', scheduledAt: new Date('2026-09-10T15:00:00Z'), youtubeVideoId: null, errorMessage: null, retryCount: 0, uploadProgress: 0, createdAt: new Date('2026-09-01'), startedAt: null, completedAt: null, consumerRef: null },
      { id: 'j2', channelId: OWN_CHANNEL, title: 'B', privacyStatus: 'public', status: 'COMPLETED', scheduledAt: new Date('2026-09-10T18:00:00Z'), youtubeVideoId: 'vid00000009', errorMessage: null, retryCount: 0, uploadProgress: 100, createdAt: new Date('2026-09-01'), startedAt: null, completedAt: new Date('2026-09-10T18:01:00Z'), consumerRef: null },
      { id: 'j3', channelId: OWN_CHANNEL, title: 'C', privacyStatus: 'public', status: 'QUEUED', scheduledAt: new Date('2026-09-11T15:00:00Z'), youtubeVideoId: null, errorMessage: null, retryCount: 0, uploadProgress: 0, createdAt: new Date('2026-09-01'), startedAt: null, completedAt: null, consumerRef: null },
    ];
    const { client } = await connect();
    const res = await client.callTool({ name: 'tubeforge_get_calendar', arguments: { daysBack: 30, daysAhead: 30 } });
    const data = res.structuredContent as { total: number; days: Array<{ date: string; count: number; jobs: Array<{ youtubeUrl: string | null }> }> };
    expect(data.total).toBe(3);
    expect(data.days.map((d) => [d.date, d.count])).toEqual([['2026-09-10', 2], ['2026-09-11', 1]]);
    expect(data.days[0].jobs[1].youtubeUrl).toBe('https://youtube.com/watch?v=vid00000009');
  });
});

describe('error mapping', () => {
  it('maps YouTube quotaExceeded to a retry-later error', async () => {
    fetchRoutes.push({
      match: (u) => u.pathname === '/youtube/v3/playlistItems',
      handle: () => json({ error: { message: 'The request cannot be completed because you have exceeded your quota.', errors: [{ reason: 'quotaExceeded' }] } }, 403),
    });
    const { client } = await connect();
    const res = await client.callTool({ name: 'tubeforge_list_videos', arguments: {} });
    expect(res.isError).toBe(true);
    expect((res.structuredContent as { error: { code: string } }).error.code).toBe('youtube_quota_exceeded');
  });

  it('asks the user to connect a channel when none exists', async () => {
    const saved = state.channels.splice(0, state.channels.length);
    try {
      const { client } = await connect();
      const res = await client.callTool({ name: 'tubeforge_list_videos', arguments: {} });
      expect(res.isError).toBe(true);
      const err = (res.structuredContent as { error: { code: string; message: string } }).error;
      expect(err.code).toBe('no_channel');
      expect(err.message).toContain('https://tubeforge.co/settings#channels');
    } finally {
      state.channels.push(...saved);
    }
  });
});
