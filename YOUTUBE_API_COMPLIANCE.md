# YouTube API Services Compliance — TubeForge

This document explains how TubeForge complies with the YouTube API Services Terms of Service.
Effective date: 2026-04-29 (after compliance review).

## 1. Single Project ID (Policy III.D.1c)

TubeForge accesses YouTube API Services through a single Google Cloud project:
- **Project Number:** 78786866479
- **OAuth client ID:** the only client used for all API requests
- **API key:** single application API key

No multiple projects, no project-rotation, no project-sharding.

## 2. No Aggregation of Other Channels' Data (Policy III.E.2a,b)

TubeForge does NOT aggregate YouTube API data across multiple content owners.

**Removed features (April 2026):**
- `/shorts-analytics` — public Shorts trends across other creators' channels — REMOVED
- `/tiktok-analytics` — TikTok analytics combined with YouTube data — REMOVED
- `/analytics` — meta-page that combined the above tabs — REMOVED
- API endpoints `/api/tools/shorts-analytics`, `/api/tools/tiktok-analytics` — DELETED
- Related views `src/views/ShortsAnalytics`, `src/views/TiktokAnalytics` — DELETED

**Allowed:** A user can view their OWN channel data only, after authorizing TubeForge via OAuth 2.0. The user is the content owner of their own channel.

## 3. 30-Day Data Retention (Policy III.E.4a-g)

TubeForge does NOT store YouTube API data for more than 30 days.

**Mechanism:**
- Database table `Channel` (the only persisted YouTube API artifact via OAuth) has `updatedAt: DateTime @updatedAt` — auto-updates whenever data is refreshed.
- Cleanup job `scripts/youtube-data-cleanup.ts` runs daily at 03:00 UTC and deletes any `Channel` row where `updatedAt < NOW - 30 days`.
- In-memory cache (`src/lib/cache.ts`) uses TTL-based eviction; no entries persist beyond their TTL (max 24h for any cached data).
- No filesystem cache or Redis cluster stores YouTube API data.

**Filter limits:** UI date-range filters never exceed 30 days. Removed options:
- "Last 3 months" — REMOVED
- "Last 6 months" — REMOVED
- "Last year" — REMOVED
- "All time" — REMOVED

Allowed UI ranges: Today, Yesterday, Last 7 days, Last 28 days.

## 4. No Derived/Independent Metrics (Policy III.E.4h)

TubeForge does NOT calculate independent or derived metrics from YouTube API data.

**Removed AI scores and derived metrics (April 2026):**
- "Overall score" / "Title score" / "Description score" / "Tags score" / "Thumbnail score" / "Engagement score" / "SEO score" — REMOVED
- "Virality" composite score — REMOVED
- "Hold" / "Comparison" qualitative buckets — REMOVED
- "Best time to post" recommendations — REMOVED
- "Audience platforms" cross-platform inferences — REMOVED
- "Frequency: 1-3 Shorts per day" suggestions — REMOVED
- "Readability" content score — REMOVED
- "Search wholesale" search-rank score — REMOVED
- "estimatedCTR" inferred CTR bucket — REMOVED
- "benchmarkComparison" relative-to-niche bucket — REMOVED
- "viewsPerDay" derived velocity metric — REMOVED
- AI-generated optimization suggestions based on YouTube API data — REMOVED

**Allowed (direct YouTube API fields, no derivation):**
- View count (`statistics.viewCount`)
- Like count (`statistics.likeCount`)
- Comment count (`statistics.commentCount`)
- Like rate / Comment rate (mathematical % of API-provided values)
- Title, description, tags (`snippet.*`)
- Channel name, subscriber count
- Published date, duration, category

## 5. Branding Compliance (Policy III.F.2a,b)

YouTube logo/icon usage:
- Footer icon: 28×20px (height ≥ 20dp minimum)
- Color: official YouTube red `#FF0000` background, white play triangle
- Aspect ratio: official 1.4:1 (24:17 logo proportions preserved)
- No modifications to shape, no shadows, no overlays
- Source: official YouTube brand resources

## 6. Data Combination

YouTube API data is NEVER combined with data from TikTok, Instagram, VK Clips, Telegram, or any other social platform in the same UI surface, table, or analytics export.

## 7. Promotional Codes

Promo codes (e.g., `SHORTS2026`) provide discount on TubeForge subscription tiers only. They do NOT grant extended access to YouTube API data, longer retention windows, or additional API quota.

## 8. Removed surfaces (September 2026)

To keep the API Client strictly within the approved use case (creator tools
for the user's own channel: thumbnails, publishing, own-channel statistics)
and to remove any surface that could be read as accessing YouTube content
outside of YouTube API Services (Policy III.E.6), the following were removed
from the codebase on 2026-09-02:

- **Chrome extension** (`chrome-extension/`) — a video downloader that used a
  third-party service (Cobalt). Retired; the Web Store listing must be
  unpublished.
- **TikTok downloader** (`/api/tools/tiktok-download`, `/tools/tiktok-downloader`)
  — third-party download service; also removed so that no "downloader"
  surface exists under the TubeForge brand.
- **VPN** (`/vpn`, `vpn` tRPC router, WireGuard helpers, VPN plan feature,
  Stripe downgrade hooks) — unrelated to the approved use case.
- `/api/tools/youtube-download` renamed to `/api/tools/video-inspector`.
  The endpoint only ever called the YouTube Data API (`videos.list`) and
  the public oEmbed endpoint; the old path name was misleading.

The `VpnPeer` database table is intentionally left in place (no schema drop
in this change); it is no longer read or written by the application.

## Contact

For YouTube API compliance questions: support@tubeforge.co
