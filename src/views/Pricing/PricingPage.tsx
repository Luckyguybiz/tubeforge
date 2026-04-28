"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { FaqAccordion } from "@/components/landing";

/* ------------------------------------------------------------------ */
/*  Plan data (feature keys reference pricing.feat.* i18n keys)        */
/* ------------------------------------------------------------------ */

interface PlanDef {
  name: string;
  priceMonthly: number;
  priceAnnual: number; // total per year (25% off)
  featureKeys: string[];
  popular: boolean;
  href: string;
  hrefAnnual: string;
}

const PLANS: PlanDef[] = [
  {
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    featureKeys: [
      "pricing.feat.3projects",
      "pricing.feat.5ai",
      "pricing.feat.basicEditor",
      "pricing.feat.thumbnails",
      "pricing.feat.seo",
      "pricing.feat.storage1gb",
    ],
    popular: false,
    href: "/register",
    hrefAnnual: "/register",
  },
  {
    name: "Pro",
    priceMonthly: 12,
    priceAnnual: 108, // $12*12*0.75
    featureKeys: [
      "pricing.feat.25projects",
      "pricing.feat.100ai",
      "pricing.feat.allAiTools",
      "pricing.feat.vpn",
      "pricing.feat.abTesting",
      "pricing.feat.storage50gb",
      "pricing.feat.prioritySupport",
    ],
    popular: true,
    href: "/billing?plan=PRO",
    hrefAnnual: "/billing?plan=PRO&interval=year",
  },
  {
    name: "Studio",
    priceMonthly: 30,
    priceAnnual: 270, // $30*12*0.75
    featureKeys: [
      "pricing.feat.allPro",
      "pricing.feat.unlimitedProjects",
      "pricing.feat.unlimitedAi",
      "pricing.feat.team10",
      "pricing.feat.api",
      "pricing.feat.storage500gb",
      "pricing.feat.dedicatedSupport",
    ],
    popular: false,
    href: "/billing?plan=STUDIO",
    hrefAnnual: "/billing?plan=STUDIO&interval=year",
  },
];

/* ------------------------------------------------------------------ */
/*  Feature comparison table data                                      */
/* ------------------------------------------------------------------ */

type CellValue = string | boolean;

interface CompareRow {
  labelKey: string;
  free: CellValue;
  pro: CellValue;
  studio: CellValue;
}

const COMPARE_ROWS: CompareRow[] = [
  { labelKey: "pricing.compare.projects", free: "3", pro: "25", studio: "\u221E" },
  { labelKey: "pricing.compare.aiGenerations", free: "3/mo", pro: "100/mo", studio: "∞" },
  { labelKey: "pricing.compare.storage", free: "500 MB", pro: "5 GB", studio: "50 GB" },
  { labelKey: "pricing.compare.thumbnails", free: "3/mo", pro: "100/mo", studio: "∞" },
  { labelKey: "pricing.compare.videoEditor", free: true, pro: true, studio: true },
  { labelKey: "pricing.compare.seoTools", free: true, pro: true, studio: true },
  { labelKey: "pricing.compare.abTesting", free: false, pro: true, studio: true },
  { labelKey: "pricing.compare.vpn", free: false, pro: true, studio: true },
  { labelKey: "pricing.compare.export", free: "720p", pro: "1080p", studio: "4K" },
  { labelKey: "pricing.compare.teamMembers", free: false, pro: false, studio: "10" },
  { labelKey: "pricing.compare.api", free: false, pro: false, studio: true },
  { labelKey: "pricing.compare.support", free: "Email", pro: "Priority", studio: "Dedicated" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CellContent({ value }: { value: CellValue }) {
  if (typeof value === "boolean") return value ? <CheckIcon /> : <CrossIcon />;
  return <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const t = useLocaleStore((s) => s.t);
  const [isAnnual, setIsAnnual] = useState(false);

  const faqItems = Array.from({ length: 7 }, (_, i) => ({
    q: t(`pricing.faq.q${i + 1}`),
    a: t(`pricing.faq.a${i + 1}`),
  }));

  return (
    <>
      {/* Hero */}
      <section style={{ padding: "120px 24px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: "0 0 16px",
              color: "#ffffff",
            }}
          >
            {t("pricing.title")}
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 4vw, 19px)",
              color: "rgba(255,255,255,0.5)",
              maxWidth: 480,
              margin: "0 auto 32px",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            {t("pricing.subtitle")}
          </p>

          {/* Monthly / Annual toggle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 50,
              padding: "5px 6px",
            }}
          >
            <button
              onClick={() => setIsAnnual(false)}
              style={{
                padding: "8px 24px",
                borderRadius: 50,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: !isAnnual ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
                color: !isAnnual ? "#fff" : "rgba(255,255,255,0.5)",
                boxShadow: !isAnnual ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
              }}
            >
              {t("pricing.monthly")}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              style={{
                padding: "8px 24px",
                borderRadius: 50,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: isAnnual ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
                color: isAnnual ? "#fff" : "rgba(255,255,255,0.5)",
                boxShadow: isAnnual ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {t("pricing.annual")}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 50,
                  background: isAnnual ? "rgba(255,255,255,0.2)" : "rgba(74,222,128,0.15)",
                  color: isAnnual ? "#fff" : "#4ade80",
                  border: isAnnual ? "none" : "1px solid rgba(74,222,128,0.2)",
                }}
              >
                {t("pricing.save25")}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "0 24px 80px" }}>
        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 1020, margin: "0 auto", boxSizing: "border-box" }}>
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const displayPrice = plan.priceMonthly === 0 ? "$0" : `$${price}`;
            const period = plan.priceMonthly === 0 ? "" : isAnnual ? t("pricing.perYear") : t("pricing.perMonth");
            const monthlyEquiv = isAnnual && plan.priceAnnual > 0 ? `$${Math.round((plan.priceAnnual / 12) * 100) / 100}` : null;
            const href = isAnnual ? plan.hrefAnnual : plan.href;

            return (
              <div
                key={plan.name}
                className="tf-pricing-card"
                style={{
                  background: plan.popular ? "rgba(99,102,241,0.06)" : "#0a0a0a",
                  borderRadius: 20,
                  padding: "36px 28px",
                  border: plan.popular ? "2px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  position: "relative",
                  transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: plan.popular ? "0 0 40px rgba(99,102,241,0.12)" : "0 4px 24px rgba(0,0,0,0.3)",
                  overflow: "hidden",
                }}
              >
                {/* Top gradient bar for popular */}
                {plan.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "linear-gradient(90deg, #6366f1, #a78bfa, #6366f1)",
                    }}
                  />
                )}
                {plan.popular && (
                  <span
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: 980,
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                    }}
                  >
                    {t("pricing.popular")}
                  </span>
                )}

                <div style={{ fontSize: 19, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
                  {t(plan.name === "Free" ? "pricing.freeDesc" : plan.name === "Pro" ? "pricing.proDesc" : "pricing.studioDesc")}
                </div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: monthlyEquiv ? 4 : 28 }}>
                  <span
                    style={{
                      fontSize: 44,
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {displayPrice}
                  </span>
                  {period && (
                    <span style={{ fontSize: 17, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                      {period}
                    </span>
                  )}
                </div>
                {monthlyEquiv && (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>
                    {t("pricing.billedAnnually").replace("{price}", monthlyEquiv)}
                  </div>
                )}

                {/* Features */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flex: 1,
                  }}
                >
                  {plan.featureKeys.map((key) => (
                    <li key={key} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#ffffff" }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={plan.popular ? "#818cf8" : "#4ade80"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0, marginTop: 2 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t(key)}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Link
                  href={href}
                  className={plan.popular ? "tf-cta-primary" : "tf-cta-secondary"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    padding: "12px 28px",
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    minHeight: 48,
                    ...(plan.popular
                      ? {
                          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                          color: "#fff",
                          border: "none",
                          boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                        }
                      : {
                          background: "transparent",
                          color: "#6366f1",
                          border: "1px solid rgba(99,102,241,0.4)",
                        }),
                  }}
                >
                  {plan.priceMonthly === 0 ? t("pricing.chooseFree") : t("pricing.choosePlan")}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Guarantee Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginTop: 48,
            padding: "20px 28px",
            borderRadius: 12,
            background: "rgba(99,102,241,0.04)",
            border: "1px solid rgba(99,102,241,0.12)",
            maxWidth: 420,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", marginBottom: 2 }}>
              {t("pricing.guarantee")}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
              {t("pricing.guaranteeDesc")}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section style={{ padding: "80px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 12px",
                color: "#ffffff",
              }}
            >
              {t("pricing.compareTitle")}
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>
              {t("pricing.compareSubtitle")}
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 480,
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, width: "34%" }} />
                  <th style={{ textAlign: "center", padding: "16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 700, width: "22%" }}>
                    Free
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "16px 12px",
                      borderBottom: "2px solid rgba(99,102,241,0.4)",
                      color: "#818cf8",
                      fontSize: 15,
                      fontWeight: 700,
                      width: "22%",
                      background: "rgba(99,102,241,0.04)",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    Pro
                  </th>
                  <th style={{ textAlign: "center", padding: "16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 700, width: "22%" }}>
                    Studio
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      {t(row.labelKey)}
                    </td>
                    <td style={{ padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                      <CellContent value={row.free} />
                    </td>
                    <td style={{ padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "center", background: "rgba(99,102,241,0.04)" }}>
                      <CellContent value={row.pro} />
                    </td>
                    <td style={{ padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                      <CellContent value={row.studio} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section style={{ padding: "80px 24px", background: "#111111" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 12px",
                color: "#ffffff",
              }}
            >
              {t("pricing.faqTitle")}
            </h2>
            <p style={{ fontSize: 19, color: "rgba(255,255,255,0.5)", maxWidth: 420, margin: "0 auto", lineHeight: 1.5, fontWeight: 400 }}>
              {t("pricing.faqSubtitle")}
            </p>
          </div>
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center", background: "#0a0a0a" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            {t("pricing.ctaTitle")}
          </h2>
          <p style={{ fontSize: 19, color: "rgba(255,255,255,0.5)", margin: "0 0 36px", lineHeight: 1.5 }}>
            {t("pricing.ctaSubtitle")}
          </p>
          <Link
            href="/register"
            className="tf-cta-primary pricing-cta-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              fontSize: 17,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 980,
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              minHeight: 48,
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
            }}
          >
            {t("pricing.ctaButton")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#111111", padding: "32px 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {"\u00A9"} 2026 TubeForge. All rights reserved.
        </div>
      </footer>

      <style>{`
        .tf-pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.4) !important;
        }
        .tf-cta-primary:hover {
          filter: brightness(1.15);
          transform: scale(1.02);
        }
        .tf-cta-secondary:hover {
          background: rgba(99,102,241,0.08) !important;
        }
        @media (max-width: 960px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .pricing-cta-btn {
            width: 100%;
          }
        }
        @media (max-width: 640px) {
          .tf-pricing-card {
            padding: 24px 18px !important;
          }
          section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
