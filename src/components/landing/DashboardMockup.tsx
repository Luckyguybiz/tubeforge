"use client";

export function DashboardMockup() {
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "64px auto 0",
        perspective: "1200px",
      }}
    >
      <div
        style={{
          transform: "rotateX(4deg)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0 25px 80px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
          background: "#111118",
          transition: "transform 0.5s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Browser title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "6px 40px",
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                fontFamily: "monospace",
              }}
            >
              app.tubeforge.co/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div style={{ display: "flex", minHeight: 340 }}>
          {/* Sidebar */}
          <div
            style={{
              width: 200,
              padding: "20px 12px",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
            className="mockup-sidebar"
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#818cf8",
                padding: "8px 12px",
                marginBottom: 12,
              }}
            >
              TubeForge
            </div>
            {["Dashboard", "Videos", "Thumbnails", "AI Tools", "Analytics", "VPN", "Settings"].map(
              (item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: i === 0 ? "#fff" : "rgba(255,255,255,0.4)",
                    background: i === 0 ? "rgba(99,102,241,0.15)" : "transparent",
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  {item}
                </div>
              )
            )}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: 24 }}>
            {/* Top bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                Dashboard
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    color: "#fff",
                  }}
                >
                  + New Video
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                { label: "Total Views", value: "124.5K", change: "+12.3%" },
                { label: "Subscribers", value: "8,432", change: "+5.7%" },
                { label: "Watch Time", value: "2,841h", change: "+8.1%" },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 16,
                height: 120,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                Views Over Time
              </div>
              <svg
                viewBox="0 0 500 60"
                style={{ width: "100%", height: 60 }}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,45 C50,40 80,35 120,30 C160,25 200,38 250,22 C300,8 340,15 380,10 C420,5 460,12 500,8 L500,60 L0,60 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0,45 C50,40 80,35 120,30 C160,25 200,38 250,22 C300,8 340,15 380,10 C420,5 460,12 500,8"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .mockup-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
