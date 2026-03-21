"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("landing-hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show the bar when hero is NOT intersecting (scrolled past)
        setVisible(!entry!.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        padding: "12px 16px",
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(99,102,241,0.2)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
        display: "none", // hidden by default (desktop)
      }}
      className="sticky-mobile-cta"
    >
      <Link
        href="/register"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "14px 24px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          textDecoration: "none",
          border: "none",
          boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8.5 1L3 9H7.5L7 15L13 7H8.5L8.5 1Z" fill="currentColor" />
        </svg>
        Начать бесплатно
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </div>
  );
}
