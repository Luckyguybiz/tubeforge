# @tubeforge/sdk

Official TypeScript SDK for the [TubeForge Publishing API](https://tubeforge.co/docs/api).

Auto-post videos to YouTube from any project — schedule uploads, set privacy, get webhook callbacks. One REST surface for both your own channels and your end-users' channels.

## Install

```bash
npm install @tubeforge/sdk
```

Requires Node.js ≥ 18 (or any runtime with global `fetch` + `crypto`).

## Quickstart

```ts
import { TubeForgeClient } from "@tubeforge/sdk";

const tf = new TubeForgeClient({ apiKey: process.env.TUBEFORGE_API_KEY! });

const job = await tf.youtube.upload({
  channelId: "UCxxxxxxxx",
  videoUrl:  "https://cdn.example.com/clip.mp4",
  title:     "My video",
  description: "Auto-posted via TubeForge",
  tags:      ["devlog", "2026"],
  privacyStatus: "public",
  scheduledAt: new Date("2026-05-17T15:00:00Z"),
});

console.log("Queued as", job.jobId);

const finished = await tf.youtube.waitForCompletion(job.jobId, {
  onProgress: (s) => console.log(s.status, s.uploadProgress),
});

console.log("Live at:", finished.youtubeUrl);
```

## Webhooks

Register a webhook URL in [Settings → Integrations](https://tubeforge.co/settings#integrations). TubeForge will POST signed payloads to your endpoint on every job state transition.

Verify the HMAC signature in your handler:

```ts
import { verifyWebhook } from "@tubeforge/sdk";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-forge-signature");
  const event = verifyWebhook(body, signature, process.env.TUBEFORGE_WEBHOOK_SECRET!);

  if (event.event === "job.completed") {
    // event.data.jobId, event.data.youtubeVideoId, …
  }
}
```

Throws `TubeForgeApiError` with code `invalid_signature` on mismatch.

## Multi-tenant (your users' channels)

If you're building a platform where each end-user connects their own YouTube channel:

```ts
// Step 1: get an authorization URL to send the user to
const { authorizationUrl } = await tf.auth.connectChannel({
  externalUserId: "maker_42",
  displayName:    "Cool Creator",
  redirectUri:    "https://your-app.com/oauth-done",
});

// Step 2: redirect user to authorizationUrl. After consent, TubeForge
//   redirects to your redirectUri with ?status=ok&channelId=…

// Step 3: upload on behalf of that user — use externalUserId instead of channelId
await tf.youtube.upload({
  externalUserId: "maker_42",
  videoUrl:       "https://cdn.example.com/clip.mp4",
  title:          "Hello YouTube",
});
```

## Error handling

All methods throw `TubeForgeApiError` on non-2xx responses. The error carries:

- `status`  — HTTP status (401 / 404 / 409 / 429 / 500 …)
- `code`    — machine-readable error code (`invalid_api_key`, `quota_exceeded`, …)
- `message` — human-readable description
- `details` — optional Zod issue list for `400 invalid_input`

```ts
try {
  await tf.youtube.upload({ videoUrl: "bad", title: "x" } as any);
} catch (e) {
  if (e instanceof TubeForgeApiError && e.code === "quota_exceeded") {
    // ask user to upgrade or wait until reset
  }
}
```

## Reference

| Method | Description |
|---|---|
| `tf.youtube.upload(input)` | Create an async upload job |
| `tf.youtube.getJob(id)` | Get current status of a job |
| `tf.youtube.cancelJob(id)` | Cancel a QUEUED job |
| `tf.youtube.listChannels()` | List own + external channels |
| `tf.youtube.waitForCompletion(id, opts)` | Poll until terminal state |
| `tf.auth.connectChannel(input)` | Begin OAuth for an external user |
| `verifyWebhook(rawBody, sig, secret)` | Verify HMAC signature |

Full HTTP reference: <https://tubeforge.co/docs/api>

## License

MIT © TubeForge
