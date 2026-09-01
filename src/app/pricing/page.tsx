import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { LandingNav } from "@/components/landing";

const PricingPageClient = dynamic(() => import("@/views/Pricing/PricingPage"));

/* -- SEO Metadata ------------------------------------------------- */

export const metadata: Metadata = {
  title: "TubeForge Pricing — Free, Pro & Studio Plans",
  description:
    "Choose the right TubeForge plan for your YouTube channel. Free plan with core features, Pro for active creators, Studio for teams. 14-day money-back guarantee.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "TubeForge Pricing — Free, Pro & Studio Plans",
    description:
      "Simple, transparent pricing for YouTube creators. Start free, upgrade when ready.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/pricing",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "TubeForge Pricing" }],
  },
  alternates: { canonical: "https://tubeforge.co/pricing" },
  twitter: {
    card: "summary_large_image",
    title: "TubeForge Pricing — Free, Pro & Studio Plans",
    description: "Simple, transparent pricing for YouTube creators.",
    images: ["/api/og"],
  },
};

/* -- JSON-LD ------------------------------------------------------ */

const PRICING_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "TubeForge Pricing",
  description: "Pricing plans for TubeForge — AI Studio for YouTube Creators",
  url: "https://tubeforge.co/pricing",
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "TubeForge",
    applicationCategory: "MultimediaApplication",
    featureList: "7 AI Video Models, AI Thumbnails, Image-to-Video, SEO Metadata, YouTube Upload, Team Collaboration",
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", description: "50 AI generations/month, 3 projects, 500MB storage" },
      { "@type": "Offer", name: "Pro", price: "12", priceCurrency: "USD", billingIncrement: 1, unitCode: "MON", description: "500 AI generations/month, 25 projects, 5GB storage" },
      { "@type": "Offer", name: "Studio", price: "30", priceCurrency: "USD", billingIncrement: 1, unitCode: "MON", description: "2000 AI generations/month, unlimited projects, 50GB, team up to 10" },
    ],
  },
};

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tubeforge.co" },
    { "@type": "ListItem", position: 2, name: "Pricing" },
  ],
};

/* -- Page --------------------------------------------------------- */

export default function PricingPage() {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        color: "var(--fg-primary)",
        minHeight: "100vh",
        fontFamily:
          "var(--font-sans), -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />

      <LandingNav />
      <PricingPageClient />
    </div>
  );
}
