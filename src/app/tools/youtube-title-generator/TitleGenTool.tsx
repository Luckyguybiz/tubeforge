"use client";

import { useState } from "react";
import Link from "next/link";

const STYLES = [
  { value: "educational", label: "Educational" },
  { value: "entertainment", label: "Entertainment" },
  { value: "tutorial", label: "Tutorial" },
  { value: "listicle", label: "Listicle" },
] as const;

export function TitleGenTool() {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<string>("educational");
  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setTitles([]);
    setLimitReached(false);

    try {
      const res = await fetch("/api/free-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "title",
          input: `${topic.trim()} (style: ${style})`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) setLimitReached(true);
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.result?.titles && Array.isArray(data.result.titles)) {
        setTitles(data.result.titles);
      } else {
        setError("Unexpected response format. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(title: string, index: number) {
    navigator.clipboard.writeText(title).then(() => {
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
          htmlFor="topic"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: 8,
          }}
        >
          Video topic or keyword
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleGenerate();
          }}
          placeholder="e.g., how to start a YouTube channel in 2026"
          maxLength={500}
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
          Title style
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              style={{
                padding: "10px 20px",
                fontSize: 15,
                fontWeight: 500,
                border: "1px solid",
                borderColor: style === s.value ? "#6366f1" : "rgba(255,255,255,0.08)",
                borderRadius: 980,
                background: style === s.value ? "rgba(99,102,241,0.1)" : "#1a1a1a",
                color: style === s.value ? "#6366f1" : "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "14px 28px",
            background: loading || !topic.trim() ? "rgba(255,255,255,0.08)" : "#6366f1",
            color: loading || !topic.trim() ? "rgba(255,255,255,0.3)" : "#fff",
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
          {loading ? "Generating..." : "Generate Titles"}
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
      {titles.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#ffffff",
              marginBottom: 16,
            }}
          >
            Generated Titles
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {titles.map((title, i) => (
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
                  {title}
                </span>
                <button
                  onClick={() => handleCopy(title, i)}
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
        </div>
      )}
    </div>
  );
}
