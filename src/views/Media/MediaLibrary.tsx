"use client";

import { useState, useCallback, useRef } from "react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";
import {
  Upload,
  Search,
  X,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Trash2,
  Plus,
  Library,
  Loader2,
  ExternalLink,
} from "lucide-react";

/* ── Translate-with-fallback ───────────────────────────── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

type TabId = "my" | "stock";
type FilterType = "all" | "image" | "video" | "audio";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fileIcon(type: string) {
  if (type === "video") return Video;
  if (type === "audio") return Music;
  if (type === "image") return ImageIcon;
  return FileText;
}

/* ════════════════════════════════════════════════════════════════════ */

export function MediaLibrary() {
  const t = useLocaleStore((s) => s.t);
  const planInfo = usePlanLimits();

  const [tab, setTab] = useState<TabId>("my");
  const [search, setSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [stockQuery, setStockQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assets = trpc.media.list.useQuery(
    { search: search || undefined, type: filterType, page, limit: 30 },
    { enabled: tab === "my" },
  );

  const storage = trpc.media.storageStats.useQuery(undefined, {
    enabled: tab === "my",
  });

  const stockResults = trpc.stock.searchPhotos.useQuery(
    { query: stockQuery, page: stockPage, perPage: 20 },
    { enabled: tab === "stock" && stockQuery.length > 0 },
  );

  const createAsset = trpc.asset.create.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "media.uploadSuccess", "Uploaded"));
      assets.refetch();
      storage.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAsset = trpc.asset.delete.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "media.deleteSuccess", "Deleted"));
      assets.refetch();
      storage.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          toast.error(data.error || tx(t, "media.uploadError", "Upload failed"));
          return;
        }
        createAsset.mutate({
          url: data.url,
          filename: file.name,
          type: file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
              ? "video"
              : "image",
          size: file.size,
        });
      } catch {
        toast.error(tx(t, "media.uploadError", "Upload failed"));
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [createAsset, t],
  );

  const handleStockSearch = useCallback(() => {
    if (stockSearch.trim()) {
      setStockQuery(stockSearch.trim());
      setStockPage(1);
    }
  }, [stockSearch]);

  const handleAddStockToProject = useCallback(
    (photoUrl: string, photographer: string) => {
      toast.success(`${tx(t, "media.stockAdded", "Added")} (${photographer})`);
      void photoUrl;
    },
    [t],
  );

  const storagePercent = storage.data
    ? Math.min(
        100,
        Math.round((storage.data.usedBytes / storage.data.totalBytes) * 100),
      )
    : 0;
  const storageColor =
    storagePercent > 90
      ? "from-rose-500 to-red-500"
      : storagePercent > 70
        ? "from-amber-500 to-orange-500"
        : "from-brand-500 to-violet-500";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/20">
            <Library className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {tx(t, "media.title", "Media Library")}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {tx(
                t,
                "media.subtitle",
                "All your uploads, plus 4M+ free stock photos & videos.",
              )}
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={createAsset.isPending}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-4 text-[13px] font-bold text-white shadow-md shadow-brand-500/20 transition-transform",
            createAsset.isPending ? "cursor-wait opacity-60" : "hover:scale-[1.02]",
          )}
        >
          {createAsset.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {createAsset.isPending
            ? tx(t, "media.uploading", "Uploading…")
            : tx(t, "media.upload", "Upload")}
        </button>
      </header>

      {/* ── Storage card ─────────────────────────────── */}
      {storage.data && tab === "my" && (
        <section className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <HardDrive className="size-4" />
              </span>
              <div>
                <div className="text-[13px] font-bold text-foreground">
                  <span className="font-mono">{formatBytes(storage.data.usedBytes)}</span>{" "}
                  <span className="text-muted-foreground">
                    of {formatBytes(storage.data.totalBytes)} used
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  <span className="font-mono">{storage.data.fileCount}</span>{" "}
                  {tx(t, "media.files", "files")}
                </div>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-mono text-[12px] font-bold",
                storagePercent > 90
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  : storagePercent > 70
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {storagePercent}%
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", storageColor)}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </section>
      )}

      {/* ── Tabs ────────────────────────────────────── */}
      <section className="mb-5">
        <div className="inline-flex gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => setTab("my")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-all",
              tab === "my"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Library className="size-3.5" />
            {tx(t, "media.myFiles", "My files")}
          </button>
          <button
            onClick={() => setTab("stock")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-all",
              tab === "stock"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ImageIcon className="size-3.5" />
            {tx(t, "media.stockPhotos", "Stock photos")}
          </button>
        </div>
      </section>

      {/* ── My Files Tab ────────────────────────────── */}
      {tab === "my" && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={tx(t, "media.searchPlaceholder", "Search files…")}
                className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
              />
            </div>
            <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
              {(["all", "image", "video", "audio"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilterType(f);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-3 py-1 text-[12px] font-semibold transition-colors",
                    filterType === f
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {f === "image" && <ImageIcon className="size-3" />}
                  {f === "video" && <Video className="size-3" />}
                  {f === "audio" && <Music className="size-3" />}
                  {tx(t, `media.filter.${f}`, f.charAt(0).toUpperCase() + f.slice(1))}
                </button>
              ))}
            </div>
          </div>

          {assets.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] animate-pulse rounded-xl border border-border bg-muted"
                />
              ))}
            </div>
          ) : assets.data && assets.data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {assets.data.items.map((asset) => {
                  const FIcon = fileIcon(asset.type);
                  return (
                    <div
                      key={asset.id}
                      className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-brand-500/40 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] bg-muted">
                        {asset.type === "image" && asset.url ? (
                          <img
                            src={asset.url}
                            alt={asset.filename}
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <FIcon className="size-10 text-muted-foreground/40" />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            if (
                              confirm(tx(t, "media.confirmDelete", "Delete this file?"))
                            ) {
                              deleteAsset.mutate({ id: asset.id });
                            }
                          }}
                          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity hover:bg-rose-500 group-hover:opacity-100"
                          aria-label={tx(t, "media.delete", "Delete")}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <div className="px-3 py-2.5">
                        <div className="truncate text-[12px] font-semibold text-foreground">
                          {asset.filename}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {formatBytes(asset.size)} · {formatDate(asset.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {assets.data.pages > 1 && (
                <Pagination
                  page={page}
                  pages={assets.data.pages}
                  onPrev={() => setPage(Math.max(1, page - 1))}
                  onNext={() => setPage(Math.min(assets.data!.pages, page + 1))}
                  t={t}
                />
              )}
            </>
          ) : (
            <EmptyState
              Icon={Library}
              title={search ? tx(t, "media.noResults", "No matches") : tx(t, "media.empty", "No files yet")}
              desc={
                search
                  ? tx(t, "media.tryAnotherSearch", "Try a different search.")
                  : tx(t, "media.emptyHint", "Upload images, videos & audio to use in your projects.")
              }
              cta={
                !search ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-4 text-[13px] font-bold text-white shadow-sm hover:scale-[1.02]"
                  >
                    <Plus className="size-4" />
                    {tx(t, "media.uploadFirst", "Upload your first file")}
                  </button>
                ) : null
              }
            />
          )}
        </>
      )}

      {/* ── Stock Photos Tab ────────────────────────── */}
      {tab === "stock" && (
        <>
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleStockSearch();
                }}
                placeholder={tx(
                  t,
                  "media.stockSearchPlaceholder",
                  "Search 4M+ free photos (e.g. mountain, coffee, neon)…",
                )}
                className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[14px] outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
              />
              {stockSearch && (
                <button
                  onClick={() => setStockSearch("")}
                  className="absolute right-3 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Clear"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <button
              onClick={handleStockSearch}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-5 text-[13px] font-bold text-white shadow-sm hover:scale-[1.02]"
            >
              <Search className="size-4" />
              {tx(t, "media.search", "Search")}
            </button>
          </div>

          <div className="mb-4 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{tx(t, "media.poweredByPexels", "Powered by")}</span>
            <a
              href="https://pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-bold text-foreground hover:text-brand-500"
            >
              Pexels
              <ExternalLink className="size-2.5" />
            </a>
          </div>

          {stockResults.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] animate-pulse rounded-xl border border-border bg-muted"
                />
              ))}
            </div>
          ) : stockResults.data?.note ? (
            <EmptyState
              Icon={Search}
              title={stockResults.data.note}
              desc=""
            />
          ) : stockResults.data && stockResults.data.photos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {stockResults.data.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-brand-500/40 hover:shadow-md"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={photo.src.medium}
                        alt={photo.alt}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="truncate text-[10px] text-muted-foreground">
                        {tx(t, "media.photoBy", "Photo by")}{" "}
                        <a
                          href={photo.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-foreground hover:text-brand-500"
                        >
                          {photo.photographer}
                        </a>
                      </div>
                      <button
                        onClick={() => handleAddStockToProject(photo.src.large, photo.photographer)}
                        className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded-lg border border-border bg-background text-[11px] font-bold text-foreground transition-colors hover:bg-muted hover:border-brand-500/40"
                      >
                        <Plus className="size-3" />
                        {tx(t, "media.addToProject", "Add to project")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                page={stockPage}
                pages={stockPage + 1}
                onPrev={() => setStockPage(Math.max(1, stockPage - 1))}
                onNext={() => setStockPage(stockPage + 1)}
                t={t}
                infinite
              />
            </>
          ) : stockQuery ? (
            <EmptyState
              Icon={Search}
              title={tx(t, "media.noStockResults", "No photos found")}
              desc={tx(t, "media.tryAnotherSearch", "Try a different search.")}
            />
          ) : (
            <EmptyState
              Icon={ImageIcon}
              title={tx(t, "media.stockHint", "Search free stock photos")}
              desc={tx(
                t,
                "media.stockHintDesc",
                "4M+ HD photos from Pexels — free for commercial use.",
              )}
            />
          )}
        </>
      )}

      <div className="h-12" />
    </div>
  );
}

/* ── Pagination ─────────────────────────────────────── */
function Pagination({
  page,
  pages,
  onPrev,
  onNext,
  t,
  infinite,
}: {
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
  t: (k: string) => string;
  infinite?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        aria-label="Previous"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="font-mono text-[12px] font-semibold text-muted-foreground">
        {page} {!infinite && `/ ${pages}`}
      </span>
      <button
        onClick={onNext}
        disabled={!infinite && page >= pages}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        aria-label="Next"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────── */
function EmptyState({
  Icon,
  title,
  desc,
  cta,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-muted/60">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-[15px] font-bold text-foreground">{title}</h3>
      {desc && <p className="mt-1 text-[13px] text-muted-foreground">{desc}</p>}
      {cta}
    </div>
  );
}
