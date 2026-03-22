"use client";

export function AnalyzerMockup() {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: "48px auto 0",
        perspective: "1000px",
      }}
    >
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0 20px 60px rgba(99,102,241,0.12), 0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)",
          background: "#111118",
        }}
      >
        {/* Browser bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                padding: "4px 32px",
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                fontFamily: "monospace",
              }}
            >
              app.tubeforge.co/tools/analyzer
            </div>
          </div>
        </div>

        {/* Analyzer content */}
        <div style={{ padding: 24 }}>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              YouTube Video Analyzer
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Paste a video URL to get AI-powered insights
            </div>
          </div>

          {/* URL input */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(99,102,241,0.3)",
                background: "rgba(99,102,241,0.05)",
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "monospace",
              }}
            >
              https://youtube.com/watch?v=dQw4w9WgXcQ
            </div>
            <div
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Analyze
            </div>
          </div>

          {/* Results grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="analyzer-results-grid">
            {/* SEO Score */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                SEO Score
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: "3px solid #4ade80",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#4ade80",
                  }}
                >
                  87
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>Good</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    3 improvements found
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                Suggested Tags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["tutorial", "youtube tips", "growth", "seo", "2026"].map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      fontSize: 11,
                      color: "#a5b4fc",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Title suggestions */}
            <div
              style={{
                gridColumn: "1 / -1",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                AI Title Suggestions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "10 YouTube SEO Secrets That Actually Work in 2026",
                  "How I Grew My Channel to 100K Subscribers (Step by Step)",
                ].map((title, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: i === 0 ? "rgba(99,102,241,0.08)" : "transparent",
                      border: i === 0 ? "1px solid rgba(99,102,241,0.15)" : "1px solid transparent",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    </svg>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .analyzer-results-grid { grid-template-columns: 1fr !important; }
          .analyzer-results-grid > div:last-child { grid-column: 1 / -1 !important; }
        }
      `}</style>
    </div>
  );
}
