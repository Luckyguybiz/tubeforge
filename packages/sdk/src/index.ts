/**
 * @tubeforge/sdk — Official TypeScript SDK for the TubeForge Publishing API.
 *
 * https://tubeforge.co/docs/api
 */

export { TubeForgeClient, YouTubeNamespace, AuthNamespace } from "./client";
export type { ClientOptions } from "./client";
export { verifyWebhook } from "./webhooks";
export {
  TubeForgeApiError,
  type ApiErrorResponse,
  type ChannelListing,
  type CreateJobResponse,
  type JobStatus,
  type JobStatusResponse,
  type OAuthStartResponse,
  type PrivacyStatus,
  type UploadInput,
  type WebhookDelivery,
  type WebhookEvent,
} from "./types";
