import Link from 'next/link';
import { ApiPlayground } from './ApiPlayground';
import { CodeExamples } from './CodeExamples';

/* ── Hardcoded dark palette for server-rendered SEO page ──────────── */
const C = {
  bg: '#0d0d18',
  surface: '#14142a',
  card: '#1a1a2e',
  border: '#2a2a44',
  text: '#e8e8f0',
  sub: '#8b8b9e',
  dim: '#55556a',
  accent: '#f43f5e',
  blue: '#3a7bfd',
  green: '#2dd4a0',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  cyan: '#22d3ee',
};

const BASE_URL = 'https://tubeforge.co';

/* ── Shared sub-components ────────────────────────────────────────── */

function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '16px 20px',
        fontSize: 13,
        lineHeight: 1.7,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: C.text,
        overflow: 'auto',
        whiteSpace: 'pre',
        margin: '12px 0 20px',
      }}
    >
      {code}
    </pre>
  );
}

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      style={{
        fontSize: 20,
        fontWeight: 700,
        color: C.text,
        margin: '48px 0 12px',
        paddingBottom: 8,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {children}
    </h2>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'monospace',
        background: `${color}18`,
        color,
        letterSpacing: 0.3,
      }}
    >
      {children}
    </span>
  );
}

function Param({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <code style={{ fontWeight: 700, color: C.text, fontSize: 13, minWidth: 100 }}>{name}</code>
      <span style={{ fontSize: 12, color: C.dim, fontFamily: 'monospace' }}>{type}</span>
      {required && <span style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: 0.5 }}>REQUIRED</span>}
      <span style={{ fontSize: 13, color: C.sub, flex: 1, minWidth: 200 }}>{desc}</span>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ color: C.text, background: C.bg, padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
      {children}
    </code>
  );
}

function RateLimitBadge({ limit, window: w }: { limit: number; window: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        background: `${C.cyan}12`,
        color: C.cyan,
        fontFamily: 'monospace',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {limit}/{w}
    </span>
  );
}

/* ── Table of Contents ────────────────────────────────────────────── */

const TOC_ITEMS = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'base-url', label: 'Base URL' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'try-it', label: 'Try It' },
  { id: 'error-codes', label: 'Error Codes' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'sdks', label: 'SDKs & Libraries' },
];

/* ── Page (Server Component) ──────────────────────────────────────── */

export default function ApiDocsPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: C.bg,
        color: C.text,
        fontFamily: "var(--font-sans), 'Instrument Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Back link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: C.dim,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 32,
          }}
        >
          &larr; Home
        </Link>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.5 }}>
              TubeForge API
            </h1>
            <Badge color={C.green}>v1</Badge>
          </div>
          <p style={{ fontSize: 16, color: C.sub, margin: '0 0 16px', lineHeight: 1.6, maxWidth: 600 }}>
            Programmatic access to your TubeForge projects. Build integrations, automate workflows, and manage content at scale.
          </p>
          <div style={{
            padding: '12px 16px',
            background: `${C.purple}0a`,
            border: `1px solid ${C.purple}20`,
            borderRadius: 10,
            fontSize: 13,
            color: C.sub,
            lineHeight: 1.6,
          }}>
            API access is available on the <strong style={{ color: C.purple }}>Studio</strong> plan.
            Generate and manage API keys in{' '}
            <Link href="/settings" style={{ color: C.blue, textDecoration: 'none', fontWeight: 600 }}>Settings</Link>.
          </div>
        </div>

        {/* ── Table of Contents ───────────────────────────────────── */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 40,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>
            On this page
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
            {TOC_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  fontSize: 13,
                  color: C.blue,
                  textDecoration: 'none',
                  lineHeight: 1.8,
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* ── Authentication ──────────────────────────────────────── */}
        <SectionTitle id="authentication">Authentication</SectionTitle>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 12px' }}>
          All API requests must include a Bearer token in the <InlineCode>Authorization</InlineCode> header.
        </p>
        <CodeBlock code="Authorization: Bearer tf_your_api_key_here" />
        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>
          Generate API keys in your account{' '}
          <Link href="/settings" style={{ color: C.blue, textDecoration: 'none' }}>Settings</Link> page.
          Keys start with <InlineCode>tf_</InlineCode> and are shown only once after generation.
          You can create up to 5 keys per account and revoke them at any time.
        </p>

        {/* ── Base URL ────────────────────────────────────────────── */}
        <SectionTitle id="base-url">Base URL</SectionTitle>
        <CodeBlock code={`${BASE_URL}/api/v1`} />
        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>
          All endpoints are relative to this base URL. Always use HTTPS in production.
        </p>

        {/* ── Rate Limits ─────────────────────────────────────────── */}
        <SectionTitle id="rate-limits">Rate Limits</SectionTitle>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 16px' }}>
          Rate limits protect the API from abuse and ensure fair usage. Limits are applied per API key.
        </p>

        {/* Per-endpoint rate limit table */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: 0,
          }}>
            {/* Header */}
            <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>Endpoint</div>
            <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>Limit</div>
            <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>Window</div>
            {/* Rows */}
            {[
              { endpoint: 'GET /api/v1/projects', limit: '60', window: '1 min' },
              { endpoint: 'POST /api/v1/projects', limit: '60', window: '1 min' },
              { endpoint: 'API key mutations (tRPC)', limit: '10', window: '1 min' },
              { endpoint: 'Webhook mutations (tRPC)', limit: '10', window: '1 min' },
            ].map((row, i, arr) => (
              <div key={row.endpoint} style={{ display: 'contents' }}>
                <div style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: C.text,
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  {row.endpoint}
                </div>
                <div style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.cyan,
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  {row.limit}
                </div>
                <div style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  color: C.sub,
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  {row.window}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Response Headers</p>
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, color: C.text }}>
            <div>X-RateLimit-Limit: 60</div>
            <div>X-RateLimit-Remaining: 59</div>
            <div>X-RateLimit-Reset: 1711234567</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
          When the limit is exceeded, the API returns <Badge color={C.accent}>429</Badge> with a{' '}
          <InlineCode>Retry-After</InlineCode> header indicating how many seconds to wait before retrying.
        </p>

        {/* ── Endpoints ───────────────────────────────────────────── */}
        <SectionTitle id="endpoints">Endpoints</SectionTitle>

        {/* GET /api/v1/projects */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <Badge color={C.green}>GET</Badge>
            <code style={{ fontSize: 15, fontWeight: 700, color: C.text }}>/api/v1/projects</code>
            <RateLimitBadge limit={60} window="min" />
          </div>
          <p style={{ fontSize: 14, color: C.sub, margin: '8px 0 16px', lineHeight: 1.6 }}>
            List your projects with pagination. Returns most recently updated first.
          </p>

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Query Parameters</div>
          <Param name="page" type="number" desc="Page number (default: 1)" />
          <Param name="limit" type="number" desc="Items per page (default: 20, max: 50)" />
          <Param name="status" type="string" desc="Filter by status: DRAFT, RENDERING, READY, PUBLISHED" />

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '20px 0 8px' }}>Code Examples</div>
          <CodeExamples
            examples={{
              curl: `curl -X GET "${BASE_URL}/api/v1/projects?page=1&limit=10" \\
  -H "Authorization: Bearer tf_your_api_key"`,
              javascript: `const res = await fetch('${BASE_URL}/api/v1/projects?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer tf_your_api_key',
  },
});
const data = await res.json();
console.log(data.data);       // Project[]
console.log(data.pagination);  // { page, limit, total, pages }`,
              python: `import requests

res = requests.get(
    "${BASE_URL}/api/v1/projects",
    params={"page": 1, "limit": 10},
    headers={"Authorization": "Bearer tf_your_api_key"},
)
data = res.json()
for project in data["data"]:
    print(project["title"], project["status"])`,
            }}
          />

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Response <Badge color={C.green}>200</Badge></div>
          <CodeBlock code={`{
  "data": [
    {
      "id": "clx1234abc",
      "title": "My Project",
      "description": "A great video project",
      "status": "DRAFT",
      "tags": ["tutorial", "ai"],
      "thumbnailUrl": null,
      "sceneCount": 5,
      "createdAt": "2026-03-20T10:00:00.000Z",
      "updatedAt": "2026-03-20T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}`} />
        </div>

        {/* POST /api/v1/projects */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <Badge color={C.blue}>POST</Badge>
            <code style={{ fontSize: 15, fontWeight: 700, color: C.text }}>/api/v1/projects</code>
            <RateLimitBadge limit={60} window="min" />
          </div>
          <p style={{ fontSize: 14, color: C.sub, margin: '8px 0 16px', lineHeight: 1.6 }}>
            Create a new project. Subject to your plan&apos;s project limit.
          </p>

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Request Body (JSON)</div>
          <Param name="title" type="string" desc="Project title (max 100 chars, default: 'Untitled')" />
          <Param name="description" type="string" desc="Project description (max 5000 chars)" />
          <Param name="tags" type="string[]" desc="Tags array (max 30 items, each max 100 chars)" />

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '20px 0 8px' }}>Code Examples</div>
          <CodeExamples
            examples={{
              curl: `curl -X POST "${BASE_URL}/api/v1/projects" \\
  -H "Authorization: Bearer tf_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My New Project", "tags": ["tutorial"]}'`,
              javascript: `const res = await fetch('${BASE_URL}/api/v1/projects', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tf_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'My New Project',
    description: 'Created via API',
    tags: ['tutorial'],
  }),
});

const { data } = await res.json();
console.log(data.id);     // "clx5678def"
console.log(data.status); // "DRAFT"`,
              python: `import requests

res = requests.post(
    "${BASE_URL}/api/v1/projects",
    headers={
        "Authorization": "Bearer tf_your_api_key",
        "Content-Type": "application/json",
    },
    json={
        "title": "My New Project",
        "description": "Created via API",
        "tags": ["tutorial"],
    },
)

project = res.json()["data"]
print(f"Created: {project['id']} ({project['status']})")`,
            }}
          />

          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Response <Badge color={C.blue}>201 Created</Badge></div>
          <CodeBlock code={`{
  "data": {
    "id": "clx5678def",
    "title": "My New Project",
    "description": "Created via API",
    "status": "DRAFT",
    "tags": ["tutorial"],
    "createdAt": "2026-03-20T14:00:00.000Z",
    "updatedAt": "2026-03-20T14:00:00.000Z"
  }
}`} />
        </div>

        {/* ── Try It (Client Component) ───────────────────────────── */}
        <SectionTitle id="try-it">Try It</SectionTitle>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 16px' }}>
          Test API endpoints directly from your browser using your API key. Requests are sent from your browser to{' '}
          <InlineCode>{BASE_URL}</InlineCode> -- your key never leaves your machine.
        </p>
        <ApiPlayground />

        {/* ── Error Codes ─────────────────────────────────────────── */}
        <SectionTitle id="error-codes">Error Codes</SectionTitle>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 16px' }}>
          All errors return a JSON body with an <InlineCode>error</InlineCode> field describing the issue.
        </p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          {[
            { code: '400', desc: 'Bad Request -- Invalid JSON body or parameters', color: C.orange },
            { code: '401', desc: 'Unauthorized -- Missing or invalid API key', color: C.accent },
            { code: '403', desc: 'Forbidden -- Plan limit reached or insufficient permissions', color: C.purple },
            { code: '404', desc: 'Not Found -- Resource does not exist', color: C.dim },
            { code: '429', desc: 'Too Many Requests -- Rate limit exceeded', color: C.orange },
            { code: '500', desc: 'Internal Server Error -- Something went wrong on our end', color: C.accent },
          ].map((e, i) => (
            <div
              key={e.code}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 20px',
                borderBottom: i < 5 ? `1px solid ${C.border}` : 'none',
                alignItems: 'center',
              }}
            >
              <Badge color={e.color}>{e.code}</Badge>
              <span style={{ fontSize: 13, color: C.sub }}>{e.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Error Response Format</div>
        <CodeBlock code={`{
  "error": "Unauthorized. Provide a valid Bearer token in the Authorization header."
}`} />

        {/* ── Webhooks ────────────────────────────────────────────── */}
        <SectionTitle id="webhooks">Webhooks</SectionTitle>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 16px' }}>
          Receive real-time HTTP notifications when events occur in your account. Configure webhooks in{' '}
          <Link href="/settings" style={{ color: C.blue, textDecoration: 'none' }}>Settings</Link>{' '}
          or via the tRPC API. Only <InlineCode>https://</InlineCode> URLs are accepted. Maximum 10 webhooks per account.
        </p>

        {/* Webhook setup */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Setup</div>
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          fontSize: 13,
          color: C.sub,
          lineHeight: 1.8,
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ color: C.purple, fontWeight: 700, fontSize: 14 }}>1.</span>
            <span>Register a webhook URL with the events you want to listen to.</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ color: C.purple, fontWeight: 700, fontSize: 14 }}>2.</span>
            <span>Store the <InlineCode>whsec_</InlineCode> secret returned at registration (shown only once).</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <span style={{ color: C.purple, fontWeight: 700, fontSize: 14 }}>3.</span>
            <span>Verify signatures on incoming webhooks using HMAC-SHA256 before processing.</span>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Available Events</div>
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          {[
            { event: 'project.created', desc: 'A new project has been created', color: C.blue },
            { event: 'video.completed', desc: 'A video has finished rendering and is ready for download', color: C.green },
          ].map((e, i) => (
            <div
              key={e.event}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 20px',
                borderBottom: i < 1 ? `1px solid ${C.border}` : 'none',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Badge color={e.color}>{e.event}</Badge>
              <span style={{ fontSize: 13, color: C.sub, flex: 1, minWidth: 200 }}>{e.desc}</span>
            </div>
          ))}
        </div>

        {/* Webhook delivery headers */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Delivery Headers</div>
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, color: C.text }}>
            <div>Content-Type: application/json</div>
            <div>X-Webhook-Signature: &lt;HMAC-SHA256 hex digest&gt;</div>
            <div>X-Webhook-Event: project.created</div>
            <div>X-Webhook-Id: &lt;unique delivery id&gt;</div>
          </div>
        </div>

        {/* Signature verification */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Signature Verification</div>
        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: '0 0 8px' }}>
          Each webhook delivery includes an HMAC-SHA256 signature in the <InlineCode>X-Webhook-Signature</InlineCode> header.
          Always verify the signature before processing the payload to ensure it came from TubeForge.
        </p>
        <CodeExamples
          examples={{
            curl: `# Compute expected signature and compare:
echo -n '{"event":"project.created",...}' | \\
  openssl dgst -sha256 -hmac "whsec_your_webhook_secret"`,
            javascript: `import { createHmac } from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expected;
}

// Express / Next.js API route handler:
export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-webhook-signature');

  if (!verifyWebhook(rawBody, signature, process.env.WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  console.log(event.event, event.data);
  return new Response('OK', { status: 200 });
}`,
            python: `import hmac
import hashlib
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_webhook_secret"

@app.route("/webhooks/tubeforge", methods=["POST"])
def handle_webhook():
    payload = request.get_data(as_text=True)
    signature = request.headers.get("X-Webhook-Signature", "")

    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        abort(401, "Invalid signature")

    event = request.get_json()
    print(f"Event: {event['event']}, Data: {event['data']}")
    return "OK", 200`,
          }}
        />

        {/* Payload examples */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '20px 0 8px' }}>
          Payload: <Badge color={C.blue}>project.created</Badge>
        </div>
        <CodeBlock code={`{
  "event": "project.created",
  "timestamp": "2026-03-20T14:00:00.000Z",
  "data": {
    "id": "clx5678def",
    "title": "My New Project",
    "description": null,
    "status": "DRAFT",
    "tags": ["tutorial"],
    "createdAt": "2026-03-20T14:00:00.000Z"
  }
}`} />

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Payload: <Badge color={C.green}>video.completed</Badge>
        </div>
        <CodeBlock code={`{
  "event": "video.completed",
  "timestamp": "2026-03-20T15:30:00.000Z",
  "data": {
    "projectId": "clx5678def",
    "videoId": "vid_abc123",
    "title": "My New Project",
    "duration": 127,
    "resolution": "1080p",
    "fileSize": 52428800,
    "downloadUrl": "https://tubeforge.co/api/v1/videos/vid_abc123/download",
    "expiresAt": "2026-03-27T15:30:00.000Z"
  }
}`} />

        {/* ── SDKs & Libraries ────────────────────────────────────── */}
        <SectionTitle id="sdks">SDKs &amp; Libraries</SectionTitle>
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 10,
                background: `${C.orange}14`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Official SDKs</div>
              <div style={{ fontSize: 12, color: C.dim }}>Coming soon</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 16px' }}>
            We are building official client libraries to make integration even easier. Planned languages:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {[
              { name: 'Node.js / TypeScript', pkg: 'npm install @tubeforge/sdk', color: C.green },
              { name: 'Python', pkg: 'pip install tubeforge', color: C.blue },
              { name: 'Go', pkg: 'go get tubeforge.co/sdk', color: C.cyan },
            ].map((sdk) => (
              <div
                key={sdk.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '10px 14px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  minWidth: 180,
                  flex: '1 1 180px',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sdk.name}</span>
                <code style={{ fontSize: 11, color: sdk.color, fontFamily: 'monospace' }}>{sdk.pkg}</code>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: C.dim, margin: 0, lineHeight: 1.6 }}>
            Want early access to SDKs? Contact{' '}
            <a href="mailto:support@tubeforge.co" style={{ color: C.blue, textDecoration: 'none' }}>support@tubeforge.co</a>{' '}
            to join the beta program.
            In the meantime, the REST API works great with any HTTP client.
          </p>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div style={{
          marginTop: 48,
          padding: '20px 24px',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          fontSize: 13,
          color: C.sub,
          lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>Need Help?</div>
          <p style={{ margin: 0 }}>
            If you have questions about the API, contact us at{' '}
            <a href="mailto:support@tubeforge.co" style={{ color: C.blue, textDecoration: 'none' }}>support@tubeforge.co</a>.
            More endpoints (scenes, assets, thumbnails, video rendering) are on the roadmap.
          </p>
        </div>
      </div>
    </main>
  );
}
