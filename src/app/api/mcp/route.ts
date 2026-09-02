import { NextResponse } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { authenticateApiRequest } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { createTubeForgeMcpServer, MCP_SERVER_NAME, MCP_SERVER_VERSION } from '@/server/mcp/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const log = createLogger('mcp');

/** Requests per minute per API key. Bulk tools make several YouTube calls each. */
const RATE_LIMIT_PER_MINUTE = 120;

/**
 * POST /api/mcp — TubeForge MCP endpoint (Streamable HTTP, stateless).
 *
 * Auth: `Authorization: Bearer tf_…` or `X-Forge-Key: tf_…` — the same API
 * keys as the Publishing API (Settings → Integrations). A fresh McpServer
 * is created per request and bound to that key; no session state is kept
 * between requests, so the endpoint scales horizontally and works behind
 * any proxy.
 *
 * Connect from Claude Code:
 *   claude mcp add --transport http tubeforge https://tubeforge.co/api/mcp \
 *     --header "Authorization: Bearer tf_…"
 */
export async function POST(req: Request) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { success, reset } = await rateLimit({ identifier: `mcp:${auth.apiKeyId}`, limit: RATE_LIMIT_PER_MINUTE, window: 60 });
  if (!success) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Rate limit exceeded — max 120 MCP requests per minute per API key' }, id: null },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))) } },
    );
  }

  const origin = new URL(req.url).origin;
  const server = createTubeForgeMcpServer({ auth, origin });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const res = await transport.handleRequest(req);
    return res;
  } catch (e) {
    log.error('MCP request failed', { apiKeyId: auth.apiKeyId, error: (e as Error).message });
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null },
      { status: 500 },
    );
  } finally {
    // JSON-response mode has finished writing by the time handleRequest resolves.
    void transport.close().catch(() => {});
  }
}

/**
 * GET is used by clients to open a server-initiated SSE stream. This server
 * is stateless and never pushes notifications, so advertise that plainly.
 * Unauthenticated GETs get a small discovery document instead of a 401 so
 * humans pasting the URL into a browser see what it is.
 */
export async function GET(req: Request) {
  const accept = req.headers.get('accept') ?? '';
  if (accept.includes('text/event-stream')) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Method Not Allowed: this MCP server is stateless and does not offer a standalone SSE stream' }, id: null },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }
  return NextResponse.json({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
    transport: 'streamable-http',
    endpoint: '/api/mcp',
    auth: 'Authorization: Bearer tf_<api-key> (create one at /settings#integrations)',
    docs: '/docs/mcp',
  });
}

export async function DELETE() {
  return NextResponse.json(
    { jsonrpc: '2.0', error: { code: -32000, message: 'Method Not Allowed: stateless server has no sessions to delete' }, id: null },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
