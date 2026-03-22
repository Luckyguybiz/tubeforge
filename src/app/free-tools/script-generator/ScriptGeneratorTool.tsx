"use client";

import { useState } from "react";
import Link from "next/link";

const FORMAT_OPTIONS = [
  { value: "tutorial", label: "Tutorial / How-To" },
  { value: "review", label: "Product Review" },
  { value: "vlog", label: "Vlog" },
  { value: "listicle", label: "Listicle (Top 10, etc.)" },
];

const DURATION_OPTIONS = [
  { value: "5min", label: "Short (5 minutes)" },
  { value: "10min", label: "Medium (10 minutes)" },
  { value: "15min", label: "Long (15 minutes)" },
];

export function ScriptGeneratorTool() {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("tutorial");
  const [duration, setDuration] = useState("10min");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setScript("");
    setLimitReached(false);

    try {
      const res = await fetch("/api/free-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "script",
          input: topic.trim(),
          keywords: `${format},${duration}`,
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

      if (data.result?.script) {
        setScript(data.result.script);
      } else {
        setError("Unexpected response format. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    fontSize: 17,
    border: "1px solid #d2d2d7",
    borderRadius: 12,
    outline: "none",
    background: "#fafafa",
    color: "#1d1d1f",
    fontFamily: "inherit",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
  };

  return (
    <div>
      {/* Input */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 18,
          padding: "28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          border: "1px solid #e5e5ea",
        }}
      >
        <label
          htmlFor="topic"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#1d1d1f",
            marginBottom: 8,
          }}
        >
          Video topic
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., How to start investing with $100"
          maxLength={300}
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: 17,
            border: "1px solid #d2d2d7",
            borderRadius: 12,
            outline: "none",
            background: "#fafafa",
            color: "#1d1d1f",
            fontFamily: "inherit",
            transition: "border-color 0.2s ease",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }} className="script-selects-grid">
          <div>
            <label
              htmlFor="format"
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#1d1d1f",
                marginBottom: 8,
              }}
            >
              Format
            </label>
            <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} style={selectStyle}>
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="duration"
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#1d1d1f",
                marginBottom: 8,
              }}
            >
              Duration
            </label>
            <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} style={selectStyle}>
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "14px 28px",
            background: loading || !topic.trim() ? "#d2d2d7" : "#0071e3",
            color: loading || !topic.trim() ? "#86868b" : "#fff",
            fontSize: 17,
            fontWeight: 500,
            border: "none",
            borderRadius: 12,
            cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            fontFamily: "inherit",
            minHeight: 48,
          }}
        >
          {loading ? "Writing script..." : "Generate Script"}
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
            color: limitReached ? "#0071e3" : "#ff3b30",
            lineHeight: 1.5,
          }}
        >
          {error}
          {limitReached && (
            <div style={{ marginTop: 8 }}>
              <Link
                href="/register"
                style={{
                  color: "#0071e3",
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

      {/* Result */}
      {script && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1d1d1f", margin: 0 }}>
              Generated Script
            </h3>
            <button
              onClick={handleCopy}
              style={{
                padding: "8px 16px",
                background: copied ? "#34c759" : "rgba(0,113,227,0.08)",
                color: copied ? "#fff" : "#0071e3",
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              {copied ? "Copied!" : "Copy All"}
            </button>
          </div>
          <div
            style={{
              padding: "20px",
              background: "#fafafa",
              borderRadius: 12,
              border: "1px solid #e5e5ea",
              whiteSpace: "pre-wrap",
              fontSize: 15,
              color: "#1d1d1f",
              lineHeight: 1.7,
              fontFamily: "inherit",
              maxHeight: 700,
              overflowY: "auto",
            }}
          >
            {script}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .script-selects-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
