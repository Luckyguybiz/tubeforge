'use client';

import { useState, useCallback } from 'react';

/* ── Colors (dark-only, matching the server page) ─────────────────── */
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
};

interface EndpointOption {
  method: string;
  path: string;
  label: string;
  hasBody: boolean;
  defaultBody?: string;
  defaultParams?: string;
}

const ENDPOINTS: EndpointOption[] = [
  {
    method: 'GET',
    path: '/api/v1/projects',
    label: 'List Projects',
    hasBody: false,
    defaultParams: '?page=1&limit=10',
  },
  {
    method: 'POST',
    path: '/api/v1/projects',
    label: 'Create Project',
    hasBody: true,
    defaultBody: JSON.stringify({ title: 'My New Project', tags: ['tutorial'] }, null, 2),
  },
];

export function ApiPlayground() {
  const [apiKey, setApiKey] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [body, setBody] = useState(ENDPOINTS[0]!.defaultBody ?? '');
  const [params, setParams] = useState(ENDPOINTS[0]!.defaultParams ?? '');
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoint = ENDPOINTS[selectedIdx]!;

  const handleEndpointChange = useCallback(
    (idx: number) => {
      const ep = ENDPOINTS[idx]!;
      setSelectedIdx(idx);
      setBody(ep.defaultBody ?? '');
      setParams(ep.defaultParams ?? '');
      setResponse(null);
      setStatus(null);
    },
    [],
  );

  const handleSend = useCallback(async () => {
    if (!apiKey.trim()) {
      setResponse('Error: Please enter your API key above.');
      setStatus(null);
      return;
    }

    setLoading(true);
    setResponse(null);
    setStatus(null);

    try {
      const url = `${window.location.origin}${endpoint.path}${endpoint.hasBody ? '' : params}`;
      const opts: RequestInit = {
        method: endpoint.method,
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          ...(endpoint.hasBody ? { 'Content-Type': 'application/json' } : {}),
        },
      };
      if (endpoint.hasBody && body.trim()) {
        opts.body = body.trim();
      }

      const res = await fetch(url, opts);
      const text = await res.text();
      setStatus(res.status);

      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setResponse(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [apiKey, endpoint, body, params]);

  const methodColors: Record<string, string> = {
    GET: C.green,
    POST: C.blue,
    PUT: C.orange,
    DELETE: C.accent,
  };

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '24px',
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${C.purple}18`,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.purple}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
          Try it
        </span>
        <span style={{ fontSize: 12, color: C.dim }}>
          Test endpoints directly from your browser
        </span>
      </div>

      {/* API Key input */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: C.sub,
            marginBottom: 6,
            letterSpacing: 0.3,
          }}
        >
          API KEY
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="tf_your_api_key_here"
          style={{
            width: '100%',
            padding: '10px 14px',
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.text,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
          Generate a key in{' '}
          <a href="/settings" style={{ color: C.blue, textDecoration: 'none' }}>
            Settings
          </a>
          . Your key is never stored or sent to third parties.
        </div>
      </div>

      {/* Endpoint selector */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: C.sub,
            marginBottom: 6,
            letterSpacing: 0.3,
          }}
        >
          ENDPOINT
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ENDPOINTS.map((ep, i) => (
            <button
              key={`${ep.method}-${ep.path}`}
              onClick={() => handleEndpointChange(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background:
                  i === selectedIdx ? `${C.purple}18` : C.surface,
                border: `1px solid ${i === selectedIdx ? C.purple + '40' : C.border}`,
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .15s',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: methodColors[ep.method] ?? C.text,
                }}
              >
                {ep.method}
              </span>
              <span style={{ fontSize: 13, color: C.text }}>{ep.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Query params for GET */}
      {!endpoint.hasBody && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: C.sub,
              marginBottom: 6,
              letterSpacing: 0.3,
            }}
          >
            QUERY PARAMS
          </label>
          <input
            type="text"
            value={params}
            onChange={(e) => setParams(e.target.value)}
            placeholder="?page=1&limit=10"
            style={{
              width: '100%',
              padding: '10px 14px',
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Request body for POST */}
      {endpoint.hasBody && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: C.sub,
              marginBottom: 6,
              letterSpacing: 0.3,
            }}
          >
            REQUEST BODY (JSON)
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 24px',
          background: loading ? C.dim : C.purple,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          marginBottom: response !== null ? 16 : 0,
          transition: 'background .15s',
        }}
      >
        {loading ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
        {loading ? 'Sending...' : 'Send Request'}
      </button>

      {/* Response display */}
      {response !== null && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.sub,
                letterSpacing: 0.3,
              }}
            >
              RESPONSE
            </span>
            {status !== null && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  background:
                    status < 300
                      ? `${C.green}18`
                      : status < 500
                        ? `${C.orange}18`
                        : `${C.accent}18`,
                  color:
                    status < 300
                      ? C.green
                      : status < 500
                        ? C.orange
                        : C.accent,
                }}
              >
                {status}
              </span>
            )}
          </div>
          <pre
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: '16px 20px',
              fontSize: 12,
              lineHeight: 1.7,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: C.text,
              overflow: 'auto',
              whiteSpace: 'pre',
              maxHeight: 400,
              margin: 0,
            }}
          >
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
