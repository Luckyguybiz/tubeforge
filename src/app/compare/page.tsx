import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const COMPARISONS = [
  { slug: "tubeforge-vs-vidiq", name: "vidIQ", tagline: "YouTube SEO & analytics" },
  { slug: "tubeforge-vs-tubebuddy", name: "TubeBuddy", tagline: "YouTube channel management" },
  { slug: "tubeforge-vs-pictory", name: "Pictory", tagline: "AI video production" },
  { slug: "tubeforge-vs-invideo", name: "InVideo", tagline: "AI video creation" },
  { slug: "tubeforge-vs-capcut", name: "CapCut", tagline: "Video editing" },
  { slug: "tubeforge-vs-synthesia", name: "Synthesia", tagline: "AI avatar videos" },
  { slug: "tubeforge-vs-fliki", name: "Fliki", tagline: "Text-to-video" },
  { slug: "tubeforge-vs-veed", name: "VEED", tagline: "Online video editing" },
  { slug: "tubeforge-vs-opus-clip", name: "Opus Clip", tagline: "AI video clipping" },
  { slug: "tubeforge-vs-descript", name: "Descript", tagline: "Text-based editing" },
];

export const metadata: Metadata = {
  title: "TubeForge Comparisons — See How We Stack Up",
  description:
    "Compare TubeForge with popular video creation and YouTube optimization tools. Feature tables, pricing, pros and cons for each competitor.",
  openGraph: {
    title: "TubeForge Comparisons — See How We Stack Up",
    description:
      "Compare TubeForge with popular video creation and YouTube optimization tools. Feature tables, pricing, pros and cons for each competitor.",
    type: "website",
    locale: "en_US",
    url: "https://tubeforge.co/compare",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "TubeForge Comparisons" }],
  },
  alternates: { canonical: "https://tubeforge.co/compare" },
  twitter: {
    card: "summary_large_image",
    title: "TubeForge Comparisons — See How We Stack Up",
    description:
      "Compare TubeForge with popular video creation and YouTube optimization tools.",
    images: ["/api/og"],
  },
};

export default function ComparePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "TubeForge Comparisons",
    description: metadata.description,
    url: "https://tubeforge.co/compare",
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-6 py-10 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-10"
        >
          <span className="text-lg leading-none">{"←"}</span>
          Home
        </Link>

        <Card className="px-6 sm:px-10 py-12 mb-10">
          <CardHeader className="px-0 pt-0 pb-0">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              <span className="text-brand-500">TubeForge</span> vs Competitors
            </CardTitle>
            <CardDescription className="text-base leading-relaxed mt-4 max-w-2xl">
              See how TubeForge compares to popular video creation and YouTube optimization
              tools. Feature-by-feature breakdowns, pricing, and honest pros &amp; cons.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 mb-12 sm:grid-cols-2 md:grid-cols-3">
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group flex flex-col gap-2 p-6 rounded-2xl bg-card border border-border no-underline transition-colors hover:border-brand-500/50"
            >
              <div className="text-[17px] font-bold text-foreground">
                <span className="text-brand-500">TubeForge</span>
                <span className="text-muted-foreground/60 font-medium"> vs </span>
                {c.name}
              </div>
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                {c.tagline}
              </div>
              <div className="mt-auto pt-3 text-[13px] font-semibold text-brand-500">
                View comparison {"→"}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center py-6">
          <h2 className="text-2xl font-extrabold tracking-tight mb-4">
            Try TubeForge for Free
          </h2>
          <p className="text-muted-foreground text-[15px] mb-6 leading-relaxed">
            Start creating videos with AI today. Free, no credit card required.
          </p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 h-12 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium text-base px-8 transition-colors shadow-[0_4px_16px_rgba(99,102,241,0.4)]">
            Try TubeForge for Free
          </Link>
        </div>
      </div>
    </main>
  );
}
