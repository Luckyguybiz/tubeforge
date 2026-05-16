/**
 * TubeForgeClient — core HTTP wrapper for the v1 REST surface.
 *
 * Auth: X-Forge-Key header (one per organization, generated in Settings).
 * Errors: any non-2xx response is parsed as { error: { code, message } }
 *   and thrown as a TubeForgeApiError so callers can branch on .code.
 */

import {
  ApiErrorResponse,
  ChannelListing,
  CreateJobResponse,
  JobStatusResponse,
  OAuthStartResponse,
  TubeForgeApiError,
  UploadInput,
  JobStatus,
} from "./types";

export interface ClientOptions {
  /** API key generated in Settings → Integrations (format: tf_…). */
  apiKey: string;
  /** Base URL of the TubeForge instance. Defaults to https://tubeforge.co */
  baseUrl?: string;
  /** Override the global fetch implementation (Node 18+ has it builtin). */
  fetch?: typeof globalThis.fetch;
  /** Per-request timeout in ms. Default 30s. */
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = "https://tubeforge.co";
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Top-level SDK client. Construct once per process / runtime, reuse
 * across all calls — it's stateless beyond the apiKey.
 *
 * @example
 *   import { TubeForgeClient } from "@tubeforge/sdk";
 *   const tf = new TubeForgeClient({ apiKey: process.env.TUBEFORGE_API_KEY! });
 *   const job = await tf.youtube.upload({
 *     channelId: "UCxxxxx",
 *     videoUrl:  "https://cdn.example.com/clip.mp4",
 *     title:     "My video",
 *   });
 *   const finished = await tf.youtube.waitForCompletion(job.jobId);
 *   console.log(finished.youtubeUrl);
 */
export class TubeForgeClient {
  readonly youtube: YouTubeNamespace;
  readonly auth: AuthNamespace;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly timeoutMs: number;

  constructor(opts: ClientOptions) {
    if (!opts.apiKey || !opts.apiKey.startsWith("tf_")) {
      throw new Error('TubeForgeClient: apiKey must start with "tf_"');
    }
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.youtube = new YouTubeNamespace(this);
    this.auth = new AuthNamespace(this);
  }

  /** Internal — perform an authenticated request with timeout. */
  async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), this.timeoutMs);

    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "X-Forge-Key": this.apiKey,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        let parsed: ApiErrorResponse | null = null;
        try {
          parsed = (await res.json()) as ApiErrorResponse;
        } catch {
          /* not JSON — fall through */
        }
        throw new TubeForgeApiError(
          res.status,
          parsed?.error?.code ?? "http_error",
          parsed?.error?.message ?? `HTTP ${res.status} ${res.statusText}`,
          parsed?.error?.details,
        );
      }

      if (res.status === 204) {
        return undefined as T;
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(id);
    }
  }
}

/* ─────────────── YouTube namespace ─────────────── */

export class YouTubeNamespace {
  constructor(private readonly client: TubeForgeClient) {}

  /** Create a new async upload job. Returns immediately with a job ID. */
  async upload(input: UploadInput): Promise<CreateJobResponse> {
    const body: Record<string, unknown> = { ...input };
    if (input.scheduledAt instanceof Date) {
      body.scheduledAt = input.scheduledAt.toISOString();
    }
    return this.client.request<CreateJobResponse>(
      "POST",
      "/api/v1/youtube/upload",
      body,
    );
  }

  /** Get status of a single upload job. */
  async getJob(jobId: string): Promise<JobStatusResponse> {
    return this.client.request<JobStatusResponse>(
      "GET",
      `/api/v1/youtube/jobs/${encodeURIComponent(jobId)}`,
    );
  }

  /** Cancel a QUEUED job. 409 if already started. */
  async cancelJob(jobId: string): Promise<{ cancelled: boolean; jobId: string }> {
    return this.client.request("POST", `/api/v1/youtube/jobs/${encodeURIComponent(jobId)}`);
  }

  /** List channels available to this API key. */
  async listChannels(): Promise<ChannelListing> {
    return this.client.request<ChannelListing>("GET", "/api/v1/youtube/channels");
  }

  /**
   * Poll {@link getJob} until the job reaches a terminal state
   * (COMPLETED / FAILED / CANCELLED) or {@link options.timeoutMs} elapses.
   *
   * @param jobId returned by {@link upload}
   * @param options.intervalMs   how often to poll (default 5s)
   * @param options.timeoutMs    maximum wait (default 10min)
   * @param options.onProgress   called on each poll with the latest status
   */
  async waitForCompletion(
    jobId: string,
    options: {
      intervalMs?: number;
      timeoutMs?: number;
      onProgress?: (status: JobStatusResponse) => void;
    } = {},
  ): Promise<JobStatusResponse> {
    const interval = options.intervalMs ?? 5_000;
    const totalTimeout = options.timeoutMs ?? 10 * 60 * 1000;
    const startedAt = Date.now();

    // Disambiguate terminal states locally
    const isTerminal = (s: JobStatus) =>
      s === "completed" || s === "failed" || s === "cancelled";

    // First fetch
    let status = await this.getJob(jobId);
    options.onProgress?.(status);
    if (isTerminal(status.status)) return status;

    while (Date.now() - startedAt < totalTimeout) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      status = await this.getJob(jobId);
      options.onProgress?.(status);
      if (isTerminal(status.status)) return status;
    }

    throw new TubeForgeApiError(
      408,
      "wait_timeout",
      `Job ${jobId} did not reach terminal state within ${totalTimeout}ms`,
    );
  }
}

/* ─────────────── Auth namespace (Phase 3b) ─────────────── */

export class AuthNamespace {
  constructor(private readonly client: TubeForgeClient) {}

  /**
   * Begin the YouTube OAuth flow for an end-user of your platform.
   * Returns an authorizationUrl to send the user to. After consent,
   * TubeForge redirects back to your supplied redirectUri with
   * ?status=ok&externalUserId=…&channelId=…
   */
  async connectChannel(input: {
    externalUserId: string;
    displayName?: string;
    redirectUri: string;
  }): Promise<OAuthStartResponse> {
    return this.client.request<OAuthStartResponse>(
      "POST",
      "/api/v1/auth/youtube/start",
      input,
    );
  }
}
