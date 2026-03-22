"use client";

import { useState } from "react";
import Link from "next/link";

export function DescriptionGeneratorTool() {
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  async function handleGenerate() {
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    setDescription("");
    setLimitReached(false);

    try {
      const res = await fetch("/api/free-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "description",
          input: title.trim(),
          keywords: keywords.trim() || undefined,
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

      if (data.result?.description) {
        setDescription(data.result.description);
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
    navigator.clipboard.writeText(description).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          htmlFor="video-title"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: 8,
          }}
        >
          Video title
        </label>
        <input
          id="video-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., 10 Tips to Grow Your YouTube Channel Fast"
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
          htmlFor="keywords"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: 8,
            marginTop: 16,
          }}
        >
          Keywords <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>(optional)</span>
        </label>
        <input
          id="keywords"
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
          placeholder="e.g., YouTube growth, subscribers, SEO tips"
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
          disabled={loading || !title.trim()}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "14px 28px",
            background: loading || !title.trim() ? "rgba(255,255,255,0.08)" : "#6366f1",
            color: loading || !title.trim() ? "rgba(255,255,255,0.3)" : "#fff",
            fontSize: 17,
            fontWeight: 500,
            border: "none",
            borderRadius: 12,
            cursor: loading || !title.trim() ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            fontFamily: "inherit",
            minHeight: 48,
          }}
        >
          {loading ? "Generating..." : "Generate Description"}
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

      {/* Result */}
      {description && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 600, color: "#ffffff", margin: 0 }}>
              Generated Description
            </h3>
            <button
              onClick={handleCopy}
              style={{
                padding: "8px 16px",
                background: copied ? "#34c759" : "rgba(99,102,241,0.1)",
                color: copied ? "#fff" : "#6366f1",
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
              background: "#1a1a1a",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              whiteSpace: "pre-wrap",
              fontSize: 15,
              color: "#ffffff",
              lineHeight: 1.7,
              fontFamily: "inherit",
              maxHeight: 600,
              overflowY: "auto",
            }}
          >
            {description}
          </div>
        </div>
      )}
    </div>
  );
}
