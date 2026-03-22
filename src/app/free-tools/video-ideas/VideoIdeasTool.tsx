"use client";

import { useState } from "react";
import Link from "next/link";

const NICHE_OPTIONS = [
  { value: "tech", label: "Technology & Gadgets" },
  { value: "gaming", label: "Gaming" },
  { value: "finance", label: "Personal Finance & Investing" },
  { value: "fitness", label: "Fitness & Health" },
  { value: "cooking", label: "Cooking & Food" },
  { value: "travel", label: "Travel & Adventure" },
  { value: "beauty", label: "Beauty & Fashion" },
  { value: "education", label: "Education & Learning" },
  { value: "business", label: "Business & Entrepreneurship" },
  { value: "music", label: "Music & Arts" },
  { value: "comedy", label: "Comedy & Entertainment" },
  { value: "science", label: "Science & Nature" },
  { value: "diy", label: "DIY & Crafts" },
  { value: "automotive", label: "Automotive & Cars" },
  { value: "parenting", label: "Parenting & Family" },
  { value: "real-estate", label: "Real Estate" },
  { value: "photography", label: "Photography & Film" },
  { value: "productivity", label: "Productivity & Self-Improvement" },
];

interface VideoIdeas {
  trending: string[];
  evergreen: string[];
  shorts: string[];
  series: string[];
}

const CATEGORY_META: Record<keyof VideoIdeas, { label: string; color: string; bg: string }> = {
  trending: { label: "Trending", color: "#ff3b30", bg: "rgba(255,59,48,0.06)" },
  evergreen: { label: "Evergreen", color: "#34c759", bg: "rgba(52,199,89,0.06)" },
  shorts: { label: "Shorts Ideas", color: "#ff9500", bg: "rgba(255,149,0,0.06)" },
  series: { label: "Series Concepts", color: "#5856d6", bg: "rgba(88,86,214,0.06)" },
};

export function VideoIdeasTool() {
  const [niche, setNiche] = useState("tech");
  const [ideas, setIdeas] = useState<VideoIdeas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setIdeas(null);
    setLimitReached(false);

    try {
      const res = await fetch("/api/free-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "video-ideas",
          input: NICHE_OPTIONS.find((n) => n.value === niche)?.label ?? niche,
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

      if (data.result?.trending || data.result?.evergreen || data.result?.shorts || data.result?.series) {
        setIdeas({
          trending: data.result.trending ?? [],
          evergreen: data.result.evergreen ?? [],
          shorts: data.result.shorts ?? [],
          series: data.result.series ?? [],
        });
      } else {
        setError("Unexpected response format. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(idea: string) {
    navigator.clipboard.writeText(idea).then(() => {
      setCopied(idea);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleCopyAll() {
    if (!ideas) return;
    const all = [
      ...ideas.trending.map((i) => `[Trending] ${i}`),
      ...ideas.evergreen.map((i) => `[Evergreen] ${i}`),
      ...ideas.shorts.map((i) => `[Short] ${i}`),
      ...ideas.series.map((i) => `[Series] ${i}`),
    ].join("\n");
    navigator.clipboard.writeText(all).then(() => {
      setCopied("__all__");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const totalIdeas = ideas
    ? ideas.trending.length + ideas.evergreen.length + ideas.shorts.length + ideas.series.length
    : 0;

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
          htmlFor="niche"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#1d1d1f",
            marginBottom: 8,
          }}
        >
          Choose your niche
        </label>
        <select
          id="niche"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
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
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 16px center",
          }}
        >
          {NICHE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "14px 28px",
            background: loading ? "#d2d2d7" : "#0071e3",
            color: loading ? "#86868b" : "#fff",
            fontSize: 17,
            fontWeight: 500,
            border: "none",
            borderRadius: 12,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            fontFamily: "inherit",
            minHeight: 48,
          }}
        >
          {loading ? "Generating ideas..." : "Generate Video Ideas"}
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
      {ideas && (
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
              {totalIdeas} Video Ideas
            </h3>
            <button
              onClick={handleCopyAll}
              style={{
                padding: "8px 16px",
                background: copied === "__all__" ? "#34c759" : "rgba(0,113,227,0.08)",
                color: copied === "__all__" ? "#fff" : "#0071e3",
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              {copied === "__all__" ? "Copied!" : "Copy All"}
            </button>
          </div>

          {(Object.keys(CATEGORY_META) as (keyof VideoIdeas)[]).map((category) => {
            const items = ideas[category];
            if (items.length === 0) return null;
            const meta = CATEGORY_META[category];

            return (
              <div key={category} style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 8,
                    background: meta.bg,
                    color: meta.color,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  {meta.label} ({items.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((idea, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "12px 16px",
                        background: "#fafafa",
                        borderRadius: 10,
                        border: "1px solid #e5e5ea",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ fontSize: 15, color: "#1d1d1f", lineHeight: 1.5, flex: 1 }}>
                        {idea}
                      </span>
                      <button
                        onClick={() => handleCopy(idea)}
                        style={{
                          flexShrink: 0,
                          padding: "4px 12px",
                          background: copied === idea ? "#34c759" : "rgba(0,113,227,0.08)",
                          color: copied === idea ? "#fff" : "#0071e3",
                          fontSize: 12,
                          fontWeight: 500,
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontFamily: "inherit",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {copied === idea ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
