"use client";

import { useState } from "react";
import Link from "next/link";

export function TagGeneratorTool() {
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setTags([]);
    setLimitReached(false);

    try {
      const res = await fetch("/api/free-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tags", input: topic.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setLimitReached(true);
        }
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.result?.tags && Array.isArray(data.result.tags)) {
        setTags(data.result.tags);
      } else {
        setError("Unexpected response format. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyAll() {
    const allTags = tags.join(", ");
    navigator.clipboard.writeText(allTags).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }

  function handleCopyTag(tag: string, index: number) {
    navigator.clipboard.writeText(tag).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  }

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
          Video title or topic
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
          placeholder="e.g., iPhone 16 Pro camera review"
          maxLength={500}
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
          {loading ? "Generating..." : "Generate Tags"}
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

      {/* Results */}
      {tags.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1d1d1f", margin: 0 }}>
              Generated Tags ({tags.length})
            </h3>
            <button
              onClick={handleCopyAll}
              style={{
                padding: "8px 16px",
                background: copiedAll ? "#34c759" : "rgba(0,113,227,0.08)",
                color: copiedAll ? "#fff" : "#0071e3",
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              {copiedAll ? "Copied!" : "Copy All"}
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {tags.map((tag, i) => (
              <button
                key={i}
                onClick={() => handleCopyTag(tag, i)}
                title="Click to copy"
                style={{
                  padding: "8px 16px",
                  background: copiedIndex === i ? "#34c759" : "#f5f5f7",
                  color: copiedIndex === i ? "#fff" : "#1d1d1f",
                  fontSize: 14,
                  fontWeight: 500,
                  border: "1px solid",
                  borderColor: copiedIndex === i ? "#34c759" : "#e5e5ea",
                  borderRadius: 980,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {copiedIndex === i ? "Copied!" : tag}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#86868b", marginTop: 12 }}>
            Click any tag to copy it individually.
          </p>
        </div>
      )}
    </div>
  );
}
