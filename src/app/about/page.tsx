import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about TubeForge, the AI-powered platform for YouTube creators. Our mission, team, and vision.",
  openGraph: {
    title: "About — TubeForge",
    description: "Learn about TubeForge, the AI-powered platform helping YouTube creators produce professional content.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "About TubeForge" }],
  },
  alternates: { canonical: "https://tubeforge.co/about" },
  twitter: {
    card: "summary_large_image",
    title: "About — TubeForge",
    description: "Learn about TubeForge, the AI-powered platform for YouTube creators.",
    images: ["/api/og"],
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-10 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-10"
        >
          <span className="text-lg leading-none">{"←"}</span>
          Back to Home
        </Link>

        <Card className="px-2 py-3 sm:px-6 sm:py-6">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              About TubeForge
            </CardTitle>
            <CardDescription className="text-sm">
              Our mission and story
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight">Our Mission</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                TubeForge is an AI-powered platform designed for YouTube creators.
                We help you generate, optimize, and publish video content faster
                than ever before.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Our tools leverage state-of-the-art artificial intelligence to
                assist with video generation, AI voiceovers, thumbnail creation,
                and SEO optimization — so you can focus on what matters most:
                creating content your audience loves.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight">Contact Us</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Have questions or feedback? Reach out to us at{" "}
                <a
                  href="mailto:support@tubeforge.co"
                  className="text-brand-500 underline-offset-4 hover:underline"
                >
                  support@tubeforge.co
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {"©"} {new Date().getFullYear()} TubeForge. All rights reserved.
        </p>
      </div>
    </main>
  );
}
