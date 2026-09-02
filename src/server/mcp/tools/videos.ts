import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  extractVideoId,
  getVideos,
  isoDurationToSeconds,
  listPlaylistItems,
  updateVideoSnippet,
  setThumbnail,
  type YtVideo,
} from '@/lib/youtube/api';
import { credentialsFor, fail, mdTable, num, ok, resolveChannel, requireManageScope, run, ToolError, type McpContext } from '../context';

/** Uploads playlist id is deterministic: UC… → UU… (documented YouTube convention). */
export function uploadsPlaylistId(channelId: string): string {
  return `UU${channelId.slice(2)}`;
}

export function shapeVideo(v: YtVideo) {
  const durationSeconds = isoDurationToSeconds(v.contentDetails?.duration);
  return {
    videoId: v.id,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    title: v.snippet?.title ?? '',
    description: v.snippet?.description ?? '',
    tags: v.snippet?.tags ?? [],
    categoryId: v.snippet?.categoryId ?? null,
    publishedAt: v.snippet?.publishedAt ?? null,
    privacyStatus: v.status?.privacyStatus ?? null,
    scheduledPublishAt: v.status?.publishAt ?? null,
    uploadStatus: v.status?.uploadStatus ?? null,
    durationSeconds,
    /** Same raw field the approved Video Inspector exposes: contentDetails.duration ≤ 3 min. */
    isShorts: durationSeconds !== null ? durationSeconds <= 180 : null,
    viewCount: num(v.statistics?.viewCount),
    likeCount: num(v.statistics?.likeCount),
    commentCount: num(v.statistics?.commentCount),
    thumbnail: v.snippet?.thumbnails?.medium?.url ?? v.snippet?.thumbnails?.default?.url ?? null,
  };
}

const VideoRef = z.string().min(11).max(2048).describe('YouTube video id (11 chars) or any youtube.com / youtu.be URL');

function parseVideoRef(ref: string): string {
  const id = extractVideoId(ref);
  if (!id) throw new ToolError('invalid_video', `"${ref}" is not a YouTube video id or URL.`);
  return id;
}

const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;

export function registerVideoTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    'tubeforge_list_videos',
    {
      title: 'List videos on a connected channel',
      description:
        'List uploads on one of your connected channels, newest first, with title, publish date, privacy status, duration and raw view/like/comment counts straight from the YouTube Data API. ' +
        'Includes private and scheduled videos because the request is made with the channel owner\'s OAuth token. ' +
        'Optional filters: query (case-insensitive substring of the title), publishedAfter (ISO date). Use pageToken from the previous result to page further. ' +
        'Costs 2 quota units per page (playlistItems.list + videos.list); never uses search.list.',
      inputSchema: {
        channelId: z.string().regex(/^UC[\w-]{22}$/).optional().describe('Channel to list; optional when only one channel is connected'),
        limit: z.number().int().min(1).max(50).default(25),
        pageToken: z.string().max(200).optional(),
        query: z.string().max(120).optional().describe('Case-insensitive substring filter on the title'),
        publishedAfter: z.string().datetime().optional().describe('Only videos published after this ISO 8601 timestamp'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ channelId, limit, pageToken, query, publishedAfter }) =>
      run(ctx, async () => {
        const channel = await resolveChannel(ctx, channelId);
        const creds = await credentialsFor(ctx, channel);
        const page = await listPlaylistItems({ accessToken: creds.accessToken }, uploadsPlaylistId(channel.channelId), {
          pageToken,
          maxResults: limit,
        });
        const ids = page.items
          .map((i) => i.contentDetails?.videoId ?? i.snippet?.resourceId?.videoId)
          .filter((id): id is string => Boolean(id));
        const videos = ids.length ? await getVideos({ accessToken: creds.accessToken }, ids) : [];
        const after = publishedAfter ? Date.parse(publishedAfter) : null;
        const q = query?.toLowerCase();
        const shaped = videos
          .map(shapeVideo)
          .filter((v) => (q ? v.title.toLowerCase().includes(q) : true))
          .filter((v) => (after !== null && v.publishedAt ? Date.parse(v.publishedAt) >= after : true));

        return ok({
          channelId: channel.channelId,
          channelTitle: channel.title,
          count: shaped.length,
          totalUploads: page.totalResults ?? null,
          nextPageToken: page.nextPageToken ?? null,
          videos: shaped,
          quotaUnits: ids.length ? 2 : 1,
        });
      }),
  );

  server.registerTool(
    'tubeforge_get_video',
    {
      title: 'Get one video',
      description:
        'Fetch full metadata for a single video by id or URL: title, description, tags, category, privacy, scheduled publish time, duration and raw statistics as returned by the YouTube Data API (videos.list, 1 quota unit). ' +
        'Works for videos on your connected channels; public videos elsewhere return public fields only.',
      inputSchema: {
        video: VideoRef,
        channelId: z.string().regex(/^UC[\w-]{22}$/).optional().describe('Which connected channel\'s credentials to use; optional when only one is connected'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ video, channelId }) =>
      run(ctx, async () => {
        const id = parseVideoRef(video);
        const channel = await resolveChannel(ctx, channelId);
        const creds = await credentialsFor(ctx, channel);
        const [v] = await getVideos({ accessToken: creds.accessToken }, [id]);
        if (!v) return fail('not_found', `Video ${id} was not found or is not accessible.`);
        return ok({ video: shapeVideo(v), quotaUnits: 1 });
      }),
  );

  server.registerTool(
    'tubeforge_update_videos',
    {
      title: 'Update titles / descriptions / tags (with preview)',
      description:
        'Bulk-edit metadata of videos on a connected channel. Each item may set a new title, description and/or tags; omitted fields are kept. ' +
        'ALWAYS call with confirm=false first: it returns a before/after table and changes nothing. Show that table to the user and call again with confirm=true only after they approve. ' +
        'Applying costs 51 quota units per video (videos.list + videos.update) and requires the "manage" OAuth permission (youtube.force-ssl). Max 50 items per call.',
      inputSchema: {
        channelId: z.string().regex(/^UC[\w-]{22}$/).optional(),
        items: z
          .array(
            z.object({
              video: VideoRef,
              title: z.string().min(1).max(100).optional(),
              description: z.string().max(5000).optional(),
              tags: z.array(z.string().min(1).max(50)).max(60).optional(),
            }),
          )
          .min(1)
          .max(50),
        confirm: z.boolean().default(false).describe('false = preview only (default). true = apply the changes.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ channelId, items, confirm }) =>
      run(ctx, async () => {
        const channel = await resolveChannel(ctx, channelId);
        const creds = await credentialsFor(ctx, channel);
        if (confirm) requireManageScope(ctx, creds);

        const ids = items.map((i) => parseVideoRef(i.video));
        const current = await getVideos({ accessToken: creds.accessToken }, ids, ['snippet', 'status']);
        const byId = new Map(current.map((v) => [v.id, v]));

        const plan: Array<{
          videoId: string;
          before: { title: string; description: string; tags: string[] };
          after: { title: string; description: string; tags: string[] };
          changed: string[];
          error?: string;
        }> = [];

        items.forEach((item, idx) => {
          const id = ids[idx];
          const v = byId.get(id);
          if (!v || !v.snippet) {
            plan.push({
              videoId: id,
              before: { title: '', description: '', tags: [] },
              after: { title: '', description: '', tags: [] },
              changed: [],
              error: 'not found on YouTube',
            });
            return;
          }
          if (v.snippet.channelId && v.snippet.channelId !== channel.channelId) {
            plan.push({
              videoId: id,
              before: { title: v.snippet.title, description: v.snippet.description ?? '', tags: v.snippet.tags ?? [] },
              after: { title: v.snippet.title, description: v.snippet.description ?? '', tags: v.snippet.tags ?? [] },
              changed: [],
              error: `belongs to another channel (${v.snippet.channelId}), skipped`,
            });
            return;
          }
          const before = { title: v.snippet.title, description: v.snippet.description ?? '', tags: v.snippet.tags ?? [] };
          const after = {
            title: item.title ?? before.title,
            description: item.description ?? before.description,
            tags: item.tags ?? before.tags,
          };
          const changed: string[] = [];
          if (after.title !== before.title) changed.push('title');
          if (after.description !== before.description) changed.push('description');
          if (JSON.stringify(after.tags) !== JSON.stringify(before.tags)) changed.push('tags');
          plan.push({ videoId: id, before, after, changed });
        });

        const applicable = plan.filter((p) => !p.error && p.changed.length > 0);
        const table = mdTable(
          ['Video', 'Before (title)', 'After (title)', 'Changes'],
          plan.map((p) => [p.videoId, p.before.title, p.after.title, p.error ?? (p.changed.join(', ') || 'no change')]),
        );

        if (!confirm) {
          return ok(
            { mode: 'preview', channelId: channel.channelId, plan, applicable: applicable.length, quotaUnits: 1 },
            `Preview only — nothing was changed. ${applicable.length} of ${plan.length} video(s) would be updated.\n\n${table}\n\nAsk the user to approve, then call tubeforge_update_videos again with confirm=true.`,
          );
        }

        const results: Array<{ videoId: string; status: 'updated' | 'skipped' | 'failed'; detail?: string }> = [];
        for (const p of plan) {
          if (p.error || p.changed.length === 0) {
            results.push({ videoId: p.videoId, status: 'skipped', detail: p.error ?? 'no change' });
            continue;
          }
          const v = byId.get(p.videoId)!;
          try {
            await updateVideoSnippet(creds.accessToken, p.videoId, {
              title: p.after.title,
              description: p.after.description,
              tags: p.after.tags,
              categoryId: v.snippet?.categoryId ?? '22',
              defaultLanguage: v.snippet?.defaultLanguage,
            });
            results.push({ videoId: p.videoId, status: 'updated', detail: p.changed.join(', ') });
          } catch (e) {
            results.push({ videoId: p.videoId, status: 'failed', detail: (e as Error).message });
          }
        }
        const updated = results.filter((r) => r.status === 'updated').length;
        return ok(
          { mode: 'applied', channelId: channel.channelId, results, updated, quotaUnits: 1 + updated * 50 },
          `Updated ${updated} of ${plan.length} video(s).\n\n${mdTable(['Video', 'Status', 'Detail'], results.map((r) => [r.videoId, r.status, r.detail]))}`,
        );
      }),
  );

  server.registerTool(
    'tubeforge_set_thumbnail',
    {
      title: 'Set a custom thumbnail',
      description:
        'Upload a custom thumbnail for a video on a connected channel from an https image URL (JPEG/PNG, ≤ 2 MB, 1280×720 recommended). ' +
        'Costs 50 quota units. Works with the standard upload permission; the channel must have custom thumbnails enabled on YouTube.',
      inputSchema: {
        video: VideoRef,
        imageUrl: z.string().url().max(2048).describe('https URL of the JPEG or PNG image'),
        channelId: z.string().regex(/^UC[\w-]{22}$/).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ video, imageUrl, channelId }) =>
      run(ctx, async () => {
        const id = parseVideoRef(video);
        const channel = await resolveChannel(ctx, channelId);
        const creds = await credentialsFor(ctx, channel);

        const u = new URL(imageUrl);
        if (u.protocol !== 'https:') throw new ToolError('invalid_image_url', 'imageUrl must use https.');
        const res = await fetch(u.toString(), { redirect: 'follow', signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new ToolError('image_fetch_failed', `Could not download the image (HTTP ${res.status}).`);
        const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
        if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
          throw new ToolError('unsupported_image', `Thumbnail must be image/jpeg or image/png (got "${contentType || 'unknown'}").`);
        }
        const bytes = await res.arrayBuffer();
        if (bytes.byteLength > MAX_THUMBNAIL_BYTES) {
          throw new ToolError('image_too_large', `Thumbnail is ${(bytes.byteLength / 1024 / 1024).toFixed(2)} MB; YouTube allows at most 2 MB.`);
        }
        await setThumbnail(creds.accessToken, id, { bytes, contentType });
        return ok({ videoId: id, status: 'thumbnail_set', bytes: bytes.byteLength, contentType, quotaUnits: 50 });
      }),
  );
}
