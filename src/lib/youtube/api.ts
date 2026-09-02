/**
 * Thin YouTube Data API v3 / YouTube Analytics API client used by the MCP
 * server. Only raw API fields are returned — no derived metrics
 * (YouTube API Services Developer Policy III.E.4.h).
 *
 * Every call is one of the documented quota costs:
 *   list endpoints (channels, playlistItems, videos, commentThreads) — 1 unit
 *   videos.update / comments.insert / thumbnails.set            — 50 units
 *   search.list is intentionally NOT used (separate 100/day bucket).
 */
import { API_ENDPOINTS } from '@/lib/constants';

const YT_V3 = 'https://www.googleapis.com/youtube/v3';
const DEFAULT_TIMEOUT_MS = 30_000;

export class YouTubeApiError extends Error {
  readonly status: number;
  /** Google error reason, e.g. quotaExceeded, insufficientPermissions, forbidden, videoNotFound */
  readonly reason: string;
  constructor(status: number, reason: string, message: string) {
    super(message);
    this.name = 'YouTubeApiError';
    this.status = status;
    this.reason = reason;
  }
}

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  accessToken?: string;
  apiKey?: string;
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  rawBody?: BodyInit;
  contentType?: string;
  query?: Query;
  timeoutMs?: number;
}

async function request<T>(url: string, opts: RequestOptions): Promise<T> {
  const u = new URL(url);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== '') u.searchParams.set(k, String(v));
  }
  if (!opts.accessToken && opts.apiKey) u.searchParams.set('key', opts.apiKey);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;
  let body: BodyInit | undefined;
  if (opts.rawBody !== undefined) {
    body = opts.rawBody;
    if (opts.contentType) headers['Content-Type'] = opts.contentType;
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(u.toString(), { method: opts.method ?? 'GET', headers, body, signal: controller.signal });
  } catch (e) {
    throw new YouTubeApiError(0, 'network', `YouTube API request failed: ${(e as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let reason = `http_${res.status}`;
    let message = `YouTube API error HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string; errors?: Array<{ reason?: string }> } };
      reason = parsed.error?.errors?.[0]?.reason ?? reason;
      message = parsed.error?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new YouTubeApiError(res.status, reason, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ── Types (subset of the API resources we read) ───────────────────── */

export interface YtThumbnails {
  default?: { url: string };
  medium?: { url: string };
  high?: { url: string };
}

export interface YtChannel {
  id: string;
  snippet?: { title: string; description?: string; customUrl?: string; thumbnails?: YtThumbnails; publishedAt?: string };
  statistics?: { viewCount?: string; subscriberCount?: string; videoCount?: string; hiddenSubscriberCount?: boolean };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

export interface YtVideo {
  id: string;
  snippet?: {
    title: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: YtThumbnails;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  status?: {
    privacyStatus?: 'public' | 'unlisted' | 'private';
    uploadStatus?: string;
    publishAt?: string;
    madeForKids?: boolean;
    selfDeclaredMadeForKids?: boolean;
  };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string; definition?: string; caption?: string };
}

export interface YtPlaylistItem {
  id: string;
  snippet?: { title: string; publishedAt?: string; resourceId?: { videoId?: string } };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
  status?: { privacyStatus?: string };
}

export interface YtComment {
  id: string;
  snippet?: {
    videoId?: string;
    textDisplay?: string;
    textOriginal?: string;
    authorDisplayName?: string;
    authorChannelId?: { value?: string };
    likeCount?: number;
    publishedAt?: string;
    updatedAt?: string;
    parentId?: string;
  };
}

export interface YtCommentThread {
  id: string;
  snippet?: {
    videoId?: string;
    totalReplyCount?: number;
    canReply?: boolean;
    isPublic?: boolean;
    topLevelComment?: YtComment;
  };
  replies?: { comments?: YtComment[] };
}

interface ListResponse<T> {
  items?: T[];
  nextPageToken?: string;
  pageInfo?: { totalResults?: number; resultsPerPage?: number };
}

export interface AnalyticsReport {
  columnHeaders?: Array<{ name: string; columnType: string; dataType: string }>;
  rows?: Array<Array<string | number>>;
}

/* ── Data API ──────────────────────────────────────────────────────── */

/** channels.list — 1 unit. `mine=true` needs an OAuth token. */
export async function listMyChannels(accessToken: string): Promise<YtChannel[]> {
  const data = await request<ListResponse<YtChannel>>(`${YT_V3}/channels`, {
    accessToken,
    query: { part: 'snippet,statistics,contentDetails', mine: true, maxResults: 50 },
  });
  return data.items ?? [];
}

/** channels.list by id — 1 unit. */
export async function getChannel(auth: { accessToken?: string; apiKey?: string }, channelId: string): Promise<YtChannel | null> {
  const data = await request<ListResponse<YtChannel>>(`${YT_V3}/channels`, {
    ...auth,
    query: { part: 'snippet,statistics,contentDetails', id: channelId },
  });
  return data.items?.[0] ?? null;
}

/** playlistItems.list — 1 unit per page of up to 50 uploads (newest first). */
export async function listPlaylistItems(
  auth: { accessToken?: string; apiKey?: string },
  playlistId: string,
  opts: { pageToken?: string; maxResults?: number } = {},
): Promise<{ items: YtPlaylistItem[]; nextPageToken?: string; totalResults?: number }> {
  const data = await request<ListResponse<YtPlaylistItem>>(`${YT_V3}/playlistItems`, {
    ...auth,
    query: {
      part: 'snippet,contentDetails,status',
      playlistId,
      maxResults: Math.min(Math.max(opts.maxResults ?? 50, 1), 50),
      pageToken: opts.pageToken,
    },
  });
  return { items: data.items ?? [], nextPageToken: data.nextPageToken, totalResults: data.pageInfo?.totalResults };
}

/** videos.list — 1 unit per call, up to 50 ids. */
export async function getVideos(
  auth: { accessToken?: string; apiKey?: string },
  ids: string[],
  parts: string[] = ['snippet', 'status', 'statistics', 'contentDetails'],
): Promise<YtVideo[]> {
  const out: YtVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await request<ListResponse<YtVideo>>(`${YT_V3}/videos`, {
      ...auth,
      query: { part: parts.join(','), id: chunk.join(','), maxResults: 50 },
    });
    out.push(...(data.items ?? []));
  }
  return out;
}

/**
 * videos.update — 50 units. YouTube replaces the whole snippet, so the
 * caller must pass the complete snippet (title + categoryId are required).
 */
export async function updateVideoSnippet(
  accessToken: string,
  videoId: string,
  snippet: { title: string; description?: string; tags?: string[]; categoryId: string; defaultLanguage?: string },
): Promise<YtVideo> {
  return request<YtVideo>(`${YT_V3}/videos`, {
    accessToken,
    method: 'PUT',
    query: { part: 'snippet' },
    body: { id: videoId, snippet },
  });
}

/** commentThreads.list — 1 unit. Public threads can be read with an API key. */
export async function listCommentThreads(
  auth: { accessToken?: string; apiKey?: string },
  target: { videoId?: string; channelId?: string },
  opts: { pageToken?: string; maxResults?: number; order?: 'time' | 'relevance'; searchTerms?: string } = {},
): Promise<{ items: YtCommentThread[]; nextPageToken?: string }> {
  const data = await request<ListResponse<YtCommentThread>>(`${YT_V3}/commentThreads`, {
    ...auth,
    query: {
      part: 'snippet,replies',
      videoId: target.videoId,
      allThreadsRelatedToChannelId: target.videoId ? undefined : target.channelId,
      maxResults: Math.min(Math.max(opts.maxResults ?? 20, 1), 100),
      order: opts.order ?? 'time',
      pageToken: opts.pageToken,
      searchTerms: opts.searchTerms,
      textFormat: 'plainText',
    },
  });
  return { items: data.items ?? [], nextPageToken: data.nextPageToken };
}

/** comments.insert (reply) — 50 units. Requires youtube.force-ssl. */
export async function insertCommentReply(accessToken: string, parentId: string, text: string): Promise<YtComment> {
  return request<YtComment>(`${YT_V3}/comments`, {
    accessToken,
    method: 'POST',
    query: { part: 'snippet' },
    body: { snippet: { parentId, textOriginal: text } },
  });
}

/** thumbnails.set — 50 units. Works with youtube.upload scope. */
export async function setThumbnail(
  accessToken: string,
  videoId: string,
  image: { bytes: ArrayBuffer; contentType: string },
): Promise<void> {
  await request<unknown>('https://www.googleapis.com/upload/youtube/v3/thumbnails/set', {
    accessToken,
    method: 'POST',
    query: { videoId, uploadType: 'media' },
    rawBody: image.bytes,
    contentType: image.contentType,
    timeoutMs: 60_000,
  });
}

/* ── Analytics API (own channel only, yt-analytics.readonly) ───────── */

export async function channelAnalytics(
  accessToken: string,
  params: { channelId: string; startDate: string; endDate: string; metrics: string[]; dimensions?: string; sort?: string; maxResults?: number },
): Promise<AnalyticsReport> {
  return request<AnalyticsReport>(API_ENDPOINTS.YOUTUBE_ANALYTICS, {
    accessToken,
    query: {
      ids: `channel==${params.channelId}`,
      startDate: params.startDate,
      endDate: params.endDate,
      metrics: params.metrics.join(','),
      dimensions: params.dimensions,
      sort: params.sort,
      maxResults: params.maxResults,
    },
  });
}

/* ── Helpers ───────────────────────────────────────────────────────── */

/** ISO 8601 duration (PT1M3S) → seconds. Returns null for unparsable input. */
export function isoDurationToSeconds(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  const [, d, h, min, s] = m;
  return (Number(d ?? 0) * 86400) + (Number(h ?? 0) * 3600) + (Number(min ?? 0) * 60) + Number(s ?? 0);
}

const VIDEO_ID_RE = /^[\w-]{11}$/;

/** Accepts a bare 11-char id or any youtube.com / youtu.be URL. */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return VIDEO_ID_RE.test(id) ? id : null;
    }
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v && VIDEO_ID_RE.test(v)) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'shorts' || p === 'embed' || p === 'live' || p === 'v');
      if (idx >= 0 && parts[idx + 1] && VIDEO_ID_RE.test(parts[idx + 1])) return parts[idx + 1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}
