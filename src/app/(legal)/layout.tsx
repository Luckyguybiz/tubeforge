"use client";

import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";

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
            <svg width="20" height="14" viewBox="0 0 24 17" fill="none" aria-hidden="true">
              <path d="M23.5 2.7c-.3-1-1.1-1.8-2.1-2.1C19.6 0 12 0 12 0S4.4 0 2.6.6C1.6.9.8 1.7.5 2.7 0 4.5 0 8.3 0 8.3s0 3.8.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.4 16.5 12 16.5 12 16.5s7.6 0 9.4-.5c1-.3 1.8-1.1 2.1-2.1.5-1.8.5-5.6.5-5.6s0-3.8-.5-5.6z" fill="#FF0000"/>
              <path d="M9.6 11.9V4.7l6.3 3.6-6.3 3.6z" fill="#fff"/>
            </svg>
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
