/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TubeForge MCP — run your YouTube channel from Claude, Cursor or ChatGPT",
  description:
    "Connect your YouTube channel to any MCP client. List videos, read stats, bulk-retitle, answer comments and schedule uploads with one sentence — every edit previewed before it happens.",
};

const MCP_URL = "https://tubeforge.co/api/mcp";

/**
 * /docs/mcp — setup guide for the TubeForge MCP server.
 * Server-rendered; mirrors the style of /docs/api.
 */
export default function McpDocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 sm:py-20">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            MCP · beta
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Keys to your channel
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70 sm:text-base">
            TubeForge is an MCP server. Connect it once and your AI assistant can
            list your videos, read your stats, rewrite titles, answer comments and
            schedule a week of uploads — with a before/after preview before
            anything changes on YouTube.
          </p>
        </header>

        <Section title="Try it in one sentence" anchor="demo">
          <p className="text-[14px] text-white/75">After connecting, paste any of these into your assistant:</p>
          <ul className="mt-3 space-y-2 text-[14px] text-white/85">
            <li>“Show me the 10 weakest videos from the last two months and propose better titles.”</li>
            <li>“Which comments on my channel have no reply? Draft answers in my voice.”</li>
            <li>“What went out this week and what is scheduled for next week?”</li>
            <li>“Schedule these 7 files, one per day at 18:00 Moscow time, starting Monday.”</li>
          </ul>
          <p className="mt-3 text-[13px] text-white/60">
            Edits are never silent: <Code>tubeforge_update_videos</Code> and <Code>tubeforge_reply_comments</Code> return
            a preview first and only apply after you confirm.
          </p>
        </Section>

        <Section title="Setup" anchor="setup">
          <ol className="space-y-3 text-[14px] text-white/85">
            <li>
              <strong className="text-white">1. Connect your channel.</strong>{" "}
              Sign in with Google at{" "}
              <a href="/settings#channels" className="text-brand-400 hover:text-brand-300 underline">Settings → Channels</a>.
            </li>
            <li>
              <strong className="text-white">2. Create an API key.</strong>{" "}
              <a href="/settings#integrations" className="text-brand-400 hover:text-brand-300 underline">Settings → Integrations</a>{" "}
              → Create new key. It looks like <Code>tf_…</Code> and is shown once.
            </li>
            <li>
              <strong className="text-white">3. Add the server to your client.</strong>{" "}
              Endpoint <Code>{MCP_URL}</Code>, header <Code>Authorization: Bearer tf_…</Code>.
            </li>
          </ol>

          <h3 className="mt-8 text-lg font-semibold">Claude Code</h3>
          <Pre>{`claude mcp add --transport http tubeforge ${MCP_URL} \\
  --header "Authorization: Bearer tf_YOUR_KEY"`}</Pre>

          <h3 className="mt-6 text-lg font-semibold">Claude Desktop / Cursor / Windsurf (JSON config)</h3>
          <Pre>{`{
  "mcpServers": {
    "tubeforge": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote", "${MCP_URL}",
        "--header", "Authorization: Bearer \${TUBEFORGE_API_KEY}"
      ],
      "env": { "TUBEFORGE_API_KEY": "tf_YOUR_KEY" }
    }
  }
}`}</Pre>
          <p className="mt-2 text-[13px] text-white/60">
            Clients with native remote-MCP support can point at the URL directly and add the same header.
          </p>

          <h3 className="mt-6 text-lg font-semibold">Check the connection</h3>
          <Pre>{`curl ${MCP_URL} \\
  -H "Authorization: Bearer tf_YOUR_KEY" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</Pre>
        </Section>

        <Section title="Tools" anchor="tools">
          <Table
            rows={[
              ["tubeforge_list_channels", "Connected channels with ids and subscriber counts. Start here."],
              ["tubeforge_list_videos", "Uploads on a channel, newest first, with raw views / likes / comments. Filters: query, publishedAfter."],
              ["tubeforge_get_video", "Full metadata of one video by id or URL."],
              ["tubeforge_get_channel_stats", "Last 7 / 28 days from the YouTube Analytics API: views, watch time, subscribers; by day, by video or total."],
              ["tubeforge_update_videos", "Bulk title / description / tags edit. confirm=false → before/after table; confirm=true → apply."],
              ["tubeforge_set_thumbnail", "Upload a custom thumbnail from an https image URL."],
              ["tubeforge_list_comments", "Comment threads on the channel or one video; unansweredOnly=true for the to-do list."],
              ["tubeforge_reply_comments", "Post owner replies. confirm=false → preview; confirm=true → post."],
              ["tubeforge_schedule_uploads", "Queue uploads with scheduledAt, privacy, tags; idempotencyKey makes retries safe."],
              ["tubeforge_get_upload_job", "Status of one upload job, with the YouTube URL when live."],
              ["tubeforge_get_calendar", "Scheduled and published jobs grouped by day."],
            ]}
          />
          <p className="mt-4 text-[13px] text-white/60">
            Prompts (slash commands in most clients): <Code>weekly_channel_review</Code>, <Code>retitle_underperformers</Code>,{" "}
            <Code>answer_comments</Code>, <Code>publish_week</Code>.
          </p>
        </Section>

        <Section title="Permissions" anchor="permissions">
          <p className="text-[14px] text-white/75">
            Reading videos, stats and comments and scheduling uploads work with the standard YouTube permissions you grant at sign-in.
            Editing titles and posting replies additionally need the <em>“Manage your YouTube account”</em> permission
            (<Code>youtube.force-ssl</Code>). When it has not been granted, those tools return <Code>insufficient_scope</Code> with a
            reconnect link instead of failing silently.
          </p>
          <p className="mt-3 text-[14px] text-white/75">
            Every tool is scoped to the channels connected to the API key that made the request — your own channels and channels your
            end-users connected through the Publishing API. The server keeps no session state; each request is authenticated on its own.
          </p>
        </Section>

        <Section title="Limits" anchor="limits">
          <Table
            rows={[
              ["Requests", "120 MCP requests per minute per API key"],
              ["Bulk edits", "50 videos per tubeforge_update_videos call; 25 replies per tubeforge_reply_comments call"],
              ["YouTube quota", "Reads cost 1–2 units; each applied edit or reply costs 50. The tool result reports quotaUnits used."],
              ["Data", "Only raw YouTube API values are returned — no scores, projections or benchmarks. Stats windows are capped at 28 days."],
            ]}
          />
        </Section>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-[12px] text-white/40">
          Prefer plain HTTP? The same keys work with the{" "}
          <a href="/docs/api" className="text-white/60 underline hover:text-white">Publishing API</a>. Questions:{" "}
          <a href="mailto:support@tubeforge.co" className="text-white/60 underline hover:text-white">support@tubeforge.co</a>
        </div>
      </div>
    </div>
  );
}

/* ── Local UI primitives (same as /docs/api) ──────────────────────── */

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
      <table className="w-full text-left text-[13px]">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-white/5 last:border-0">
              <td className="w-[38%] px-4 py-2.5 align-top font-mono text-[12px] text-brand-300">{k}</td>
              <td className="px-4 py-2.5 text-white/75">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
