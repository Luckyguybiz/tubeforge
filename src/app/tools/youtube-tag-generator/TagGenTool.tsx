"use client";

import { useState } from "react";
import Link from "next/link";

export function TagGenTool() {
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
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
    setHashtags([]);
    setLimitReached(false);

    try {
      const res = await fetch("/api/free-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tags", input: topic.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) setLimitReached(true);
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.result?.tags && Array.isArray(data.result.tags)) {
        const allTags: string[] = data.result.tags;
        // Separate hashtags from regular tags
        const ht = allTags.filter((t) => t.startsWith("#"));
        const regular = allTags.filter((t) => !t.startsWith("#"));

        // If no hashtags were returned, generate some from the regular tags
        if (ht.length === 0 && regular.length > 5) {
          const generated = regular.slice(0, 7).map((t) => `#${t.replace(/\s+/g, "")}`);
          setHashtags(generated);
          setTags(regular);
        } else {
          setTags(regular.length > 0 ? regular : allTags);
          setHashtags(ht);
        }
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
    const allContent = [...tags, ...hashtags].join(", ");
    navigator.clipboard.writeText(allContent).then(() => {
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

  const totalCount = tags.length + hashtags.length;

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
          placeholder="e.g., iPhone 16 Pro camera review"
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
          {loading ? "Generating..." : "Generate Tags & Hashtags"}
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
      {totalCount > 0 && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 600, color: "#ffffff", margin: 0 }}>
              Generated Tags ({totalCount})
            </h3>
            <button
              onClick={handleCopyAll}
              style={{
                padding: "8px 16px",
                background: copiedAll ? "#34c759" : "rgba(99,102,241,0.1)",
                color: copiedAll ? "#fff" : "#6366f1",
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

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                Tags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopyTag(tag, i)}
                    title="Click to copy"
                    style={{
                      padding: "8px 16px",
                      background: copiedIndex === i ? "#34c759" : "rgba(255,255,255,0.04)",
                      color: copiedIndex === i ? "#fff" : "#ffffff",
                      fontSize: 14,
                      fontWeight: 500,
                      border: "1px solid",
                      borderColor: copiedIndex === i ? "#34c759" : "rgba(255,255,255,0.06)",
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
            </div>
          )}

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                Hashtags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {hashtags.map((ht, i) => {
                  const idx = tags.length + i;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleCopyTag(ht, idx)}
                      title="Click to copy"
                      style={{
                        padding: "8px 16px",
                        background: copiedIndex === idx ? "#34c759" : "rgba(0,113,227,0.06)",
                        color: copiedIndex === idx ? "#fff" : "#6366f1",
                        fontSize: 14,
                        fontWeight: 600,
                        border: "1px solid",
                        borderColor: copiedIndex === idx ? "#34c759" : "rgba(0,113,227,0.15)",
                        borderRadius: 980,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {copiedIndex === idx ? "Copied!" : ht}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>
            Click any tag or hashtag to copy it individually.
          </p>
        </div>
      )}
    </div>
  );
}
