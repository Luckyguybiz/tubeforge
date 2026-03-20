'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import type { Theme } from '@/lib/types';

function CodeBlock({ code, C }: { code: string; C: Theme }) {
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

function SectionTitle({ children, C }: { children: React.ReactNode; C: Theme }) {
  return (
    <h2
      style={{
        fontSize: 20,
        fontWeight: 700,
        color: C.text,
        margin: '40px 0 12px',
        paddingBottom: 8,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {children}
    </h2>
  );
}

function Badge({ children, color, C }: { children: React.ReactNode; color: string; C: Theme }) {
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

function Param({ name, type, required, desc, C }: { name: string; type: string; required?: boolean; desc: string; C: Theme }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <code style={{ fontWeight: 700, color: C.text, fontSize: 13, minWidth: 100 }}>{name}</code>
      <span style={{ fontSize: 12, color: C.dim, fontFamily: 'monospace' }}>{type}</span>
      {required && <span style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: 0.5 }}>REQUIRED</span>}
      <span style={{ fontSize: 13, color: C.sub, flex: 1, minWidth: 200 }}>{desc}</span>
    </div>
  );
}

export default function ApiDocsPage() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tubeforge.co';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: '0 0 8px', letterSpacing: -0.5 }}>
          TubeForge API
        </h1>
        <p style={{ fontSize: 16, color: C.sub, margin: 0, lineHeight: 1.6 }}>
          Programmatic access to your TubeForge projects. Build integrations, automate workflows, and manage content at scale.
        </p>
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: `${C.purple}0a`,
          border: `1px solid ${C.purple}20`,
          borderRadius: 10,
          fontSize: 13,
          color: C.sub,
          lineHeight: 1.6,
        }}>
          API is available on the <strong style={{ color: C.purple }}>Studio</strong> plan.
          Generate API keys in <a href="/settings" style={{ color: C.blue, textDecoration: 'none', fontWeight: 600 }}>Settings</a>.
        </div>
      </div>

      {/* Authentication */}
      <SectionTitle C={C}>Authentication</SectionTitle>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 12px' }}>
        All API requests must include a Bearer token in the <code style={{ color: C.text, background: C.bg, padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>Authorization</code> header.
      </p>
      <CodeBlock C={C} code={`Authorization: Bearer tf_your_api_key_here`} />
      <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
        Generate API keys in your account <a href="/settings" style={{ color: C.blue, textDecoration: 'none' }}>Settings</a> page.
        Keys start with <code style={{ color: C.text, background: C.bg, padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>tf_</code> and are shown only once after generation.
      </p>

      {/* Base URL */}
      <SectionTitle C={C}>Base URL</SectionTitle>
      <CodeBlock C={C} code={`${baseUrl}/api/v1`} />

      {/* Rate Limits */}
      <SectionTitle C={C}>Rate Limits</SectionTitle>
      <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.7 }}>
        <p style={{ margin: '0 0 12px' }}>
          <strong style={{ color: C.text }}>60 requests per minute</strong> per API key. Rate limit headers are included in every response:
        </p>
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, color: C.text }}>
            <div>X-RateLimit-Limit: 60</div>
            <div>X-RateLimit-Remaining: 59</div>
            <div>X-RateLimit-Reset: 1711234567</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13 }}>
          When the limit is exceeded, the API returns <Badge color={C.accent} C={C}>429</Badge> with a <code style={{ background: C.bg, padding: '2px 6px', borderRadius: 4, fontSize: 12, color: C.text }}>Retry-After</code> header.
        </p>
      </div>

      {/* Endpoints */}
      <SectionTitle C={C}>Endpoints</SectionTitle>

      {/* GET /api/v1/projects */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Badge color={C.green} C={C}>GET</Badge>
          <code style={{ fontSize: 15, fontWeight: 700, color: C.text }}>/api/v1/projects</code>
        </div>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 16px', lineHeight: 1.6 }}>
          List your projects with pagination. Returns most recently updated first.
        </p>

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Query Parameters</div>
        <Param C={C} name="page" type="number" desc="Page number (default: 1)" />
        <Param C={C} name="limit" type="number" desc="Items per page (default: 20, max: 50)" />
        <Param C={C} name="status" type="string" desc="Filter by status: DRAFT, RENDERING, READY, PUBLISHED" />

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '20px 0 8px' }}>Example (curl)</div>
        <CodeBlock C={C} code={`curl -X GET "${baseUrl}/api/v1/projects?page=1&limit=10" \\
  -H "Authorization: Bearer tf_your_api_key"`} />

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Example (JavaScript)</div>
        <CodeBlock C={C} code={`const res = await fetch('${baseUrl}/api/v1/projects?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer tf_your_api_key',
  },
});
const data = await res.json();
console.log(data);`} />

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Response</div>
        <CodeBlock C={C} code={`{
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Badge color={C.blue} C={C}>POST</Badge>
          <code style={{ fontSize: 15, fontWeight: 700, color: C.text }}>/api/v1/projects</code>
        </div>
        <p style={{ fontSize: 14, color: C.sub, margin: '0 0 16px', lineHeight: 1.6 }}>
          Create a new project. Subject to your plan{"'"}s project limit.
        </p>

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Request Body (JSON)</div>
        <Param C={C} name="title" type="string" desc="Project title (max 100 chars, default: 'Untitled')" />
        <Param C={C} name="description" type="string" desc="Project description (max 5000 chars)" />
        <Param C={C} name="tags" type="string[]" desc="Tags array (max 30 items, each max 100 chars)" />

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '20px 0 8px' }}>Example (curl)</div>
        <CodeBlock C={C} code={`curl -X POST "${baseUrl}/api/v1/projects" \\
  -H "Authorization: Bearer tf_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My New Project", "tags": ["tutorial"]}'`} />

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Example (JavaScript)</div>
        <CodeBlock C={C} code={`const res = await fetch('${baseUrl}/api/v1/projects', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tf_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'My New Project',
    tags: ['tutorial'],
  }),
});
const data = await res.json();
console.log(data); // { data: { id, title, status, ... } }`} />

        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Response (201 Created)</div>
        <CodeBlock C={C} code={`{
  "data": {
    "id": "clx5678def",
    "title": "My New Project",
    "description": null,
    "status": "DRAFT",
    "tags": ["tutorial"],
    "createdAt": "2026-03-20T14:00:00.000Z",
    "updatedAt": "2026-03-20T14:00:00.000Z"
  }
}`} />
      </div>

      {/* Error Codes */}
      <SectionTitle C={C}>Error Codes</SectionTitle>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        {[
          { code: '400', desc: 'Bad Request - Invalid JSON body or parameters', color: C.orange },
          { code: '401', desc: 'Unauthorized - Missing or invalid API key', color: C.accent },
          { code: '403', desc: 'Forbidden - Plan limit reached or insufficient permissions', color: C.purple },
          { code: '404', desc: 'Not Found - Resource does not exist', color: C.dim },
          { code: '429', desc: 'Too Many Requests - Rate limit exceeded', color: C.orange },
          { code: '500', desc: 'Internal Server Error - Something went wrong on our end', color: C.accent },
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
            <Badge color={e.color} C={C}>{e.code}</Badge>
            <span style={{ fontSize: 13, color: C.sub }}>{e.desc}</span>
          </div>
        ))}
      </div>

      {/* Webhooks */}
      <SectionTitle C={C}>Webhooks</SectionTitle>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 12px' }}>
        Receive real-time notifications when events occur in your account. Configure webhooks in <a href="/settings" style={{ color: C.blue, textDecoration: 'none' }}>Settings</a> or via the tRPC API.
      </p>

      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Available Events</div>
      <div style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 20,
      }}>
        <Badge color={C.green} C={C}>video.completed</Badge>
        <Badge color={C.blue} C={C}>project.created</Badge>
      </div>

      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 12px' }}>
        Each webhook delivery includes an HMAC-SHA256 signature in the <code style={{ color: C.text, background: C.bg, padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>X-Webhook-Signature</code> header. Verify it using your webhook secret:
      </p>

      <CodeBlock C={C} code={`// Verify webhook signature (Node.js)
import { createHmac } from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expected;
}

// In your webhook handler:
const isValid = verifyWebhook(
  JSON.stringify(req.body),
  req.headers['x-webhook-signature'],
  'whsec_your_webhook_secret'
);`} />

      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Webhook Payload Example</div>
      <CodeBlock C={C} code={`{
  "event": "project.created",
  "timestamp": "2026-03-20T14:00:00.000Z",
  "data": {
    "id": "clx5678def",
    "title": "My New Project",
    "status": "DRAFT"
  }
}`} />

      {/* Footer */}
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
          More endpoints (scenes, assets, thumbnails) coming soon.
        </p>
      </div>
    </div>
  );
}
