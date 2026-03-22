"use client";

import { useState } from "react";

interface CounterField {
  id: string;
  label: string;
  placeholder: string;
  maxChars: number;
  optimalMin: number;
  optimalMax: number;
  tip: string;
  multiline: boolean;
}

const FIELDS: CounterField[] = [
  {
    id: "title",
    label: "Video Title",
    placeholder: "Enter your YouTube video title...",
    maxChars: 100,
    optimalMin: 40,
    optimalMax: 70,
    tip: "YouTube displays up to ~70 characters in search results. Keep titles between 40-70 characters for best CTR.",
    multiline: false,
  },
  {
    id: "description",
    label: "Video Description",
    placeholder: "Enter your YouTube video description...",
    maxChars: 5000,
    optimalMin: 200,
    optimalMax: 2000,
    tip: "YouTube shows the first 2-3 lines (~200 chars) above the fold. Include keywords in the first 200 characters. Aim for 200-2000 characters total.",
    multiline: true,
  },
  {
    id: "tags",
    label: "Tags",
    placeholder: "Enter your YouTube tags (comma-separated)...",
    maxChars: 500,
    optimalMin: 200,
    optimalMax: 450,
    tip: "YouTube allows up to 500 characters for tags total. Use a mix of broad and specific long-tail tags. Aim for 200-450 characters.",
    multiline: true,
  },
];

function getColor(current: number, optimalMin: number, optimalMax: number, max: number): string {
  if (current === 0) return "rgba(255,255,255,0.3)";
  if (current > max) return "#ff3b30";
  if (current > optimalMax) return "#ff9500";
  if (current >= optimalMin) return "#34c759";
  return "rgba(255,255,255,0.3)";
}

function getBarColor(current: number, optimalMin: number, optimalMax: number, max: number): string {
  if (current === 0) return "rgba(255,255,255,0.08)";
  if (current > max) return "#ff3b30";
  if (current > optimalMax) return "#ff9500";
  if (current >= optimalMin) return "#34c759";
  return "#6366f1";
}

function getStatusLabel(current: number, optimalMin: number, optimalMax: number, max: number): string {
  if (current === 0) return "Empty";
  if (current > max) return "Over limit";
  if (current > optimalMax) return "Long";
  if (current >= optimalMin) return "Optimal";
  return "Short";
}

export function CharacterCounterTool() {
  const [values, setValues] = useState<Record<string, string>>({
    title: "",
    description: "",
    tags: "",
  });

  function handleChange(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {FIELDS.map((field) => {
        const current = values[field.id]?.length ?? 0;
        const remaining = field.maxChars - current;
        const pct = Math.min((current / field.maxChars) * 100, 100);
        const color = getColor(current, field.optimalMin, field.optimalMax, field.maxChars);
        const barColor = getBarColor(current, field.optimalMin, field.optimalMax, field.maxChars);
        const status = getStatusLabel(current, field.optimalMin, field.optimalMax, field.maxChars);

        return (
          <div
            key={field.id}
            style={{
              background: "#0a0a0a",
              borderRadius: 18,
              padding: "28px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <label
                htmlFor={field.id}
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                {field.label}
              </label>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color,
                  padding: "2px 10px",
                  borderRadius: 6,
                  background: current === 0 ? "transparent" : `${color}11`,
                }}
              >
                {status}
              </span>
            </div>

            {field.multiline ? (
              <textarea
                id={field.id}
                value={values[field.id] ?? ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={field.id === "description" ? 6 : 3}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 17,
                  border: `1px solid ${current > field.maxChars ? "#ff3b30" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12,
                  outline: "none",
                  background: "#1a1a1a",
                  color: "#ffffff",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
              />
            ) : (
              <input
                id={field.id}
                type="text"
                value={values[field.id] ?? ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 17,
                  border: `1px solid ${current > field.maxChars ? "#ff3b30" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12,
                  outline: "none",
                  background: "#1a1a1a",
                  color: "#ffffff",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                }}
              />
            )}

            {/* Progress bar */}
            <div
              style={{
                marginTop: 12,
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: barColor,
                  borderRadius: 2,
                  transition: "width 0.2s ease, background 0.2s ease",
                }}
              />
            </div>

            {/* Counter */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                {current} / {field.maxChars} characters
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: remaining < 0 ? "#ff3b30" : "rgba(255,255,255,0.3)",
                }}
              >
                {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over limit`}
              </span>
            </div>

            {/* Tip */}
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                background: "rgba(0,113,227,0.04)",
                borderRadius: 10,
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.5,
              }}
            >
              {field.tip}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "16px 0",
          flexWrap: "wrap",
        }}
      >
        {[
          { color: "#6366f1", label: "Short" },
          { color: "#34c759", label: "Optimal" },
          { color: "#ff9500", label: "Long" },
          { color: "#ff3b30", label: "Over limit" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: item.color,
              }}
            />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
