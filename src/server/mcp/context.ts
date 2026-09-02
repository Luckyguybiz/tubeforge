/**
 * Shared plumbing for TubeForge MCP tools: request context, result
 * helpers, error mapping and channel/credential resolution.
 *
 * Security model: every tool is scoped to the API key that authenticated
 * the request. Channels are resolved through `Channel.userId` (own) or
 * `ExternalUser.apiKeyId` (channels onboarded via the Publishing API) —
 * a tool can never touch a channel outside that set, regardless of the
 * ids the model passes.
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { db } from '@/server/db';
import type { ApiAuthContext } from '@/lib/api-auth';
import {
  getYouTubeCredentials,
  hasScope,
  YouTubeAuthError,
  YOUTUBE_MANAGE_SCOPE,
  type YouTubeCredentials,
} from '@/lib/youtube/token';
import { YouTubeApiError } from '@/lib/youtube/api';

export interface McpContext {
  auth: ApiAuthContext;
  /** Origin of the request, e.g. https://tubeforge.co — used in guidance links. */
  origin: string;
}

/* ── Results ───────────────────────────────────────────────────────── */

export function ok(structured: Record<string, unknown>, text?: string): CallToolResult {
  return {
    content: [{ type: 'text', text: text ?? JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
  };
}

export function fail(code: string, message: string, extra?: Record<string, unknown>): CallToolResult {
  const structured = { error: { code, message, ...(extra ?? {}) } };
  return {
    isError: true,
    content: [{ type: 'text', text: `Error (${code}): ${message}` }],
    structuredContent: structured,
  };
}

export class ToolError extends Error {
  readonly code: string;
  readonly extra?: Record<string, unknown>;
  constructor(code: string, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.extra = extra;
  }
}

/**
 * Run a tool body and convert known failures into actionable `isError`
 * results instead of protocol-level exceptions.
 */
export async function run(ctx: McpContext, body: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await body();
  } catch (e) {
    if (e instanceof ToolError) return fail(e.code, e.message, e.extra);
    if (e instanceof YouTubeAuthError) {
      return fail(e.code, e.message, { reconnectUrl: `${ctx.origin}/settings#channels` });
    }
    if (e instanceof YouTubeApiError) {
      if (e.reason === 'quotaExceeded' || e.reason === 'rateLimitExceeded') {
        return fail('youtube_quota_exceeded', 'YouTube API quota is exhausted for today (resets at midnight Pacific Time). Retry later.', {
          reason: e.reason,
        });
      }
      if (e.status === 401) {
        return fail('youtube_unauthorized', 'YouTube rejected the access token. Reconnect your Google account.', {
          reconnectUrl: `${ctx.origin}/settings#channels`,
        });
      }
      if (e.status === 403 && (e.reason === 'insufficientPermissions' || e.reason === 'forbidden')) {
        return fail('insufficient_scope', manageScopeMessage(ctx), { reason: e.reason, detail: e.message });
      }
      if (e.status === 404 || e.reason === 'videoNotFound' || e.reason === 'playlistNotFound') {
        return fail('not_found', e.message, { reason: e.reason });
      }
      return fail('youtube_api_error', e.message, { status: e.status, reason: e.reason });
    }
    throw e;
  }
}

export function manageScopeMessage(ctx: McpContext): string {
  return (
    'This action needs the "Manage your YouTube account" permission (youtube.force-ssl), which was not granted. ' +
    `Reconnect the channel at ${ctx.origin}/settings#channels and approve the extra permission. ` +
    'If the option is not offered yet, TubeForge has not enabled managed edits for this deployment.'
  );
}

/* ── Channels & credentials ────────────────────────────────────────── */

export interface ResolvedChannel {
  channelId: string;
  title: string;
  /** Present when the channel was onboarded through the Publishing API. */
  externalUserId: string | null;
  oauthAccountId: string | null;
}

/**
 * All channels the API key may act on: the key owner's channels plus
 * channels linked to ExternalUsers of this key.
 */
export async function listAccessibleChannels(ctx: McpContext): Promise<ResolvedChannel[]> {
  const [own, external] = await Promise.all([
    db.channel.findMany({
      where: { userId: ctx.auth.userId, platform: 'YOUTUBE' },
      select: { id: true, title: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.externalUser.findMany({
      where: { apiKeyId: ctx.auth.apiKeyId, channelId: { not: null } },
      select: { externalUserId: true, oauthAccountId: true, channel: { select: { id: true, title: true } } },
    }),
  ]);

  const out = new Map<string, ResolvedChannel>();
  for (const e of external) {
    if (!e.channel) continue;
    out.set(e.channel.id, {
      channelId: e.channel.id,
      title: e.channel.title,
      externalUserId: e.externalUserId,
      oauthAccountId: e.oauthAccountId,
    });
  }
  for (const c of own) {
    if (!out.has(c.id)) out.set(c.id, { channelId: c.id, title: c.title, externalUserId: null, oauthAccountId: null });
  }
  return [...out.values()];
}

/**
 * Resolve the target channel. When `channelId` is omitted and exactly one
 * channel is accessible, that channel is used.
 */
export async function resolveChannel(ctx: McpContext, channelId?: string): Promise<ResolvedChannel> {
  const channels = await listAccessibleChannels(ctx);
  if (channels.length === 0) {
    throw new ToolError(
      'no_channel',
      `No YouTube channel is connected to this TubeForge account. Connect one at ${ctx.origin}/settings#channels, then call tubeforge_list_channels.`,
    );
  }
  if (!channelId) {
    if (channels.length === 1) return channels[0];
    throw new ToolError(
      'channel_required',
      'Several channels are connected — pass channelId. Call tubeforge_list_channels to see them.',
      { channels: channels.map((c) => ({ channelId: c.channelId, title: c.title })) },
    );
  }
  const found = channels.find((c) => c.channelId === channelId);
  if (!found) {
    throw new ToolError('channel_not_found', `Channel "${channelId}" is not connected to this API key.`, {
      channels: channels.map((c) => ({ channelId: c.channelId, title: c.title })),
    });
  }
  return found;
}

export async function credentialsFor(ctx: McpContext, channel: ResolvedChannel): Promise<YouTubeCredentials> {
  return getYouTubeCredentials(db, { userId: ctx.auth.userId, accountId: channel.oauthAccountId });
}

export function requireManageScope(ctx: McpContext, creds: YouTubeCredentials): void {
  if (!hasScope(creds.scopes, YOUTUBE_MANAGE_SCOPE)) {
    throw new ToolError('insufficient_scope', manageScopeMessage(ctx), { grantedScopes: creds.scopes });
  }
}

/* ── Formatting helpers ────────────────────────────────────────────── */

export function num(v: string | number | undefined | null): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mdTable(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const esc = (v: string | number | null | undefined) => String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const lines = [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`];
  for (const r of rows) lines.push(`| ${r.map(esc).join(' | ')} |`);
  return lines.join('\n');
}
