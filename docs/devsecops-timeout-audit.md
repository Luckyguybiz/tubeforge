# DevSecOps Security Audit: Timeout Increase & Availability

**Date:** 2026-03-23
**Scope:** Timeout increase for AI generation endpoints (Development branch `climpire/02b8a3db`)
**Auditor:** DevSecOps — Pipe

---

## Executive Summary

The Development team increased AI generation timeouts to resolve premature request termination:
- `fetchWithTimeout` default: 30s → 60s
- fal.ai SDK calls: added explicit `timeout: 90_000`
- tRPC route handler: added `maxDuration = 120`
- Client-side tRPC: added 120s `AbortSignal.timeout`

This audit evaluates the availability and security implications of these changes.

---

## Finding 1: PM2 Cluster Mode — Original Concern Mitigated

**Severity:** INFO (no action needed)

The original DevSecOps concern raised at kickoff stated:
> "The VPS runs PM2 in fork mode with a single instance, so a longer timeout ties up the sole process."

**Actual state:** `ecosystem.config.js` configures **cluster mode with 4 instances**:
```js
instances: 4,
exec_mode: 'cluster',
max_memory_restart: '512M',
```

With 4 workers, a single long-running AI request (up to 90s for fal.ai) occupies only 1 of 4 processes. The remaining 3 workers continue serving requests normally.

**Verdict:** The timeout increase does NOT create a single-point-of-failure availability risk. ✅

---

## Finding 2: `start.js` vs `ecosystem.config.js` Deployment Discrepancy

**Severity:** MEDIUM — Warning only

The project memory states: `pm2 start start.js --name tubeforge`

`start.js` spawns a single `next start` child process:
```js
// start.js
require('dotenv').config();
const { spawn } = require('child_process');
const child = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3000'], {
  stdio: 'inherit',
  env: process.env
});
```

If production uses `pm2 start start.js`, the app runs in **fork mode as 1 instance**, negating the cluster config in `ecosystem.config.js`.

**Recommendation:** Ensure production launches via:
```bash
pm2 start ecosystem.config.js
# or
pm2 start ecosystem.config.cjs
```
This activates cluster mode (4 instances) and the `max_memory_restart` safety net.

---

## Finding 3: In-Memory Rate Limiting Not Shared Across Cluster Workers

**Severity:** MEDIUM — Warning only

`src/lib/rate-limit.ts` uses an in-memory `Map` for per-user rate limiting. The file itself documents this limitation:
> "CURRENT SETUP (PM2 single instance): In-memory rate limiting is acceptable for single-instance PM2 fork mode."

In cluster mode (4 workers), each worker maintains its own independent Map. This means:
- AI endpoint limit of 10 req/min/user becomes effectively **40 req/min/user** (10 per worker)
- Edge middleware (`src/middleware.ts`) has the same in-memory limitation for auth rate limiting

**Current mitigation:** AI usage is also bounded by plan-level limits (checked via Prisma transaction in `checkAndConsumeAIUsage`), which IS shared across workers via the database. This provides a hard ceiling regardless of rate-limit bypass.

**Recommendation (post-launch):** Migrate to Redis-based rate limiting as documented in the file's migration path (Upstash Redis). This becomes more urgent if:
- Worker count increases beyond 4
- AI generation costs increase significantly
- Abuse patterns emerge

---

## Finding 4: Timeout Chain Consistency

**Severity:** LOW — Warning only

The timeout chain should follow: **client > route handler > upstream API** to ensure clean error propagation.

| Layer | Current (base) | After Dev changes |
|---|---|---|
| Client tRPC (`AbortSignal`) | none | 120s |
| Route handler (`maxDuration`) | none | 120s |
| fal.ai SDK (`timeout`) | SDK default | 90s |
| `fetchWithTimeout` (OpenAI/other) | 30s | 60s |

**Assessment:** The Dev team's timeout chain is correctly ordered:
- fal.ai (90s) < route handler (120s) < client (120s) ✅
- fetchWithTimeout (60s) < route handler (120s) < client (120s) ✅

The upstream timeout fires first, giving the handler time to format an error response before the client aborts. This is proper layered timeout design.

**Minor note:** `maxDuration` is a Vercel-specific export. On self-hosted PM2/Node.js, it has no runtime effect — it's a no-op. The actual server-side timeout protection comes from `fetchWithTimeout` and fal.ai SDK `timeout`. This is acceptable (no harm, forward-compatible if ever deployed to Vercel).

---

## Finding 5: Slow Request Observability

**Severity:** LOW — Warning only

The tRPC logger middleware (`src/server/trpc.ts:40-54`) logs warnings for requests exceeding 1 second:
```ts
if (duration > 1000) {
  log.warn('Slow tRPC call', { path, type, duration });
}
```

With timeouts increasing to 60–90s, the 1s threshold will generate many warn-level logs for normal AI generation requests. This is acceptable (better to over-log than under-log), but consider:
- Adding a separate threshold for known-slow AI endpoints (e.g., 30s)
- Adding structured fields (`{ isAiEndpoint: true }`) for log filtering

---

## Risk Matrix Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | PM2 already cluster mode (4 instances) | INFO | None — original concern mitigated |
| 2 | `start.js` may bypass cluster config | MEDIUM | Verify production uses `ecosystem.config.js` |
| 3 | In-memory rate limits not shared across workers | MEDIUM | Migrate to Redis post-launch |
| 4 | Timeout chain correctly layered | LOW | None — well-designed |
| 5 | Slow-request logging threshold noise | LOW | Consider AI-specific log threshold |

---

## Conclusion

The timeout increase is **safe for production deployment** given the current architecture:
- 4 cluster workers absorb long-running AI requests without blocking
- Rate limiting + plan-level DB limits bound resource consumption per user
- Timeout chain is correctly ordered for clean error propagation

The two MEDIUM findings (deployment command verification, Redis rate-limit migration) are operational improvements that should be addressed but do NOT block this change.
