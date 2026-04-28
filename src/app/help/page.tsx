"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpArticle } from "@/lib/help-articles";

type Category = HelpArticle["category"] | "all";

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let articles = HELP_ARTICLES;
    if (activeCategory !== "all") {
      articles = articles.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      articles = articles.filter(
        (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q),
      );
    }
    return articles;
  }, [search, activeCategory]);

  const categories: { key: Category; label: string; icon?: string }[] = [
    { key: "all", label: "All" },
    ...Object.entries(HELP_CATEGORIES).map(([key, val]) => ({
      key: key as HelpArticle["category"],
      label: val.label,
      icon: val.icon,
    })),
  ];

  const showPopular = !search.trim() && activeCategory === "all";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="size-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xs">
            TF
          </div>
          <span className="text-[17px] font-semibold text-foreground">TubeForge</span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-brand-500 hover:text-brand-400 no-underline transition-colors"
        >
          ← Home
        </Link>
      </header>

      <div className="text-center px-6 pt-14 pb-9">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight m-0">Help Center</h1>
        <p className="text-muted-foreground text-[17px] mt-3 max-w-md mx-auto leading-relaxed">
          Find answers to frequently asked questions or get in touch with us
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-6 pb-8">
        <div className="relative">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-[18px] top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 pl-[50px] py-4 bg-card border border-transparent rounded-3xl text-foreground text-base outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {showPopular && (
        <div className="mx-auto max-w-3xl px-6 pb-8">
          <h2 className="text-[17px] font-semibold mb-4 text-foreground">Popular Articles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {HELP_ARTICLES.slice(0, 5).map((article) => {
              const catInfo = HELP_CATEGORIES[article.category];
              return (
                <button
                  key={article.id}
                  onClick={() => {
                    setExpandedId(article.id);
                    document.getElementById("help-articles")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group flex flex-col gap-2 px-4 py-4 bg-card hover:bg-card/70 rounded-2xl text-left text-foreground transition-all hover:-translate-y-0.5"
                >
                  <span className="text-xl">{catInfo.icon}</span>
                  <span className="text-sm font-semibold leading-snug">{article.title}</span>
                  <span className="text-xs text-muted-foreground">{catInfo.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 pb-7 flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => {
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                active
                  ? "bg-brand-500 text-white"
                  : "bg-card hover:bg-card/70 text-muted-foreground"
              }`}
            >
              {cat.icon && <span className="text-sm">{cat.icon}</span>}
              {cat.label}
            </button>
          );
        })}
      </div>

      <div id="help-articles" className="mx-auto max-w-3xl px-6 pb-20">
        {(search.trim() || activeCategory !== "all") && filtered.length > 0 && (
          <p className="text-[13px] text-muted-foreground mb-4">
            {filtered.length === 1 ? "1 article found" : `${filtered.length} articles found`}
          </p>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <p className="text-xl font-semibold text-foreground">Nothing found</p>
            <p className="text-[15px] mt-2">Try changing your query or category</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((article) => {
              const expanded = expandedId === article.id;
              const catInfo = HELP_CATEGORIES[article.category];
              return (
                <div
                  key={article.id}
                  className={`rounded-xl overflow-hidden transition-colors border ${
                    expanded ? "bg-card border-border" : "bg-card/60 border-border/60"
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(expanded ? null : article.id)}
                    className="w-full px-5 py-4 bg-transparent border-0 cursor-pointer flex items-center gap-3.5 text-left text-foreground"
                  >
                    <span className="size-9 shrink-0 rounded-[10px] bg-background flex items-center justify-center text-lg">
                      {catInfo.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold">{article.title}</div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">
                        {catInfo.label}
                      </div>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`shrink-0 text-muted-foreground transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {expanded && (
                    <div className="px-5 pb-5 pl-[70px] text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line border-t border-border pt-4">
                      {article.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-14 text-center px-7 py-10 bg-card rounded-2xl">
          <p className="text-xl font-semibold m-0 text-foreground">Didn&apos;t find an answer?</p>
          <p className="text-muted-foreground text-[15px] mt-2">
            Get in touch with our support team
          </p>
          <Link
            href="/contact"
            className="inline-block mt-5 px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-[15px] font-semibold no-underline transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
