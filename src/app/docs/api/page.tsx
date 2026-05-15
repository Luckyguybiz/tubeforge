/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TubeForge API — REST + Webhooks for YouTube auto-posting",
  description:
    "Integrate auto-posting to YouTube from any project via TubeForge REST API. API keys, OAuth onboarding, scheduled uploads, webhook callbacks.",
};

/**
 * /docs/api — Quickstart + REST reference for TubeForge Publishing API.
 *
 * Server-rendered page (no client state needed). Match the dark / gradient
 * aesthetic of the landing while keeping the docs aspect cleanly readable.
 */
export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 sm:py-20">
        {/* Hero */}
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            v1 · live
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            TubeForge Publishing API
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70 sm:text-base">
            Auto-post videos to YouTube from any project — schedule uploads, set
            privacy, get webhook callbacks. One REST surface for both your own
            channels and your end-users&apos; channels.
          </p>
        </header>

        {/* Quickstart */}
        <Section title="Quickstart" anchor="quickstart">
          <ol className="space-y-3 text-[14px] text-white/85">
            <li>
              <strong className="text-white">1. Generate an API key.</strong>{" "}
              <a href="/settings#integrations" className="text-brand-400 hover:text-brand-300 underline">
                Settings → Integrations
              </a>{" "}
              → Create new key. Format <Code>tf_…</Code> (64 hex chars). Shown
              once at generation — store securely.
            </li>
            <li>
              <strong className="text-white">2. Send it in every request.</strong>{" "}
              Use HTTP header <Code>X-Forge-Key: tf_…</Code>.
            </li>
            <li>
              <strong className="text-white">3. Upload a video.</strong>{" "}
              <Code>POST /api/v1/youtube/upload</Code> with channel + video URL
              + metadata. Returns <Code>{`{ jobId, status: "queued" }`}</Code> immediately.
            </li>
            <li>
              <strong className="text-white">4. Poll or subscribe.</strong>{" "}
              <Code>GET /api/v1/youtube/jobs/:id</Code> for status, or register
              a webhook URL that receives <Code>job.completed</Code> / <Code>job.failed</Code> events.
            </li>
          </ol>

          <Pre>
            {`# Upload + schedule for 3pm tomorrow
curl -X POST https://tubeforge.co/api/v1/youtube/upload \\
  -H "X-Forge-Key: tf_$YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channelId": "UCxxxxxxxx",
    "videoUrl": "https://cdn.example.com/clip.mp4",
    "title": "My video",
    "description": "Auto-posted via TubeForge",
    "tags": ["devlog","2026"],
    "privacyStatus": "public",
    "scheduledAt": "2026-05-17T15:00:00Z"
  }'

# Response (202 Accepted)
{
  "jobId": "uploadjob_abc123",
  "status": "queued",
  "scheduledAt": "2026-05-17T15:00:00Z",
  "estimatedCompletion": "2026-05-17T15:00:30Z"
}`}
          </Pre>
        </Section>

        {/* Authentication */}
        <Section title="Authentication" anchor="auth">
          <p className="text-[14px] text-white/75">
            Every API call sends an API key in the <Code>X-Forge-Key</Code>{" "}
            header. Keys are hashed at rest (SHA-256). Revoke compromised keys
            from Settings — revocation takes effect immediately.
          </p>
          <h3 className="mt-4 text-[13px] font-bold uppercase tracking-wider text-white/60">
            Errors
          </h3>
          <Table
            rows={[
              ["401 missing_api_key", "X-Forge-Key header absent"],
              ["401 invalid_api_key", "Key does not match any record"],
              ["401 revoked_api_key", "Key was revoked in Settings"],
              ["429 quota_exceeded", "Monthly upload limit reached"],
            ]}
          />
        </Section>

        {/* Endpoints */}
        <Section title="Endpoints" anchor="endpoints">
          <EndpointBlock
            method="POST"
            path="/api/v1/youtube/upload"
            description="Create an async upload job. Returns 202 with jobId."
            body={`{
  "channelId":   "UCxxxxx",       // OR externalUserId for Phase 3b
  "videoUrl":    "https://...",   // required, must be publicly fetchable
  "title":       "string ≤100",
  "description": "string ≤5000",
  "tags":        ["string ≤50",   // optional, max 30
                  "string"],
  "thumbnailUrl":"https://...",   // optional
  "privacyStatus": "public" | "unlisted" | "private",
  "scheduledAt": "2026-05-17T15:00:00Z"  // optional ISO 8601
}`}
          />

          <EndpointBlock
            method="GET"
            path="/api/v1/youtube/jobs/:id"
            description="Fetch full status of a single upload job. Throttle to ≤1 req/sec/job."
          />

          <EndpointBlock
            method="POST"
            path="/api/v1/youtube/jobs/:id"
            description="Cancel a QUEUED job. 409 if job already started."
          />

          <EndpointBlock
            method="GET"
            path="/api/v1/youtube/channels"
            description="List channels available to this API key (own + external)."
          />

          <EndpointBlock
            method="POST"
            path="/api/v1/auth/youtube/start"
            description="(Phase 3b) Begin OAuth flow for an external end-user. Returns authorizationUrl."
            body={`{
  "externalUserId": "maker_42",
  "displayName":    "Optional name for admin debug",
  "redirectUri":    "https://your-app.com/oauth-done"
}`}
          />
        </Section>

        {/* Webhooks */}
        <Section title="Webhooks" anchor="webhooks">
          <p className="text-[14px] text-white/75">
            Register a webhook URL in <a href="/settings#integrations" className="text-brand-400 hover:text-brand-300 underline">Settings → Integrations</a>. TubeForge will POST job lifecycle
            events to your URL. Signed with HMAC-SHA256 over the body using your
            webhook secret.
          </p>
          <h3 className="mt-4 text-[13px] font-bold uppercase tracking-wider text-white/60">
            Events
          </h3>
          <Table
            rows={[
              ["job.queued", "Job created and waiting for worker"],
              ["job.uploading", "Worker picked up, video in transit to YouTube"],
              ["job.completed", "YouTube acknowledged the upload; videoId set"],
              ["job.failed", "Permanent failure after 3 retries"],
              ["job.cancelled", "User cancelled before worker started"],
            ]}
          />
          <Pre>
            {`// Sample webhook payload
{
  "event":     "job.completed",
  "timestamp": "2026-05-17T15:00:45Z",
  "data": {
    "jobId":          "uploadjob_abc123",
    "youtubeVideoId": "dQw4w9WgXcQ",
    "channelId":      "UCxxxxx",
    "title":          "My video"
  }
}

// Signature header
X-Forge-Signature: <hmac-sha256(body, webhook_secret)>`}
          </Pre>
        </Section>

        {/* Rate limits */}
        <Section title="Rate limits & quotas" anchor="limits">
          <Table
            rows={[
              ["Monthly uploads per key", "1,000 (default tier)"],
              ["Polling rate per job", "≤ 1 req / sec"],
              ["Webhook delivery retry", "5 attempts, exponential backoff"],
              ["State token TTL (OAuth)", "1 hour"],
            ]}
          />
        </Section>

        {/* SDK preview */}
        <Section title="TypeScript SDK (preview)" anchor="sdk">
          <p className="text-[14px] text-white/75">
            <Code>@tubeforge/sdk</Code> wraps the REST surface plus webhook
            signature verification. Coming to npm shortly.
          </p>
          <Pre>
            {`import { TubeForgeClient, verifyWebhook } from "@tubeforge/sdk";

const tf = new TubeForgeClient({ apiKey: process.env.TUBEFORGE_API_KEY });

const job = await tf.youtube.upload({
  channelId: "UCxxxxx",
  videoUrl:  "https://cdn.example.com/clip.mp4",
  title:     "My video",
  scheduledAt: new Date("2026-05-17T15:00:00Z"),
});

const finished = await tf.youtube.waitForCompletion(job.jobId);
console.log("Live at:", finished.youtubeUrl);`}
          </Pre>
        </Section>

        {/* Footer note */}
        <div className="mt-16 border-t border-white/10 pt-8 text-center text-[12px] text-white/40">
          v1 · last updated May 16, 2026 · email{" "}
          <a href="mailto:support@tubeforge.co" className="text-white/70 hover:text-white underline">
            support@tubeforge.co
          </a>{" "}
          for questions
        </div>
      </div>
    </div>
  );
}

/* ── Local UI primitives ───────────────────────────────────────────── */

function Section({ title, anchor, children }: { title: string; anchor: string; children: React.ReactNode }) {
  return (
    <section id={anchor} className="mt-12 scroll-mt-16">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        <a href={`#${anchor}`} className="text-white hover:text-brand-400">
          {title}
        </a>
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-white/90">
      {children}
    </code>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-white/85">
      <code>{children}</code>
    </pre>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-[13px]">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
              <td className="border-b border-white/5 px-4 py-2.5 font-mono text-[12px] text-white/85 align-top whitespace-nowrap">
                {k}
              </td>
              <td className="border-b border-white/5 px-4 py-2.5 text-white/70">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointBlock({
  method,
  path,
  description,
  body,
}: {
  method: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  description: string;
  body?: string;
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    POST: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    PUT: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    DELETE: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${methodColors[method] ?? ""}`}
        >
          {method}
        </span>
        <code className="font-mono text-[13px] text-white/90">{path}</code>
      </div>
      <p className="mt-2 text-[13px] text-white/70">{description}</p>
      {body && <Pre>{body}</Pre>}
    </div>
  );
}
