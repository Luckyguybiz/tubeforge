"use client";

import { useState, useEffect, useRef } from "react";

const CPM_PRESETS = [
  { label: "Low", value: 1.5, desc: "General/lifestyle content" },
  { label: "Mid", value: 4.0, desc: "Tech, education, gaming" },
  { label: "High", value: 10.0, desc: "Finance, business, B2B" },
] as const;

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatViews(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return String(value);
}

function AnimatedNumber({ value, prefix = "$" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    const duration = 600;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevRef.current = to;
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}{display.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function MoneyCalcTool() {
  const [dailyViews, setDailyViews] = useState(10000);
  const [cpmPreset, setCpmPreset] = useState(1);
  const [customCpm, setCustomCpm] = useState<number | null>(null);

  const cpm = customCpm !== null ? customCpm : CPM_PRESETS[cpmPreset].value;
  // YouTube takes 45% cut
  const creatorShare = 0.55;
  const dailyEarnings = (dailyViews * cpm * creatorShare) / 1000;
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyEarnings = dailyEarnings * 365;

  return (
    <div>
      {/* Input Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 18,
          padding: "28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          border: "1px solid #e5e5ea",
        }}
      >
        {/* Daily views slider */}
        <label
          htmlFor="daily-views"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#1d1d1f",
            marginBottom: 8,
          }}
        >
          Daily views
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
          <input
            id="daily-views"
            type="range"
            min={100}
            max={1000000}
            step={100}
            value={dailyViews}
            onChange={(e) => setDailyViews(Number(e.target.value))}
            style={{
              flex: 1,
              height: 6,
              appearance: "none",
              background: `linear-gradient(to right, #0071e3 ${((dailyViews - 100) / (1000000 - 100)) * 100}%, #e5e5ea ${((dailyViews - 100) / (1000000 - 100)) * 100}%)`,
              borderRadius: 3,
              outline: "none",
              cursor: "pointer",
            }}
          />
          <input
            type="number"
            min={0}
            max={10000000}
            value={dailyViews}
            onChange={(e) => setDailyViews(Math.max(0, Number(e.target.value)))}
            style={{
              width: 110,
              padding: "10px 12px",
              fontSize: 15,
              fontWeight: 600,
              border: "1px solid #d2d2d7",
              borderRadius: 10,
              outline: "none",
              background: "#fafafa",
              color: "#1d1d1f",
              fontFamily: "inherit",
              textAlign: "right",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ fontSize: 13, color: "#86868b", marginBottom: 20 }}>
          {formatViews(dailyViews)} views per day
        </div>

        {/* CPM preset */}
        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#1d1d1f",
            marginBottom: 8,
          }}
        >
          CPM range
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {CPM_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setCpmPreset(i);
                setCustomCpm(null);
              }}
              style={{
                flex: 1,
                padding: "12px 8px",
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid",
                borderColor: customCpm === null && cpmPreset === i ? "#0071e3" : "#d2d2d7",
                borderRadius: 12,
                background: customCpm === null && cpmPreset === i ? "rgba(0,113,227,0.08)" : "#fafafa",
                color: customCpm === null && cpmPreset === i ? "#0071e3" : "#1d1d1f",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                textAlign: "center",
              }}
            >
              <div>{preset.label}</div>
              <div style={{ fontSize: 17, marginTop: 2 }}>${preset.value.toFixed(2)}</div>
              <div style={{ fontSize: 11, fontWeight: 400, color: "#86868b", marginTop: 2 }}>
                {preset.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Custom CPM */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#86868b" }}>or custom:</span>
          <div style={{ position: "relative", width: 100 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 15,
                color: "#86868b",
                pointerEvents: "none",
              }}
            >
              $
            </span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={customCpm !== null ? customCpm : ""}
              onChange={(e) => {
                const val = e.target.value;
                setCustomCpm(val === "" ? null : Math.max(0, Number(val)));
              }}
              placeholder="CPM"
              style={{
                width: "100%",
                padding: "8px 12px 8px 24px",
                fontSize: 15,
                border: "1px solid #d2d2d7",
                borderRadius: 8,
                outline: "none",
                background: "#fafafa",
                color: "#1d1d1f",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {[
            { label: "Daily", value: dailyEarnings },
            { label: "Monthly", value: monthlyEarnings },
            { label: "Yearly", value: yearlyEarnings },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#ffffff",
                borderRadius: 18,
                padding: "24px 16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                border: "1px solid #e5e5ea",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#86868b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: "clamp(20px, 4vw, 28px)",
                  fontWeight: 600,
                  color: "#34c759",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                <AnimatedNumber value={item.value} />
              </div>
            </div>
          ))}
        </div>

        {/* Breakdown info */}
        <div
          style={{
            marginTop: 16,
            background: "#f5f5f7",
            borderRadius: 14,
            padding: "20px",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f", marginBottom: 12 }}>
            Calculation breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Daily views", value: formatViews(dailyViews) },
              { label: "CPM (cost per 1,000 views)", value: `$${cpm.toFixed(2)}` },
              { label: "YouTube cut (45%)", value: `-$${((dailyViews * cpm * 0.45) / 1000).toFixed(2)}/day` },
              { label: "Creator share (55%)", value: formatCurrency(dailyEarnings) + "/day" },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                <span style={{ color: "#86868b" }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: "#1d1d1f" }}>{row.value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#86868b", marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
            Estimates are approximate. Actual earnings depend on niche, audience location, ad types, engagement, and YouTube Premium revenue.
          </p>
        </div>
      </div>
    </div>
  );
}
