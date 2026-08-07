"use client";

import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { YouTubeMark } from "@/components/YouTubeMark";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = useLocaleStore((s) => s.t);

  return (
    <main role="main" className="min-h-dvh bg-background text-foreground">
      <div className="tf-legal-content mx-auto max-w-2xl px-6 pt-12 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-medium text-brand-500 transition-colors hover:text-brand-400 mb-12"
        >
          <span aria-hidden>{"←"}</span>
          {t("legal.backToHome")}
        </Link>
        <article>{children}</article>
        <div className="mt-12 flex flex-col items-center gap-3">
          <a
            href="https://www.youtube.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <YouTubeMark height={24} />
            <span>Powered by YouTube</span>
          </a>
          <p className="text-center text-xs text-muted-foreground">
            {"©"} {new Date().getFullYear()} TubeForge. {t("legal.copyright")}
          </p>
        </div>
      </div>
    </main>
  );
}
