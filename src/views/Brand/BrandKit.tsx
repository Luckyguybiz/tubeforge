"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Palette,
  Upload,
  Check,
  Sparkles,
  Image as ImageIcon,
  Wand2,
  X,
  Crown,
  Lock,
  Pipette,
  Loader2,
} from "lucide-react";

/* ── Translate-with-fallback ───────────────────────────── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── Curated palette presets (anti-силиконность: real-world examples) ── */
interface Preset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

const PRESETS: Preset[] = [
  { id: "tubeforge", name: "TubeForge", primary: "#6366f1", secondary: "#a855f7", accent: "#f59e0b" },
  { id: "mrbeast", name: "Bold & Loud", primary: "#ef4444", secondary: "#fbbf24", accent: "#0ea5e9" },
  { id: "tech", name: "Tech Mono", primary: "#0ea5e9", secondary: "#10b981", accent: "#fb923c" },
  { id: "lifestyle", name: "Soft Pastel", primary: "#f472b6", secondary: "#a78bfa", accent: "#fcd34d" },
  { id: "luxury", name: "Premium", primary: "#0f172a", secondary: "#facc15", accent: "#94a3b8" },
  { id: "earth", name: "Earthy", primary: "#65a30d", secondary: "#ca8a04", accent: "#dc2626" },
];

/* ── Hex color input with swatch ────────────────────────── */
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const colorRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        {/* Color swatch (clickable native picker) */}
        <button
          type="button"
          onClick={() => colorRef.current?.click()}
          className="absolute left-2 top-1/2 size-7 -translate-y-1/2 cursor-pointer rounded-md border border-border shadow-sm transition-transform hover:scale-105"
          style={{ background: value }}
          aria-label={`${label} color picker`}
        />
        <input
          ref={colorRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-0 opacity-0"
          tabIndex={-1}
          aria-hidden
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className="h-11 w-full rounded-lg border border-border bg-background pl-11 pr-3 font-mono text-sm font-semibold uppercase text-foreground outline-none transition-shadow focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
        />
      </div>
    </div>
  );
}

/* ── Logo dropzone ──────────────────────────────────────── */
function LogoDropzone({
  logoUrl,
  onUpload,
  onRemove,
  onClear,
  uploading,
}: {
  logoUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onClear: () => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onUpload(file);
    },
    [onUpload],
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file);
      onClear();
    },
    [onUpload, onClear],
  );

  if (logoUrl) {
    return (
      <div className="flex items-center gap-4">
        <div className="relative size-24 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted to-card p-3">
          <img
            src={logoUrl}
            alt="Brand logo"
            loading="lazy"
            className="size-full object-contain"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleSelect}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Upload className="size-3.5" />
            Change logo
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-rose-500"
          >
            <X className="size-3" />
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-10 text-center transition-colors",
        dragOver
          ? "border-brand-500 bg-brand-500/5"
          : "border-border hover:border-brand-500/40 hover:bg-muted/50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleSelect}
      />
      {uploading ? (
        <Loader2 className="size-7 animate-spin text-brand-500" />
      ) : (
        <div className="flex size-12 items-center justify-center rounded-xl bg-card text-muted-foreground transition-colors group-hover:text-brand-500">
          <Upload className="size-5" />
        </div>
      )}
      <div className="mt-3 text-sm font-semibold text-foreground">
        {uploading ? "Uploading…" : "Drop logo here or click to upload"}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        PNG, JPG, WebP, SVG · max 2 MB · 512×512 recommended
      </div>
    </div>
  );
}

/* ── Live preview card showing brand applied ────────────── */
function BrandPreview({
  primary,
  secondary,
  accent,
  logoUrl,
}: {
  primary: string;
  secondary: string;
  accent: string;
  logoUrl: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Mock thumbnail */}
      <div
        className="relative flex h-44 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        {logoUrl && (
          <div className="absolute top-3 left-3 size-10 overflow-hidden rounded-lg bg-white/90 p-1.5 shadow-md">
            <img src={logoUrl} alt="" className="size-full object-contain" />
          </div>
        )}
        <div className="relative z-10 text-center">
          <div className="text-2xl font-bold text-white drop-shadow-md">YOUR VIDEO</div>
          <div
            className="mt-1 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md"
            style={{ background: accent }}
          >
            NEW
          </div>
        </div>
      </div>
      {/* Mock metadata strip */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="size-9 rounded-full"
          style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
        />
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            Your video title goes here · 12 min
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Your channel · 24K views · 2 hours ago
          </div>
        </div>
        <button
          className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-sm"
          style={{ background: primary }}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */

export function BrandKit() {
  const t = useLocaleStore((s) => s.t);
  const planInfo = usePlanLimits();
  const router = useRouter();

  const [primary, setPrimary] = useState("#6366f1");
  const [secondary, setSecondary] = useState("#a855f7");
  const [accent, setAccent] = useState("#f59e0b");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isStudio = planInfo.plan === "STUDIO";

  /* ── Queries ───────────────────────────────────────── */
  const brandKit = trpc.brand.getBrandKit.useQuery(undefined, {
    enabled: isStudio,
  });

  const saveMutation = trpc.brand.saveBrandKit.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "brand.saved", "Brand kit saved"));
      setSaving(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSaving(false);
    },
  });

  /* ── Load brand kit data ───────────────────────────── */
  useEffect(() => {
    if (brandKit.data) {
      setPrimary(brandKit.data.primaryColor);
      setSecondary(brandKit.data.secondaryColor);
      setAccent(brandKit.data.accentColor);
      setLogoUrl(brandKit.data.logoUrl);
    }
  }, [brandKit.data]);

  /* ── Handlers ──────────────────────────────────────── */
  const handleSave = useCallback(() => {
    if (!isStudio) return;
    setSaving(true);
    saveMutation.mutate({
      primaryColor: primary,
      secondaryColor: secondary,
      accentColor: accent,
      logoUrl,
    });
  }, [isStudio, primary, secondary, accent, logoUrl, saveMutation]);

  const handleApplyPreset = useCallback((preset: Preset) => {
    setPrimary(preset.primary);
    setSecondary(preset.secondary);
    setAccent(preset.accent);
    toast.success(`${preset.name} palette applied`);
  }, []);

  const handleLogoUpload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      setUploading(true);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = (await res.json()) as { url?: string; error?: string };

        if (!res.ok || !data.url) {
          toast.error(data.error || tx(t, "brand.uploadError", "Upload failed"));
          return;
        }
        setLogoUrl(data.url);
        toast.success(tx(t, "brand.logoUploaded", "Logo uploaded"));
      } catch {
        toast.error(tx(t, "brand.uploadError", "Upload failed"));
      } finally {
        setUploading(false);
      }
    },
    [t],
  );

  const isPresetActive = useCallback(
    (preset: Preset) =>
      preset.primary.toLowerCase() === primary.toLowerCase() &&
      preset.secondary.toLowerCase() === secondary.toLowerCase() &&
      preset.accent.toLowerCase() === accent.toLowerCase(),
    [primary, secondary, accent],
  );

  /* ── STUDIO upsell ─────────────────────────────────── */
  if (!isStudio && !planInfo.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <Crown className="size-7 text-white" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {tx(t, "brand.title", "Brand Kit")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
            {tx(
              t,
              "brand.studioOnly",
              "Apply your brand identity across every video, thumbnail, and export — automatically.",
            )}
          </p>
        </div>

        {/* Live demo of branded preview */}
        <div className="mt-8">
          <BrandPreview
            primary="#6366f1"
            secondary="#a855f7"
            accent="#f59e0b"
            logoUrl={null}
          />
        </div>

        {/* Feature list */}
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-card p-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Studio Plan Only
          </div>
          <ul className="mt-3 space-y-2.5 text-[14px] text-foreground">
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>
                <strong className="font-semibold">Custom color palette</strong> — primary, secondary
                & accent applied to every export
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>
                <strong className="font-semibold">Logo watermark</strong> — auto-placed on every
                video output
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>
                <strong className="font-semibold">One-click apply</strong> — re-skin existing
                projects with new brand
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/billing"
            prefetch
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-[15px] font-bold text-white shadow-md shadow-amber-500/20 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2"
          >
            <Crown className="size-4" />
            {tx(t, "brand.upgradeTo", "Upgrade to")} Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="pt-6 pb-2 sm:pt-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/20">
            <Palette className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {tx(t, "brand.title", "Brand Kit")}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {tx(
                t,
                "brand.subtitle",
                "Define your brand colors and logo — they'll be auto-applied to every export.",
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* ── LEFT: editor ─────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Color palette */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <Pipette className="size-4 text-muted-foreground" />
                {tx(t, "brand.colors", "Colors")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ColorInput
                label={tx(t, "brand.primaryColor", "Primary")}
                value={primary}
                onChange={setPrimary}
              />
              <ColorInput
                label={tx(t, "brand.secondaryColor", "Secondary")}
                value={secondary}
                onChange={setSecondary}
              />
              <ColorInput
                label={tx(t, "brand.accentColor", "Accent")}
                value={accent}
                onChange={setAccent}
              />
            </div>

            {/* Combined gradient preview */}
            <div
              className="mt-5 h-10 rounded-lg shadow-inner"
              style={{
                background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 50%, ${accent} 100%)`,
              }}
            />
          </section>

          {/* Curated palette presets */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <Wand2 className="size-4 text-muted-foreground" />
              Quick palettes
            </h2>
            <p className="mb-4 text-[12px] text-muted-foreground">
              Curated for YouTube niches — click to apply
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRESETS.map((preset) => {
                const active = isPresetActive(preset);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border bg-background p-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2",
                      active
                        ? "border-brand-500 shadow-md shadow-brand-500/15"
                        : "border-border hover:border-brand-500/40 hover:shadow-sm",
                    )}
                  >
                    <div className="flex h-7 w-full overflow-hidden rounded-md">
                      <div className="flex-1" style={{ background: preset.primary }} />
                      <div className="flex-1" style={{ background: preset.secondary }} />
                      <div className="flex-1" style={{ background: preset.accent }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <div className="text-[12px] font-semibold text-foreground">{preset.name}</div>
                      {active && <Check className="size-3.5 text-brand-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Logo */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <ImageIcon className="size-4 text-muted-foreground" />
              {tx(t, "brand.logo", "Logo")}
            </h2>
            <LogoDropzone
              logoUrl={logoUrl}
              uploading={uploading}
              onUpload={handleLogoUpload}
              onRemove={() => setLogoUrl(null)}
              onClear={() => {}}
            />
          </section>

          {/* Save action */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || saveMutation.isPending}
              className={cn(
                "inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-6 text-[14px] font-bold text-white shadow-md shadow-brand-500/20 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2",
                saving ? "cursor-wait opacity-60" : "hover:scale-[1.02]",
              )}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {saving
                ? tx(t, "brand.saving", "Saving…")
                : tx(t, "brand.save", "Save brand kit")}
            </button>
          </div>
        </div>

        {/* ── RIGHT: live preview ──────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Live preview
              </span>
            </div>
            <BrandPreview
              primary={primary}
              secondary={secondary}
              accent={accent}
              logoUrl={logoUrl}
            />
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              This is how your brand will appear on thumbnails, channel cards, and exports.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
