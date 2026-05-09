"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useThemeStore } from "@/stores/useThemeStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import type { Locale } from "@/stores/useLocaleStore";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Mic,
  ImageIcon,
  Link as LinkIcon,
  Settings2,
  Lightbulb,
  Download,
  RefreshCw,
  X,
  Maximize2,
  Lock,
  Wand2,
  ChevronDown,
  Square,
  Smartphone,
  Monitor,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

/* ─────────────── Types & Constants ─────────────── */

type TabId = "scratch" | "swap";
type FormatId = "16:9" | "9:16";
type StyleId = "realistic" | "anime" | "cinematic" | "minimalist" | "3d" | "popart";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  revisedPrompt?: string;
  parentId?: string;
}

const STYLE_OPTIONS: { id: StyleId; gradient: string }[] = [
  { id: "realistic", gradient: "from-slate-500 to-zinc-700" },
  { id: "cinematic", gradient: "from-amber-500 to-rose-600" },
  { id: "anime", gradient: "from-fuchsia-500 to-pink-600" },
  { id: "minimalist", gradient: "from-slate-400 to-slate-600" },
  { id: "3d", gradient: "from-cyan-500 to-blue-600" },
  { id: "popart", gradient: "from-yellow-400 to-red-500" },
];

const COUNT_OPTIONS = [1, 2, 3] as const;
const FORMAT_OPTIONS: { id: FormatId; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "16:9", icon: Monitor },
  { id: "9:16", icon: Smartphone },
];

const STARTER_PROMPT_KEYS = [
  "aithumbs.starter.tutorial",
  "aithumbs.starter.vlog",
  "aithumbs.starter.gaming",
  "aithumbs.starter.unboxing",
  "aithumbs.starter.cooking",
  "aithumbs.starter.fitness",
  "aithumbs.starter.music",
  "aithumbs.starter.education",
] as const;

const LOCALE_TO_SPEECH_LANG: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
  kk: "kk-KZ",
  es: "es-ES",
};

let _uid = 0;
function uid() {
  return `ait_${Date.now()}_${++_uid}`;
}

const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;
function extractVideoId(url: string): string | null {
  const m = url.match(YT_REGEX);
  return m ? m[1] : null;
}

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
function createRecognition(): SpeechRecognitionInstance | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;
  return new (SR as new () => SpeechRecognitionInstance)();
}

/** Translate-with-fallback helper (matches Dashboard convention). */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ─────────────── Main Page ─────────────── */

export function AiThumbnailsPage() {
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const { canUseAI, plan } = usePlanLimits();

  /* ── State ── */
  const [tab, setTab] = useState<TabId>("scratch");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleId>("realistic");
  const [count, setCount] = useState<1 | 2 | 3>(1);
  const [format, setFormat] = useState<FormatId>("16:9");
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [lastBatch, setLastBatch] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const [aiIdeas, setAiIdeas] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [imageRevealed, setImageRevealed] = useState(false);
  const pendingRevealRef = useRef<(() => void) | null>(null);

  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState<string | null>(null);
  const [showYtModal, setShowYtModal] = useState(false);
  const [ytModalInput, setYtModalInput] = useState("");

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImage | null>(null);

  /* Responsive */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Auto-close mobile sheet when generating starts */
  useEffect(() => {
    if (mobileSheetOpen && progress > 0 && progress < 100) {
      setMobileSheetOpen(false);
    }
  }, [mobileSheetOpen, progress]);

  /* ── tRPC mutations ── */
  const generate = trpc.aiThumbnails.generate.useMutation({
    onMutate: () => {
      setProgress(0);
      setImageRevealed(false);
    },
    onSuccess: (data) => {
      const imgs: GeneratedImage[] = data.images.map(
        (img: { url: string; id: string; revisedPrompt?: string }) => ({
          id: img.id || uid(),
          url: img.url,
          prompt: data.prompt,
          style: data.style ?? "realistic",
          revisedPrompt: img.revisedPrompt,
        }),
      );
      toast.success(tx(t, "aithumbs.toast.success", "Thumbnails generated"));
      pendingRevealRef.current = () => {
        setSelectedImage(imgs[0] || null);
        setLastBatch(imgs);
        setHistory((prev) => [...imgs, ...prev].slice(0, 20));
        setImageRevealed(true);
      };
      setProgress((p) => (p >= 100 ? 100 : p));
    },
    onError: (err) => {
      setProgress(0);
      toast.error(err.message || tx(t, "aithumbs.toast.genFailed", "Generation failed"));
    },
  });

  const editMutation = trpc.aiThumbnails.edit.useMutation({
    onMutate: () => {
      setProgress(0);
      setImageRevealed(false);
    },
    onSuccess: (data) => {
      const img: GeneratedImage = {
        id: data.id || uid(),
        url: data.url,
        prompt: tx(t, "aithumbs.enhance", "Enhanced"),
        style: selectedImage?.style || style,
        parentId: selectedImage?.id,
      };
      toast.success(tx(t, "aithumbs.toast.enhanced", "Thumbnail enhanced"));
      pendingRevealRef.current = () => {
        setSelectedImage(img);
        setHistory((prev) => [img, ...prev].slice(0, 20));
        setImageRevealed(true);
      };
      setProgress((p) => (p >= 100 ? 100 : p));
    },
    onError: (err) => {
      setProgress(0);
      toast.error(err.message || tx(t, "aithumbs.toast.enhanceFailed", "Enhance failed"));
    },
  });

  const suggestIdeas = trpc.aiThumbnails.suggestIdeas.useMutation({
    onSuccess: (data) => {
      if (data.ideas.length > 0) setAiIdeas(data.ideas);
      else toast.info(tx(t, "aithumbs.toast.noIdeas", "No ideas yet, try a topic"));
    },
    onError: (err) => {
      toast.error(err.message || tx(t, "aithumbs.toast.ideasFailed", "Ideas failed"));
    },
  });

  /* ── Progress simulation ── */
  const isGenerating = generate.isPending || editMutation.isPending;

  useEffect(() => {
    if (!isGenerating) return;
    setProgress(0);
    pendingRevealRef.current = null;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        return Math.min(95, p + Math.random() * 4 + 1);
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (isGenerating || !pendingRevealRef.current) return;
    if (progress >= 100) {
      const reveal = pendingRevealRef.current;
      pendingRevealRef.current = null;
      reveal();
      return;
    }
    const interval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 8));
    }, 30);
    return () => clearInterval(interval);
  }, [isGenerating, progress]);

  /* ── Handlers ── */
  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || generate.isPending) return;
    generate.mutate({
      prompt: prompt.trim(),
      style,
      count: plan === "FREE" && count > 1 ? 1 : count,
      format,
      youtubeUrl: ytUrl || undefined,
      photoUrl: uploadedPhoto || undefined,
    });
  }, [prompt, count, format, style, plan, generate, ytUrl, uploadedPhoto]);

  const handleRegenerate = useCallback(() => {
    if (!selectedImage || generate.isPending) return;
    generate.mutate({
      prompt: selectedImage.prompt,
      style: (selectedImage.style as StyleId) || style,
      count: 1,
      format,
    });
  }, [selectedImage, generate, format, style]);

  const handleDownload = useCallback(async (img: GeneratedImage) => {
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const keywords = (img.prompt || "thumbnail")
        .replace(/[«»"'*\n]/g, "")
        .split(/[\s,.!?]+/)
        .filter((w) => w.length > 2 && w.length < 20)
        .slice(0, 4)
        .join("-")
        .toLowerCase()
        .replace(/[^a-zа-яёA-ZА-ЯЁ0-9-]/g, "") || "thumbnail";
      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tubeforge-${keywords}-${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(img.url, "_blank");
    }
  }, []);

  const handleYtUrl = useCallback(async (url: string) => {
    setYtUrl(url);
    const vid = extractVideoId(url);
    if (!vid) {
      setYtTitle(null);
      return;
    }
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`);
      const data = await res.json();
      setYtTitle(data.title ?? null);
    } catch {
      setYtTitle(null);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const recognition = createRecognition();
    if (!recognition) {
      toast.error(tx(t, "aithumbs.toast.noSpeech", "Speech not available"));
      return;
    }
    recognition.lang = LOCALE_TO_SPEECH_LANG[locale] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setPrompt((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, t, locale]);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedPhoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleGetIdeas = useCallback(() => {
    if (suggestIdeas.isPending) return;
    suggestIdeas.mutate({
      topic: prompt.trim() || undefined,
      locale: locale as "en" | "ru" | "kk" | "es",
    });
  }, [suggestIdeas, prompt, locale]);

  const isLoading = generate.isPending;
  const disabled = !prompt.trim() || isLoading;
  const progressPct = Math.round(progress);

  const starterChips = useMemo(
    () => STARTER_PROMPT_KEYS.map((k) => ({ key: k, label: t(k) })),
    [t],
  );

  /* ─────────────── Settings panel (left desktop / sheet mobile) ─────────────── */
  const SettingsPanel = (
    <div className="flex flex-col gap-5">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted">
        {(["scratch", "swap"] as TabId[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTab(mode)}
            className={cn(
              "h-9 rounded-lg text-sm font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              tab === mode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {mode === "scratch"
              ? tx(t, "aithumbs.tab.scratch", "From Scratch")
              : tx(t, "aithumbs.tab.swap", "Face Swap")}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>{tx(t, "aithumbs.describeIdea", "Describe your idea")} *</span>
          <span className="font-mono text-muted-foreground/70">{prompt.length}/1000</span>
        </label>
        <div className="relative">
          <textarea
            ref={promptTextareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder={tx(
              t,
              "aithumbs.promptPlaceholder",
              'Shocked guy looking at iPhone, neon background, big text "WOW"…',
            )}
            rows={4}
            className={cn(
              "w-full resize-y min-h-[120px] max-h-[280px] rounded-xl",
              "bg-card border border-border px-3.5 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60",
              "focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-colors",
            )}
          />
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt("")}
              aria-label={tx(t, "aithumbs.clearPrompt", "Clear prompt")}
              className="absolute top-2 right-2 size-6 rounded-md bg-muted hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Niche chip strip (collapsible) */}
        {!prompt && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {starterChips.slice(0, 6).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPrompt(label)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand-500/40 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar row */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={tx(t, "aithumbs.voice", "Voice input")}
            className={cn(
              "size-9 rounded-lg border transition-colors flex items-center justify-center",
              isListening
                ? "bg-brand-500 border-brand-500 text-white animate-pulse"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-brand-500/40",
            )}
          >
            <Mic className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={tx(t, "aithumbs.uploadPhoto", "Reference photo")}
            className={cn(
              "size-9 rounded-lg border transition-colors flex items-center justify-center",
              uploadedPhoto
                ? "bg-brand-500/15 border-brand-500/40 text-brand-500"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-brand-500/40",
            )}
          >
            <ImageIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setYtModalInput(ytUrl);
              setShowYtModal(true);
            }}
            aria-label={tx(t, "aithumbs.youtubeUrl", "YouTube reference")}
            className={cn(
              "size-9 rounded-lg border transition-colors flex items-center justify-center",
              ytTitle
                ? "bg-red-500/15 border-red-500/40 text-red-500"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-brand-500/40",
            )}
          >
            <LinkIcon className="size-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            type="button"
            onClick={handleGetIdeas}
            disabled={suggestIdeas.isPending}
            className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-card border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-brand-500/40 transition-colors disabled:opacity-50"
          >
            {suggestIdeas.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Lightbulb className="size-3.5" />
            )}
            {tx(t, "aithumbs.aiIdeas", "Ideas")}
          </button>
        </div>

        {/* AI Ideas list */}
        {aiIdeas.length > 0 && (
          <div className="rounded-lg bg-card border border-border p-2 space-y-1">
            {aiIdeas.map((idea, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPrompt(idea);
                  setAiIdeas([]);
                }}
                className="w-full text-left px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {idea}
              </button>
            ))}
          </div>
        )}

        {/* Reference indicators */}
        {(ytTitle || uploadedPhoto) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ytTitle && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] bg-red-500/10 border border-red-500/30 text-red-400">
                <LinkIcon className="size-3" />
                <span className="truncate max-w-[200px]">{ytTitle}</span>
                <button onClick={() => { setYtUrl(""); setYtTitle(""); }} aria-label="Remove" className="hover:text-red-300">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {uploadedPhoto && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] bg-brand-500/10 border border-brand-500/30 text-brand-400">
                <ImageIcon className="size-3" />
                {tx(t, "aithumbs.refPhoto", "Reference photo")}
                <button onClick={() => setUploadedPhoto(null)} aria-label="Remove" className="hover:text-brand-300">
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Style picker */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {tx(t, "aithumbs.style", "Style")}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((opt) => {
            const active = style === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStyle(opt.id)}
                className={cn(
                  "group relative h-16 rounded-xl overflow-hidden transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  active
                    ? "ring-2 ring-brand-500 shadow-lg"
                    : "border border-border hover:border-brand-500/40 hover:-translate-y-0.5",
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br", opt.gradient, !active && "opacity-50 group-hover:opacity-80")} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-1.5 left-2 right-2 text-[11px] font-bold text-white capitalize tracking-tight">
                  {opt.id === "3d" ? "3D" : opt.id === "popart" ? "Pop Art" : opt.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format + Count */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {tx(t, "aithumbs.format", "Format")}
          </span>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = format === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormat(opt.id)}
                  className={cn(
                    "h-9 rounded-md text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5",
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {opt.id}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            {tx(t, "aithumbs.count", "Count")}
            {plan === "FREE" && count > 1 && (
              <span className="text-[10px] text-amber-500 font-bold">PRO</span>
            )}
          </span>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted">
            {COUNT_OPTIONS.map((c) => {
              const locked = plan === "FREE" && c > 1;
              const active = count === c && !locked;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (locked) {
                      toast.info(tx(t, "aithumbs.toast.upgradeForBatch", "Upgrade to Pro for batch generation"));
                      return;
                    }
                    setCount(c);
                  }}
                  className={cn(
                    "h-9 rounded-md text-xs font-mono font-semibold transition-all flex items-center justify-center relative",
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                    locked && "opacity-50",
                  )}
                >
                  {c}
                  {locked && <Lock className="size-2.5 absolute top-1 right-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generate CTA */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={disabled}
        className={cn(
          "relative h-14 rounded-2xl font-semibold text-white text-base overflow-hidden transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
        )}
      >
        {isLoading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            <span>{tx(t, "aithumbs.generating", "Generating…")} {progressPct}%</span>
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            <Sparkles className="size-5" />
            <span>{tx(t, "aithumbs.generate", "Generate")}</span>
            {canUseAI && (
              <span className="font-mono text-xs opacity-80 ml-2">⌘⏎</span>
            )}
          </span>
        )}
        {/* Shimmer */}
        {!disabled && !isLoading && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />
        )}
      </button>

      {!canUseAI && (
        <Link
          href="/billing"
          className="text-center text-xs text-amber-500 hover:text-amber-400 underline-offset-2 hover:underline transition-colors"
        >
          {tx(t, "aithumbs.outOfCredits", "Out of credits — upgrade to Pro")}
        </Link>
      )}

      {/* History strip */}
      {history.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            {tx(t, "aithumbs.tab.history", "Recent")} <span className="font-mono">{history.length}</span>
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {history.slice(0, 8).map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={cn(
                  "shrink-0 size-14 rounded-lg overflow-hidden border-2 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  selectedImage?.id === img.id
                    ? "border-brand-500"
                    : "border-transparent hover:border-brand-500/40",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ─────────────── Right pane: Preview ─────────────── */
  const PreviewPane = (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      {/* Top bar (preview header) */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-4 text-brand-500 shrink-0" />
          <h1 className="text-sm font-bold text-foreground truncate">
            {tx(t, "aithumbs.title", "AI Thumbnails")}
          </h1>
          {selectedImage && lastBatch.length > 1 && (
            <span className="text-xs text-muted-foreground font-mono ml-2">
              {lastBatch.findIndex((i) => i.id === selectedImage.id) + 1}/{lastBatch.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedImage && !isLoading && (
            <>
              <button
                type="button"
                onClick={handleRegenerate}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-card border border-border text-xs font-semibold text-foreground hover:border-brand-500/40 transition-colors"
              >
                <RefreshCw className="size-3.5" />
                {tx(t, "aithumbs.regenerate", "Regenerate")}
              </button>
              <button
                type="button"
                onClick={() => handleDownload(selectedImage)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
              >
                <Download className="size-3.5" />
                {tx(t, "aithumbs.download", "Download")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl h-full flex flex-col">
          {isLoading ? (
            <LoadingFrame format={format} progressPct={progressPct} t={t} />
          ) : selectedImage ? (
            <ResultDisplay
              image={selectedImage}
              format={format}
              batch={lastBatch}
              onSelect={setSelectedImage}
              onFullscreen={setFullscreenImage}
              onDownload={handleDownload}
              t={t}
              imageRevealed={imageRevealed}
            />
          ) : (
            <EmptyState
              format={format}
              starterChips={starterChips.slice(0, 6)}
              onChip={(p) => {
                setPrompt(p);
                if (isMobile) setMobileSheetOpen(true);
                else promptTextareaRef.current?.focus();
              }}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );

  /* ─────────────── Layout ─────────────── */
  return (
    <div className="relative flex flex-col md:flex-row h-[calc(100dvh-56px)] min-h-0 overflow-hidden bg-background text-foreground">
      {/* Desktop: left settings panel */}
      <aside className="hidden md:flex w-[380px] shrink-0 flex-col border-r border-border overflow-y-auto">
        <div className="p-5">{SettingsPanel}</div>
      </aside>

      {/* Right: Preview */}
      {PreviewPane}

      {/* Mobile: floating settings button */}
      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileSheetOpen(true)}
          aria-label={tx(t, "aithumbs.openSettings", "Open settings")}
          className="md:hidden fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 h-12 px-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg transition-all"
        >
          <Settings2 className="size-4" />
          {prompt ? tx(t, "aithumbs.editPrompt", "Edit") : tx(t, "aithumbs.compose", "Compose")}
        </button>
      )}

      {/* Mobile bottom sheet */}
      {isMobile && mobileSheetOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
            onClick={() => setMobileSheetOpen(false)}
          />
          <div className="md:hidden fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-2xl bg-background border-t border-border overflow-y-auto pb-safe animate-[slideUp_250ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="sticky top-0 flex items-center justify-between px-5 py-3 bg-background border-b border-border">
              <h2 className="text-sm font-bold text-foreground inline-flex items-center gap-2">
                <Settings2 className="size-4" /> {tx(t, "aithumbs.settings", "Settings")}
              </h2>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                aria-label={tx(t, "common.close", "Close")}
                className="size-8 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {SettingsPanel}
            </div>
          </div>
        </>
      )}

      {/* YouTube URL modal */}
      {showYtModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground inline-flex items-center gap-2">
                <LinkIcon className="size-4 text-red-500" />
                {tx(t, "aithumbs.youtubeUrlTitle", "YouTube reference URL")}
              </h3>
              <button
                onClick={() => setShowYtModal(false)}
                className="size-8 rounded-full bg-muted hover:bg-card text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tx(
                t,
                "aithumbs.youtubeUrlHelp",
                "Paste a public YouTube URL — we will use the title for context.",
              )}
            </p>
            <input
              type="url"
              value={ytModalInput}
              onChange={(e) => setYtModalInput(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowYtModal(false)}
                className="h-9 px-3 rounded-lg bg-card border border-border text-xs font-semibold text-foreground"
              >
                {tx(t, "common.cancel", "Cancel")}
              </button>
              <button
                onClick={() => {
                  handleYtUrl(ytModalInput);
                  setShowYtModal(false);
                }}
                className="h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
              >
                {tx(t, "common.apply", "Apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen image modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_150ms]"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            aria-label="Close"
            className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.prompt}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Inline animations */}
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

function EmptyState({
  format,
  starterChips,
  onChip,
  t,
}: {
  format: FormatId;
  starterChips: { key: string; label: string }[];
  onChip: (prompt: string) => void;
  t: (k: string) => string;
}) {
  const aspectClass = format === "16:9" ? "aspect-video" : "aspect-[9/16] max-w-xs mx-auto";
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
      <div
        className={cn(
          "w-full rounded-2xl border-2 border-dashed border-border bg-card/40 flex flex-col items-center justify-center gap-4 p-8",
          aspectClass,
        )}
      >
        <div className="size-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center">
          <Sparkles className="size-7 text-brand-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            {tx(t, "aithumbs.empty.title", "Your thumbnail will appear here")}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            {tx(t, "aithumbs.empty.desc", "Describe your idea on the left, then hit Generate. AI takes ~10 seconds.")}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 max-w-md pt-2">
          {starterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChip(chip.label)}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand-500/40 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingFrame({
  format,
  progressPct,
  t,
}: {
  format: FormatId;
  progressPct: number;
  t: (k: string) => string;
}) {
  const aspectClass = format === "16:9" ? "aspect-video" : "aspect-[9/16] max-w-xs mx-auto";
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4">
      <div
        className={cn(
          "relative w-full rounded-2xl bg-card border border-border overflow-hidden",
          aspectClass,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-violet-500/10 to-fuchsia-500/10 animate-pulse" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-10 animate-spin text-brand-500" />
          <div className="font-mono text-2xl font-bold text-foreground tabular-nums">
            {progressPct}%
          </div>
          <div className="text-xs text-muted-foreground">
            {tx(t, "aithumbs.generating", "Generating…")}
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ResultDisplay({
  image,
  format,
  batch,
  onSelect,
  onFullscreen,
  onDownload,
  t,
  imageRevealed,
}: {
  image: GeneratedImage;
  format: FormatId;
  batch: GeneratedImage[];
  onSelect: (img: GeneratedImage) => void;
  onFullscreen: (img: GeneratedImage) => void;
  onDownload: (img: GeneratedImage) => void;
  t: (k: string) => string;
  imageRevealed: boolean;
}) {
  const aspectClass = format === "16:9" ? "aspect-video" : "aspect-[9/16] max-w-xs mx-auto";
  return (
    <div className="flex-1 flex flex-col gap-4 py-2">
      {/* Hero image */}
      <div className={cn("relative w-full rounded-2xl bg-card border border-border overflow-hidden group transition-opacity", aspectClass, imageRevealed ? "opacity-100" : "opacity-0")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-2">
          <button
            type="button"
            onClick={() => onFullscreen(image)}
            className="self-end inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            <Maximize2 className="size-3.5" />
            {tx(t, "aithumbs.fullscreen", "Fullscreen")}
          </button>
        </div>
      </div>

      {/* Variants strip (when batch > 1) */}
      {batch.length > 1 && (
        <div className="flex gap-2 justify-center">
          {batch.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelect(img)}
              className={cn(
                "shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all",
                image.id === img.id ? "border-brand-500 scale-105" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Prompt + meta */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {tx(t, "aithumbs.prompt", "Prompt")}
        </div>
        <p className="text-sm text-foreground leading-relaxed">{image.prompt}</p>
        {image.revisedPrompt && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronDown className="size-3" />
              {tx(t, "aithumbs.revisedPrompt", "AI-expanded prompt")}
            </summary>
            <p className="mt-2 leading-relaxed pl-4 border-l-2 border-border">{image.revisedPrompt}</p>
          </details>
        )}
      </div>
    </div>
  );
}
