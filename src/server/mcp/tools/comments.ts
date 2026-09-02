import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { env } from '@/lib/env';
import { extractVideoId, insertCommentReply, listCommentThreads, type YtCommentThread } from '@/lib/youtube/api';
import { hasScope, YOUTUBE_MANAGE_SCOPE } from '@/lib/youtube/token';
import { credentialsFor, mdTable, ok, resolveChannel, requireManageScope, run, ToolError, type McpContext } from '../context';

function shapeThread(t: YtCommentThread, ownerChannelId: string) {
  const top = t.snippet?.topLevelComment?.snippet;
  const replies = t.replies?.comments ?? [];
  return {
    threadId: t.id,
    commentId: t.snippet?.topLevelComment?.id ?? t.id,
    videoId: t.snippet?.videoId ?? top?.videoId ?? null,
    author: top?.authorDisplayName ?? '',
    authorChannelId: top?.authorChannelId?.value ?? null,
    text: top?.textOriginal ?? top?.textDisplay ?? '',
    likeCount: top?.likeCount ?? 0,
    publishedAt: top?.publishedAt ?? null,
    totalReplyCount: t.snippet?.totalReplyCount ?? 0,
    canReply: t.snippet?.canReply ?? false,
    /** True when one of the (up to 5) returned replies was posted by the channel owner. */
    ownerReplied: replies.some((r) => r.snippet?.authorChannelId?.value === ownerChannelId),
    replies: replies.map((r) => ({
      commentId: r.id,
      author: r.snippet?.authorDisplayName ?? '',
      authorChannelId: r.snippet?.authorChannelId?.value ?? null,
      text: r.snippet?.textOriginal ?? r.snippet?.textDisplay ?? '',
      publishedAt: r.snippet?.publishedAt ?? null,
    })),
  };
}

export function registerCommentTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    'tubeforge_list_comments',
    {
      title: 'List comments on your videos',
      description:
        'List recent public comment threads on a connected channel (all videos) or on one video, newest first, with author, text, like count, reply count and whether the channel owner already replied. ' +
        'Set unansweredOnly=true to get only threads without an owner reply — the typical "what should I answer today" list. ' +
        'Costs 1 quota unit per page (commentThreads.list). Pass pageToken from the previous result to page further.',
      inputSchema: {
        channelId: z.string().regex(/^UC[\w-]{22}$/).optional(),
        video: z.string().min(11).max(2048).optional().describe('Limit to one video (id or URL). Omit for the whole channel.'),
        limit: z.number().int().min(1).max(100).default(20),
        pageToken: z.string().max(200).optional(),
        order: z.enum(['time', 'relevance']).default('time'),
        unansweredOnly: z.boolean().default(false),
        searchTerms: z.string().max(120).optional().describe('Only threads containing these words'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ channelId, video, limit, pageToken, order, unansweredOnly, searchTerms }) =>
      run(ctx, async () => {
        const channel = await resolveChannel(ctx, channelId);
        const creds = await credentialsFor(ctx, channel);
        let videoId: string | undefined;
        if (video) {
          const id = extractVideoId(video);
          if (!id) throw new ToolError('invalid_video', `"${video}" is not a YouTube video id or URL.`);
          videoId = id;
        }
        // commentThreads.list is a public read: prefer the OAuth token when it
        // carries force-ssl (needed for some owner-only threads), otherwise the
        // application API key.
        const auth = hasScope(creds.scopes, YOUTUBE_MANAGE_SCOPE)
          ? { accessToken: creds.accessToken }
          : env.YOUTUBE_API_KEY
            ? { apiKey: env.YOUTUBE_API_KEY }
            : { accessToken: creds.accessToken };

        const page = await listCommentThreads(auth, { videoId, channelId: channel.channelId }, {
          pageToken,
          maxResults: limit,
          order,
          searchTerms,
        });
        let threads = page.items.map((t) => shapeThread(t, channel.channelId));
        if (unansweredOnly) threads = threads.filter((t) => !t.ownerReplied);

        const text =
          `${threads.length} comment thread(s)${unansweredOnly ? ' without an owner reply' : ''} on ${channel.title}${videoId ? ` / video ${videoId}` : ''}\n\n` +
          mdTable(
            ['commentId', 'video', 'author', 'comment', 'likes', 'replies', 'owner replied'],
            threads.map((t) => [t.commentId, t.videoId, t.author, t.text.slice(0, 160), t.likeCount, t.totalReplyCount, t.ownerReplied ? 'yes' : 'no']),
          ) +
          (page.nextPageToken ? `\n\nnextPageToken: ${page.nextPageToken}` : '');

        return ok(
          { channelId: channel.channelId, videoId: videoId ?? null, count: threads.length, nextPageToken: page.nextPageToken ?? null, threads, quotaUnits: 1 },
          text,
        );
      }),
  );

  server.registerTool(
    'tubeforge_reply_comments',
    {
      title: 'Reply to comments (with preview)',
      description:
        'Post replies from the channel owner to comment threads on a connected channel. Each item is {commentId, text}; commentId comes from tubeforge_list_comments. ' +
        'ALWAYS call with confirm=false first: it returns the batch as a table and posts nothing. Show it to the user and call again with confirm=true only after they approve. ' +
        'Posting costs 50 quota units per reply and requires the "manage" OAuth permission (youtube.force-ssl). Max 25 replies per call.',
      inputSchema: {
        channelId: z.string().regex(/^UC[\w-]{22}$/).optional(),
        items: z
          .array(z.object({ commentId: z.string().min(1).max(200), text: z.string().min(1).max(10_000) }))
          .min(1)
          .max(25),
        confirm: z.boolean().default(false).describe('false = preview only (default). true = post the replies.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ channelId, items, confirm }) =>
      run(ctx, async () => {
        const channel = await resolveChannel(ctx, channelId);
        const creds = await credentialsFor(ctx, channel);
        const table = mdTable(['commentId', 'reply'], items.map((i) => [i.commentId, i.text]));
        if (!confirm) {
          return ok(
            { mode: 'preview', channelId: channel.channelId, items, quotaUnits: 0 },
            `Preview only — nothing was posted. ${items.length} repl${items.length === 1 ? 'y' : 'ies'} ready:\n\n${table}\n\nAsk the user to approve, then call tubeforge_reply_comments again with confirm=true.`,
          );
        }
        requireManageScope(ctx, creds);
        const results: Array<{ commentId: string; status: 'posted' | 'failed'; replyId?: string; detail?: string }> = [];
        for (const item of items) {
          try {
            const c = await insertCommentReply(creds.accessToken, item.commentId, item.text);
            results.push({ commentId: item.commentId, status: 'posted', replyId: c.id });
          } catch (e) {
            results.push({ commentId: item.commentId, status: 'failed', detail: (e as Error).message });
          }
        }
        const posted = results.filter((r) => r.status === 'posted').length;
        return ok(
          { mode: 'applied', channelId: channel.channelId, results, posted, quotaUnits: posted * 50 },
          `Posted ${posted} of ${items.length} repl${items.length === 1 ? 'y' : 'ies'}.\n\n${mdTable(['commentId', 'status', 'detail'], results.map((r) => [r.commentId, r.status, r.replyId ?? r.detail]))}`,
        );
      }),
  );
}
