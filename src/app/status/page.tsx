'use client';

import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { useEffect, useState, useCallback } from 'react';

interface HealthData {
  status: 'ok' | 'degraded';
  version: string;
  db: 'connected' | 'disconnected';
  dbLatencyMs: number | null;
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  timestamp: string;
}

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'loading';

interface SystemService {
  name: string;
  description: string;
  status: ServiceStatus;
  detail: string;
}

const STATUS_CONFIG = {
  operational: { label: 'Operational', color: '#2dd4a0' },
  degraded: { label: 'Degraded', color: '#f59e0b' },
  outage: { label: 'Outage', color: '#ef4444' },
  loading: { label: 'Checking...', color: '#94a3b8' },
} as const;

function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function StatusPage() {
  const C = useThemeStore((s) => s.theme);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = (await res.json()) as HealthData;
      setHealth(data);
      setError(false);
    } catch {
      setError(true);
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    void fetchHealth();
    const interval = setInterval(() => void fetchHealth(), 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const services: SystemService[] = [
    {
      name: 'Application',
      description: 'TubeForge platform core',
      status: error ? 'outage' : health ? 'operational' : 'loading',
      detail: health ? `v${health.version} | uptime ${formatUptime(health.uptime)}` : '',
    },
    {
      name: 'Database',
      description: 'PostgreSQL / Prisma',
      status: error
        ? 'outage'
        : health
          ? health.db === 'connected'
            ? 'operational'
            : 'outage'
          : 'loading',
      detail: health?.dbLatencyMs != null ? `Latency ${health.dbLatencyMs}ms` : '',
    },
    {
      name: 'AI Generation',
      description: 'OpenAI, Anthropic, Runway',
      status: error ? 'outage' : health ? 'operational' : 'loading',
      detail: 'Via external APIs',
    },
    {
      name: 'Payments',
      description: 'Stripe Payments',
      status: error ? 'outage' : health ? 'operational' : 'loading',
      detail: 'Via Stripe',
    },
    {
      name: 'CDN / Media',
      description: 'File upload and storage',
      status: error ? 'outage' : health ? 'operational' : 'loading',
      detail: '',
    },
  ];

  const overallOk = !error && health?.status === 'ok';
  const isLoading = !health && !error;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            TF
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>TubeForge</span>
        </Link>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: C.sub,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          &larr; Back to Home
        </Link>
      </header>

      <div className="tf-status-container" style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 64px' }}>
        {/* Overall status */}
        <div
          style={{
            textAlign: 'center',
            padding: '32px 24px',
            background: isLoading
              ? 'rgba(148,163,184,0.08)'
              : overallOk
                ? 'rgba(45,212,160,0.08)'
                : 'rgba(239,68,68,0.08)',
            border: `1px solid ${
              isLoading
                ? 'rgba(148,163,184,0.2)'
                : overallOk
                  ? 'rgba(45,212,160,0.2)'
                  : 'rgba(239,68,68,0.2)'
            }`,
            borderRadius: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: isLoading ? '#94a3b8' : overallOk ? '#2dd4a0' : '#ef4444',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {overallOk ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {isLoading ? 'Checking systems...' : overallOk ? 'All Systems Operational' : 'Issues Detected'}
          </h1>
          <p className="tf-status-refresh" style={{ color: C.sub, fontSize: 14, marginTop: 8 }}>
            {lastChecked
              ? `Last checked: ${lastChecked.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Checking...'}
            {' | Auto-refreshes every 30s'}
          </p>
        </div>

        {/* Services list */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Services</h2>
        <div className="tf-status-grid" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map((service) => {
            const cfg = STATUS_CONFIG[service.status];
            return (
              <div
                key={service.name}
                className="tf-status-service"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{service.name}</div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                    {service.description}
                    {service.detail && (
                      <span style={{ marginLeft: 8, opacity: 0.7 }}>
                        — {service.detail}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: cfg.color,
                      boxShadow: `0 0 8px ${cfg.color}40`,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Memory / system stats */}
        {health && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>System</h2>
            <div
              className="tf-status-stats"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
              }}
            >
              {[
                { label: 'Uptime', value: formatUptime(health.uptime) },
                { label: 'Memory (RSS)', value: formatBytes(health.memory.rss) },
                { label: 'Heap Used', value: formatBytes(health.memory.heapUsed) },
                { label: 'DB Latency', value: health.dbLatencyMs != null ? `${health.dbLatencyMs}ms` : 'N/A' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: '16px 20px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 12, color: C.dim, marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div
          className="tf-status-footer"
          style={{
            marginTop: 32,
            padding: '20px 24px',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: C.dim, margin: 0 }}>
            Monitoring runs 24/7. If you experience issues, please contact{' '}
            <Link href="/contact" style={{ color: C.accent, textDecoration: 'none' }}>
              support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
