/**
 * TubeForge MCP server — "keys to your channel" for Claude, Cursor,
 * ChatGPT and any other MCP client.
 *
 * One server instance is created per request (stateless Streamable HTTP)
 * and bound to the API key that authenticated it. All tools act only on
 * channels connected to that key: the user's own channels and channels
 * onboarded through the Publishing API.
 *
 * YouTube API usage stays inside the approved use case for API client
 * 78786866479 (creator tools for the user's own channel): no
 * cross-channel aggregation, no derived metrics, no data retention beyond
 * what the existing Channel / UploadJob tables already store.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from './context';
import { registerChannelTools } from './tools/channels';
import { registerVideoTools } from './tools/videos';
import { registerStatsTools } from './tools/stats';
import { registerCommentTools } from './tools/comments';
import { registerPublishingTools } from './tools/publishing';
import { registerPrompts } from './prompts';

export const MCP_SERVER_NAME = 'tubeforge-mcp-server';
export const MCP_SERVER_VERSION = '0.1.0';

export const MCP_INSTRUCTIONS =
  'TubeForge gives you operator access to the YouTube channels connected to this account. ' +
  'Start with tubeforge_list_channels when you need a channelId. ' +
  'Read tools (list_videos, get_video, get_channel_stats, list_comments, get_calendar) are safe to call freely. ' +
  'Write tools that change what viewers see (update_videos, reply_comments) always take confirm=false first, which returns a preview and changes nothing; ' +
  'show the preview to the user and call again with confirm=true only after explicit approval. ' +
  'Numbers returned are raw YouTube API values — never present estimates as if they came from the tools.';

export function createTubeForgeMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    { instructions: MCP_INSTRUCTIONS },
  );
  registerChannelTools(server, ctx);
  registerVideoTools(server, ctx);
  registerStatsTools(server, ctx);
  registerCommentTools(server, ctx);
  registerPublishingTools(server, ctx);
  registerPrompts(server);
  return server;
}
