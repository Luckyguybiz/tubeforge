"use client";

import { useState } from "react";
import Link from "next/link";

const STYLE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "creative", label: "Creative & Fun" },
  { value: "minimalist", label: "Minimalist" },
  { value: "brandable", label: "Brandable" },
  { value: "personal", label: "Personal Name-based" },
];

export function ChannelNameGeneratorTool() {
  const [niche, setNiche] = useState("");
  const [style, setStyle] = useState("professional");
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  async function handleGenerate() {
    if (!niche.trim()) return;
    setLoading(true);
    setError("");
    setNames([]);
    setLimitReached(false);

    try {
      const res = await fetch("/api/free-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "channel-name",
          input: niche.trim(),
          keywords: style,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setLimitReached(true);
        }
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.result?.names && Array.isArray(data.result.names)) {
        setNames(data.result.names);
      } else {
        setError("Unexpected response format. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(name: string, index: number) {
    navigator.clipboard.writeText(name).then(() => {
      setCopied(index);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div>
      {/* Input */}
      <div
        style={{
          background: "#0a0a0a",
          borderRadius: 18,
          padding: "28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <label
          htmlFor="niche"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: 8,
          }}
        >
          Niche or topic
        </label>
        <input
          id="niche"
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g., tech reviews, cooking, personal finance, gaming"
          maxLength={200}
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: 17,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            outline: "none",
            background: "#1a1a1a",
            color: "#ffffff",
            fontFamily: "inherit",
            transition: "border-color 0.2s ease",
            boxSizing: "border-box",
          }}
        />

        <label
          htmlFor="style"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: 8,
            marginTop: 16,
          }}
        >
          Name style
        </label>
        <select
          id="style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: 17,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            outline: "none",
            background: "#1a1a1a",
            color: "#ffffff",
            fontFamily: "inherit",
            transition: "border-color 0.2s ease",
            boxSizing: "border-box",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 16px center",
          }}
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={loading || !niche.trim()}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "14px 28px",
            background: loading || !niche.trim() ? "rgba(255,255,255,0.08)" : "#6366f1",
            color: loading || !niche.trim() ? "rgba(255,255,255,0.3)" : "#fff",
            fontSize: 17,
            fontWeight: 500,
            border: "none",
            borderRadius: 12,
            cursor: loading || !niche.trim() ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            fontFamily: "inherit",
            minHeight: 48,
          }}
        >
          {loading ? "Generating..." : "Generate Channel Names"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "14px 20px",
            background: limitReached ? "rgba(0,113,227,0.06)" : "rgba(255,59,48,0.06)",
            borderRadius: 12,
            fontSize: 15,
            color: limitReached ? "#6366f1" : "#ff3b30",
            lineHeight: 1.5,
          }}
        >
          {error}
          {limitReached && (
            <div style={{ marginTop: 8 }}>
              <Link
                href="/register"
                style={{
                  color: "#6366f1",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Sign up for unlimited generations
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {names.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#ffffff",
              marginBottom: 16,
            }}
          >
            Channel Name Ideas
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }} className="channel-names-grid">
            {names.map((name, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 16px",
                  background: "#1a1a1a",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    color: "#ffffff",
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {name}
                </span>
                <button
                  onClick={() => handleCopy(name, i)}
                  style={{
                    flexShrink: 0,
                    padding: "6px 14px",
                    background: copied === i ? "#34c759" : "rgba(99,102,241,0.1)",
                    color: copied === i ? "#fff" : "#6366f1",
                    fontSize: 13,
                    fontWeight: 500,
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied === i ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
          <style>{`
            @media (max-width: 640px) {
              .channel-names-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
