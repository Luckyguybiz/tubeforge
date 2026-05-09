"use client";

import { useThemeStore } from "@/stores/useThemeStore";
import { Skeleton } from "@/components/ui/Skeleton";

/** Tools index skeleton: header + grid of tool cards */
export default function ToolsLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 20px" }}>
      <div>
        <Skeleton height={28} width={140} />
        <Skeleton height={14} width={280} style={{ marginTop: 8 }} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 132,
            }}
          >
            <Skeleton height={36} width={36} rounded />
            <Skeleton height={14} width={`${70 - i * 3}%`} />
            <Skeleton height={10} width={`${50 - i * 2}%`} />
          </div>
        ))}
      </div>
    </div>
  );
}
