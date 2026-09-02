import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Reusable workflows exposed as MCP prompts. They are the "one sentence →
 * visible result" demos: the client shows them as slash commands and the
 * model runs the tool sequence.
 */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'weekly_channel_review',
    {
      title: 'Weekly channel review',
      description: 'Stats for the last 7 days, what was published, unanswered comments — one summary.',
      argsSchema: { channelId: z.string().optional().describe('Channel id; omit if only one channel is connected') },
    },
    ({ channelId }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Review my YouTube channel${channelId ? ` ${channelId}` : ''} for the last 7 days.\n` +
              '1. Call tubeforge_get_channel_stats with days=7 and breakdown="video" for the top videos, then breakdown="day" for the daily curve.\n' +
              '2. Call tubeforge_get_calendar with daysBack=7 and daysAhead=7 to see what went out and what is scheduled.\n' +
              '3. Call tubeforge_list_comments with unansweredOnly=true, limit=20.\n' +
              'Then give me a short summary: numbers (views, watch time, net subscribers), the 3 strongest and 3 weakest videos of the week by views, gaps in the schedule, and the 5 comments most worth answering. Do not invent metrics that the tools did not return.',
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'retitle_underperformers',
    {
      title: 'Retitle underperforming videos',
      description: 'Find recent videos with the fewest views and propose new titles; apply only after approval.',
      argsSchema: {
        channelId: z.string().optional(),
        count: z.string().optional().describe('How many videos to retitle (default 10)'),
        style: z.string().optional().describe('Title style notes, e.g. "curiosity gap, ≤ 60 chars, no clickbait"'),
      },
    },
    ({ channelId, count, style }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Rewrite the titles of the ${count ?? '10'} weakest recent videos on my channel${channelId ? ` ${channelId}` : ''}.\n` +
              '1. Call tubeforge_list_videos (limit=50) and pick the videos with the lowest viewCount published in the last 60 days.\n' +
              `2. Draft a new title for each${style ? ` (${style})` : ' (keep the meaning, ≤ 70 characters, front-load the hook, no clickbait)'}.\n` +
              '3. Call tubeforge_update_videos with confirm=false and show me the before/after table.\n' +
              '4. Wait for my approval. Only then call tubeforge_update_videos with confirm=true.',
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'answer_comments',
    {
      title: 'Answer unanswered comments',
      description: 'Draft replies to comments without an owner reply; post only after approval.',
      argsSchema: {
        channelId: z.string().optional(),
        tone: z.string().optional().describe('Voice for the replies, e.g. "friendly, short, in Russian"'),
      },
    },
    ({ channelId, tone }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Answer the unanswered comments on my channel${channelId ? ` ${channelId}` : ''}.\n` +
              '1. Call tubeforge_list_comments with unansweredOnly=true, limit=30.\n' +
              `2. Skip spam and pure emoji. Draft a reply for the rest${tone ? ` — ${tone}` : ' — short, warm, in the commenter\'s language'}.\n` +
              '3. Call tubeforge_reply_comments with confirm=false and show me the table.\n' +
              '4. Wait for my approval, then call tubeforge_reply_comments with confirm=true.',
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'publish_week',
    {
      title: 'Schedule a week of videos',
      description: 'Turn a list of video URLs into a scheduled week on the calendar.',
      argsSchema: {
        videoUrls: z.string().describe('Comma- or newline-separated direct video URLs (mp4/mov)'),
        startDate: z.string().optional().describe('First publish date, YYYY-MM-DD (default: tomorrow)'),
        timeUtc: z.string().optional().describe('Daily publish time in UTC, HH:MM (default 15:00)'),
      },
    },
    ({ videoUrls, startDate, timeUtc }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Schedule these videos on my channel, one per day starting ${startDate ?? 'tomorrow'} at ${timeUtc ?? '15:00'} UTC:\n${videoUrls}\n` +
              '1. Call tubeforge_get_calendar to check the days are free.\n' +
              '2. Propose a title for each video from its filename and show me the plan (date, time, title, url).\n' +
              '3. After I approve, call tubeforge_schedule_uploads with privacyStatus="public" and scheduledAt set for each item, using an idempotencyKey.',
          },
        },
      ],
    }),
  );
}
