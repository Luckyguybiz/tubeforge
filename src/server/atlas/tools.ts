/**
 * Atlas — Anthropic tool definitions.
 *
 * Shape matches the `tools` array Anthropic Messages API expects. Each
 * tool's `input_schema` is a JSON Schema describing args; the SDK
 * validates against it before our executor runs.
 *
 * Defence-in-depth note: no tool accepts `userId` as a parameter. The
 * executor scopes all queries to `ctx.session.user.id` regardless of
 * what the model passes.
 */

import type Anthropic from '@anthropic-ai/sdk';

type ToolDef = Anthropic.Tool;

export const ATLAS_TOOLS: ToolDef[] = [
  {
    name: 'get_jobs',
    description:
      "List the current user's upload jobs, most recent first, optionally filtered by status or channel. Returns at most 50 rows. Use this when the user asks about cadence, recent activity, or wants to find a job by approximate criteria.",
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['QUEUED', 'UPLOADING', 'COMPLETED', 'FAILED', 'CANCELLED'],
          description: 'Filter to a single job status. Omit to include all.',
        },
        channelId: {
          type: 'string',
          description: 'Filter to a specific YouTube channel ID owned by the user.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 20,
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor from a previous call (job id).',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_job',
    description:
      'Get full details for one upload job — error message, retry count, timestamps, channel, scheduled-vs-now. Use when diagnosing a specific failure or the user names a job ID.',
    input_schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', minLength: 1 },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'get_channel',
    description:
      "Return all YouTube channels the user has connected to TubeForge, with title, thumbnail, and subscriber count. No parameters — channels are auto-scoped to the user. Use to confirm which channels exist before recommending where to publish.",
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_heatmap',
    description:
      'Daily upload density and success rate across a date range. Returns one entry per day with counts of {count, succeeded, failed}. Maximum 90-day window enforced server-side. Use to spot busy/idle days or find a best-performing slot.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}',
          description: 'Start date (inclusive), YYYY-MM-DD.',
        },
        to: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}',
          description: 'End date (exclusive), YYYY-MM-DD.',
        },
        channelId: {
          type: 'string',
          description: 'Optional — restrict heatmap to one channel.',
        },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_health_score',
    description:
      "Compute the user's current publishing health (0-100) from the last 14 days, with breakdown into success rate, coverage, and reliability. Use when the user asks 'how am I doing', 'health score', or you need a quick summary.",
    input_schema: {
      type: 'object',
      properties: {
        channelId: {
          type: 'string',
          description: 'Optional — restrict score to one channel.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_webhooks_health',
    description:
      "Recent webhook delivery success/failure attempts for diagnostics. If `webhookId` is provided, returns detailed delivery history; otherwise returns a summary across all the user's webhooks.",
    input_schema: {
      type: 'object',
      properties: {
        webhookId: {
          type: 'string',
          description: 'Optional — when set, return detail for one webhook.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10,
        },
      },
      required: [],
    },
  },
  {
    name: 'search_user_video_titles',
    description:
      "Fuzzy substring search across the user's past upload-job titles. Use when the user references a video by name without giving the ID — match the most recent / closest title and use its ID for follow-up calls.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 1, maxLength: 120 },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
      },
      required: ['query'],
    },
  },
];

/**
 * Returns a single cache_control block that wraps the tools array.
 * Anthropic caches the trailing tools block when system block is also
 * cached — both share the 5-min TTL.
 */
export function getCachedToolsConfig() {
  // The SDK doesn't currently expose cache_control on the tools field
  // shape, so the caller passes ATLAS_TOOLS through; caching is set on
  // the system block which is sufficient to hit the cache for the
  // (system + tools) shared prefix.
  return ATLAS_TOOLS;
}
