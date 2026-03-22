"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS_MONTHLY = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Get started with the platform",
    features: [
      "3 downloads per day",
      "Basic AI editor",
      "Thumbnail generation",
      "SEO optimization",
      "1 GB storage",
    ],
    popular: false,
    href: "/register",
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For active creators",
    features: [
      "Unlimited downloads",
      "All AI tools",
      "VPN for YouTube",
      "Unlimited thumbnails",
      "A/B thumbnail testing",
      "50 GB storage",
      "Priority support",
    ],
    popular: true,
    href: "/billing?plan=PRO",
  },
  {
    name: "Studio",
    price: "$30",
    period: "/mo",
    desc: "For teams and agencies",
    features: [
      "All Pro features",
      "Team up to 10 members",
      "API access",
      "500 GB storage",
      "Branded templates",
      "Dedicated support",
      "Multi-channel management",
    ],
    popular: false,
    href: "/billing?plan=STUDIO",
  },
];

const PLANS_ANNUAL = [
  {
    name: "Free",
    price: "$0",
    period: "",
    monthly: "",
    desc: "Get started with the platform",
    features: PLANS_MONTHLY[0].features,
    popular: false,
    href: "/register",
  },
  {
    name: "Pro",
    price: "$115",
    period: "/yr",
    monthly: "$9.58/mo",
    desc: "For active creators",
    features: PLANS_MONTHLY[1].features,
    popular: true,
    href: "/billing?plan=PRO&interval=year",
  },
  {
    name: "Studio",
    price: "$288",
    period: "/yr",
    monthly: "$24/mo",
    desc: "For teams and agencies",
    features: PLANS_MONTHLY[2].features,
    popular: false,
    href: "/billing?plan=STUDIO&interval=year",
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const plans = isAnnual ? PLANS_ANNUAL : PLANS_MONTHLY;

  return (
    <section id="pricing" style={{ padding: "120px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="tf-reveal" style={{ textAlign: "center", marginBottom: 72 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#818cf8",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            Pricing
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: "0 0 16px",
            }}
          >
            Simple, Transparent Pricing
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 480,
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            Start free, scale when you&apos;re ready
          </p>

          {/* Toggle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 50,
              padding: "6px 8px",
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
                background: !isAnnual
                  ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                  : "transparent",
                color: !isAnnual ? "#fff" : "rgba(255,255,255,0.5)",
                boxShadow: !isAnnual
                  ? "0 2px 12px rgba(99,102,241,0.3)"
                  : "none",
              }}
            >
              Monthly
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
                background: isAnnual
                  ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                  : "transparent",
                color: isAnnual ? "#fff" : "rgba(255,255,255,0.5)",
                boxShadow: isAnnual
                  ? "0 2px 12px rgba(99,102,241,0.3)"
                  : "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Annual
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 50,
                  background: isAnnual
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(74,222,128,0.15)",
                  color: isAnnual ? "#fff" : "#4ade80",
                  border: isAnnual
                    ? "none"
                    : "1px solid rgba(74,222,128,0.2)",
                }}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            maxWidth: 1060,
            margin: "0 auto",
          }}
        >
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className="tf-reveal tf-pricing-card"
              style={{
                background: plan.popular
                  ? "rgba(99,102,241,0.06)"
                  : "rgba(255,255,255,0.02)",
                borderRadius: 24,
                padding: "40px 36px",
                border: plan.popular
                  ? "1px solid rgba(99,102,241,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                position: "relative",
                transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                overflow: "hidden",
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background:
                      "linear-gradient(90deg, #6366f1, #a78bfa, #6366f1)",
                  }}
                />
              )}
              {plan.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 50,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Popular
                </span>
              )}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#ffffff",
                  marginBottom: 4,
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 24,
                }}
              >
                {plan.desc}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  marginBottom: isAnnual && plan.name !== "Free" ? 4 : 32,
                }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    style={{
                      fontSize: 16,
                      color: "rgba(255,255,255,0.35)",
                      fontWeight: 500,
                    }}
                  >
                    {plan.period}
                  </span>
                )}
              </div>
              {isAnnual && plan.name !== "Free" && (
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 32,
                  }}
                >
                  billed annually ({plan.name === 'Pro' ? '$9.58/mo' : '$24/mo'})
                </div>
              )}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {plan.features.map((feature, j) => (
                  <li
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={plan.popular ? "#818cf8" : "#4ade80"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 24px",
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                  background: plan.popular
                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                    : "rgba(255,255,255,0.06)",
                  color: plan.popular ? "#fff" : "rgba(255,255,255,0.7)",
                  border: plan.popular
                    ? "none"
                    : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: plan.popular
                    ? "0 4px 20px rgba(99,102,241,0.3)"
                    : "none",
                }}
              >
                {plan.name === "Free" ? "Start Free" : "Get Started"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
