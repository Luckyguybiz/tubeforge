/**
 * Shared types for the TubeForge SDK.
 * Keep in sync with the server route contracts at:
 *   src/app/api/v1/youtube/upload/route.ts (POST shape)
 *   src/app/api/v1/youtube/jobs/[id]/route.ts (GET shape)
 *   src/server/routers/webhook.ts (WebhookEvent union)
 */

/** Privacy options accepted by YouTube Data API v3. */
export type PrivacyStatus = "public" | "unlisted" | "private";

/** Upload job lifecycle states as returned by the REST surface (lowercase). */
export type JobStatus =
  | "queued"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled";

/** Events you can subscribe to via Webhooks. */
export type WebhookEvent =
  | "video.completed"
  | "project.created"
  | "job.queued"
  | "job.uploading"
  | "job.completed"
  | "job.failed"
  | "job.cancelled";

/** Input for {@link TubeForgeClient.youtube.upload}. */
export interface UploadInput {
  /** Target YouTube channel ID (Phase 3a — your own channel). */
  channelId?: string;
  /** Or — opaque external user ID mapping (Phase 3b — partner end-user). */
  externalUserId?: string;
  /** Public HTTPS URL where TubeForge can fetch the video bytes. */
  videoUrl: string;
  title: string;
  description?: string;
  /** Up to 30 tags, each ≤ 50 chars. */
  tags?: string[];
  thumbnailUrl?: string;
  privacyStatus?: PrivacyStatus;
  /**
   * ISO 8601 datetime to schedule publication. When set, privacyStatus
   * is forced to "private" until the time elapses (YouTube requirement).
   */
  scheduledAt?: string | Date;
}

/** Response from POST /v1/youtube/upload (HTTP 202). */
export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
  scheduledAt: string | null;
  estimatedCompletion: string;
}

/** Response from GET /v1/youtube/jobs/:id. */
export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  title: string;
  privacyStatus: PrivacyStatus;
  channelId: string;
  uploadProgress: number;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  errorMessage: string | null;
  retryCount: number;
  scheduledAt: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  webhookDelivered: boolean;
}

/** Item returned by GET /v1/youtube/channels (own + external). */
export interface ChannelListing {
  own: Array<{
    channelId: string;
    title: string;
    thumbnail: string | null;
    subscribers: number;
    connectedAt: string;
  }>;
  external: Array<{
    externalUserId: string;
    displayName: string | null;
    channelId: string;
    title: string;
    thumbnail: string | null;
    subscribers: number;
  }>;
}

/** Response from POST /v1/auth/youtube/start. */
export interface OAuthStartResponse {
  authorizationUrl: string;
  callbackUrl: string;
  expiresAt: string;
}

/** Discriminated union of webhook payloads delivered to your endpoint. */
export interface WebhookDelivery<E extends WebhookEvent = WebhookEvent> {
  event: E;
  timestamp: string;
  data: Record<string, unknown>;
}

/** Error envelope returned by all v1 endpoints on failure. */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Thrown by SDK methods when the API returns a non-2xx status. */
export class TubeForgeApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "TubeForgeApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
