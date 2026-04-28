import Link from "next/link";
import { CHANGELOG, type ChangelogEntry } from "@/lib/changelog";

const TYPE_CONFIG: Record<ChangelogEntry["type"], { label: string; color: string }> = {
  feature: { label: "New", color: "#2dd4a0" },
  fix: { label: "Fix", color: "#ef4444" },
  improvement: { label: "Improvement", color: "#3a7bfd" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChangelogPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="size-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-extrabold text-xs">
            TF
          </div>
          <span className="text-lg font-bold text-foreground">TubeForge</span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground no-underline"
        >
          ← Back to Home
        </Link>
      </header>

      <div className="text-center px-6 pt-12 pb-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight m-0">Changelog</h1>
        <p className="text-muted-foreground text-base mt-2">
          Latest updates and improvements to TubeForge
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8 pb-16">
        <div className="relative">
          <div
            className="absolute top-2 bottom-2 w-0.5 bg-border rounded-sm"
            style={{ left: 15 }}
            aria-hidden
          />
          <div className="flex flex-col">
            {CHANGELOG.map((entry, i) => {
              const cfg = TYPE_CONFIG[entry.type];
              return (
                <div
                  key={`${entry.date}-${i}`}
                  className="flex gap-6 pb-8 relative"
                >
                  <div
                    className="size-8 rounded-full bg-card flex items-center justify-center flex-shrink-0 z-10"
                    style={{ border: `2px solid ${cfg.color}` }}
                  >
                    <div
                      className="size-2.5 rounded-full"
                      style={{ background: cfg.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{ color: cfg.color, background: `${cfg.color}15` }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[13px] text-muted-foreground">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-bold mt-1 mb-1.5 text-foreground">
                      {entry.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground m-0">
                      {entry.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
