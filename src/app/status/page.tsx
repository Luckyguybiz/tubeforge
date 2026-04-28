"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";

interface HealthData {
  status: "ok" | "degraded";
  version: string;
  db: "connected" | "disconnected";
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

type ServiceStatus = "operational" | "degraded" | "outage" | "loading";

interface SystemService {
  name: string;
  description: string;
  status: ServiceStatus;
  detail: string;
}

const STATUS_CONFIG = {
  operational: { label: "Operational", color: "#2dd4a0" },
  degraded: { label: "Degraded", color: "#f59e0b" },
  outage: { label: "Outage", color: "#ef4444" },
  loading: { label: "Checking...", color: "#94a3b8" },
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
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
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
      name: "Application",
      description: "TubeForge platform core",
      status: error ? "outage" : health ? "operational" : "loading",
      detail: health ? `v${health.version} | uptime ${formatUptime(health.uptime)}` : "",
    },
    {
      name: "Database",
      description: "PostgreSQL / Prisma",
      status: error
        ? "outage"
        : health
          ? health.db === "connected"
            ? "operational"
            : "outage"
          : "loading",
      detail: health?.dbLatencyMs != null ? `Latency ${health.dbLatencyMs}ms` : "",
    },
    {
      name: "AI Generation",
      description: "OpenAI, Anthropic, Runway",
      status: error ? "outage" : health ? "operational" : "loading",
      detail: "Via external APIs",
    },
    {
      name: "Payments",
      description: "Stripe Payments",
      status: error ? "outage" : health ? "operational" : "loading",
      detail: "Via Stripe",
    },
    {
      name: "CDN / Media",
      description: "File upload and storage",
      status: error ? "outage" : health ? "operational" : "loading",
      detail: "",
    },
  ];

  const overallOk = !error && health?.status === "ok";
  const isLoading = !health && !error;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="size-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-extrabold text-xs">
            TF
          </div>
          <span className="text-lg font-bold text-foreground">TubeForge</span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground no-underline"
        >
          ← Back to Home
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12 pb-16">
        {/* Overall status */}
        <Card
          className={`text-center px-6 py-8 mb-8 border ${
            isLoading
              ? "border-slate-400/20 bg-slate-400/5"
              : overallOk
                ? "border-emerald-400/20 bg-emerald-400/5"
                : "border-red-500/20 bg-red-500/5"
          }`}
        >
          <div
            className="mx-auto mb-4 size-12 rounded-full flex items-center justify-center text-white"
            style={{
              background: isLoading ? "#94a3b8" : overallOk ? "#2dd4a0" : "#ef4444",
            }}
          >
            {overallOk ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight m-0">
            {isLoading
              ? "Checking systems..."
              : overallOk
                ? "All Systems Operational"
                : "Issues Detected"}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {lastChecked
              ? `Last checked: ${lastChecked.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Checking..."}
            {" | Auto-refreshes every 30s"}
          </p>
        </Card>

        {/* Services list */}
        <h2 className="text-lg font-bold mb-4">Services</h2>
        <div className="flex flex-col gap-2">
          {services.map((service) => {
            const cfg = STATUS_CONFIG[service.status];
            return (
              <Card
                key={service.name}
                className="flex flex-row items-center justify-between px-5 py-4 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-foreground">
                    {service.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {service.description}
                    {service.detail && (
                      <span className="ml-2 opacity-70">— {service.detail}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="size-2 rounded-full"
                    style={{
                      background: cfg.color,
                      boxShadow: `0 0 8px ${cfg.color}40`,
                    }}
                  />
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Memory / system stats */}
        {health && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4">System</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Uptime", value: formatUptime(health.uptime) },
                { label: "Memory (RSS)", value: formatBytes(health.memory.rss) },
                { label: "Heap Used", value: formatBytes(health.memory.heapUsed) },
                {
                  label: "DB Latency",
                  value: health.dbLatencyMs != null ? `${health.dbLatencyMs}ms` : "N/A",
                },
              ].map((stat) => (
                <Card key={stat.label} className="px-5 py-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                  <div className="text-xl font-extrabold text-foreground">{stat.value}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <Card className="mt-8 px-6 py-5 text-center">
          <p className="text-[13px] text-muted-foreground m-0">
            Monitoring runs 24/7. If you experience issues, please contact{" "}
            <Link href="/contact" className="text-brand-500 hover:underline underline-offset-4">
              support
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
