"use client";

import { useState, useMemo, useCallback, useRef, memo } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { cn } from "@/lib/utils";
import {
  Search,
  Sparkles,
  Lock,
  ArrowUpRight,
  Video,
  Image as ImageIcon,
  Mic,
  Wand2,
  Music,
  Subtitles,
  Languages,
  Calendar,
  Send,
  PlayCircle,
  Scissors,
  Compass,
  Brain,
  FileText,
  Clapperboard,
  ImageOff,
  Volume2,
  Download,
  RefreshCw,
  Sliders,
  Zap,
  TrendingUp,
  Users,
  Layers,
  X,
} from "lucide-react";

/* ── Translate-with-fallback ───────────────────────────────── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ═══════════════════════════════════════════════════════════════════
   TOOL DEFINITIONS
   ═══════════════════════════════════════════════════════════════════ */

type ToolCategory =
  | "all"
  | "creation"
  | "optimization"
  | "audio"
  | "publishing"
  | "ai"
  | "video"
  | "free"
  | "downloaders";

type ToolBadge = "PRO" | "FREE" | "NEW" | "BETA";

interface ToolDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: ToolCategory;
  route?: string;
  available: boolean;
  badge?: ToolBadge;
  /** Tailwind gradient classes for the icon backdrop */
  gradient: string;
  /** Lucide icon component */
  Icon: React.ComponentType<{ className?: string }>;
}

function getTools(t: (key: string) => string): ToolDef[] {
  return [
    /* ── Core Studio Tools ─────────────────────────────── */
    {
      id: "video",
      name: tx(t, "toolshub.tool.video.name", "Video Editor"),
      subtitle: tx(t, "toolshub.tool.video.subtitle", "Studio · AI scenes"),
      description: tx(
        t,
        "toolshub.tool.video.description",
        "Full-featured video editor with AI-assisted scenes, transitions and motion graphics.",
      ),
      category: "creation",
      route: "/editor",
      available: true,
      badge: "PRO",
      gradient: "from-indigo-500 to-violet-500",
      Icon: Video,
    },
    {
      id: "thumbnails",
      name: tx(t, "toolshub.tool.thumbnails.name", "Thumbnail Editor"),
      subtitle: "Canvas · DALL-E 3",
      description: tx(
        t,
        "toolshub.tool.thumbnails.description",
        "Design viral thumbnails with AI-powered backgrounds, fonts and effects.",
      ),
      category: "creation",
      route: "/thumbnails",
      available: true,
      badge: "PRO",
      gradient: "from-violet-500 to-fuchsia-500",
      Icon: ImageIcon,
    },
    {
      id: "metadata",
      name: tx(t, "toolshub.tool.metadata.name", "Metadata Optimizer"),
      subtitle: tx(t, "toolshub.tool.metadata.subtitle", "Title · Tags · SEO"),
      description: tx(
        t,
        "toolshub.tool.metadata.description",
        "Optimize titles, descriptions, and tags for maximum reach and CTR.",
      ),
      category: "optimization",
      route: "/preview?tab=seo",
      available: true,
      badge: "FREE",
      gradient: "from-blue-500 to-indigo-500",
      Icon: TrendingUp,
    },
    {
      id: "preview",
      name: tx(t, "toolshub.tool.preview.name", "Preview & Publish"),
      subtitle: tx(t, "toolshub.tool.preview.subtitle", "Channel · Schedule"),
      description: tx(
        t,
        "toolshub.tool.preview.description",
        "Preview how your video looks on YouTube, then publish or schedule.",
      ),
      category: "publishing",
      route: "/preview",
      available: true,
      badge: "FREE",
      gradient: "from-violet-600 to-purple-500",
      Icon: PlayCircle,
    },

    /* ── AI Tools ──────────────────────────────────────── */
    {
      id: "image-generator",
      name: "AI Image Generator",
      subtitle: tx(t, "toolshub.tool.image-generator.subtitle", "DALL-E · Stable Diffusion"),
      description: tx(
        t,
        "toolshub.tool.image-generator.description",
        "Generate any image from text prompts with multiple AI models.",
      ),
      category: "ai",
      route: "/tools/image-generator",
      available: true,
      badge: "PRO",
      gradient: "from-indigo-500 to-violet-500",
      Icon: Sparkles,
    },
    {
      id: "voiceover-generator",
      name: "AI Voiceover Generator",
      subtitle: tx(t, "toolshub.tool.voiceover-generator.subtitle", "ElevenLabs · 100+ voices"),
      description: tx(
        t,
        "toolshub.tool.voiceover-generator.description",
        "Generate human-like voiceovers in any language with realistic emotion.",
      ),
      category: "ai",
      route: "/tools/voiceover-generator",
      available: true,
      badge: "PRO",
      gradient: "from-violet-500 to-purple-500",
      Icon: Mic,
    },
    {
      id: "speech-enhancer",
      name: "AI Speech Enhancer",
      subtitle: tx(t, "toolshub.tool.speech-enhancer.subtitle", "Audio cleanup · Studio quality"),
      description: tx(
        t,
        "toolshub.tool.speech-enhancer.description",
        "Remove noise, echo and artifacts. Make any voice sound studio-grade.",
      ),
      category: "ai",
      route: "/tools/speech-enhancer",
      available: false,
      gradient: "from-purple-500 to-indigo-500",
      Icon: Wand2,
    },
    {
      id: "veo3-generator",
      name: "AI Video Generator",
      subtitle: tx(t, "toolshub.tool.veo3-generator.subtitle", "Veo 3 · Sora · Kling"),
      description: tx(
        t,
        "toolshub.tool.veo3-generator.description",
        "Generate cinematic videos from text or image prompts.",
      ),
      category: "ai",
      route: "/tools/veo3-generator",
      available: false,
      gradient: "from-violet-500 to-pink-500",
      Icon: Clapperboard,
    },
    {
      id: "brainstormer",
      name: "AI Brainstormer",
      subtitle: tx(t, "toolshub.tool.brainstormer.subtitle", "Ideas · Trends · Hooks"),
      description: tx(
        t,
        "toolshub.tool.brainstormer.description",
        "Generate viral video ideas based on your niche and trending topics.",
      ),
      category: "ai",
      route: "/tools/brainstormer",
      available: false,
      gradient: "from-violet-500 to-fuchsia-500",
      Icon: Brain,
    },
    {
      id: "vocal-remover",
      name: "AI Vocal Remover",
      subtitle: tx(t, "toolshub.tool.vocal-remover.subtitle", "Stem split · Karaoke"),
      description: tx(
        t,
        "toolshub.tool.vocal-remover.description",
        "Separate vocals from instruments — make karaoke or remix tracks.",
      ),
      category: "ai",
      route: "/tools/vocal-remover",
      available: false,
      gradient: "from-purple-600 to-violet-500",
      Icon: Music,
    },
    {
      id: "ai-creator",
      name: "AI Creator",
      subtitle: tx(t, "toolshub.tool.ai-creator.subtitle", "End-to-end content"),
      description: tx(
        t,
        "toolshub.tool.ai-creator.description",
        "Full pipeline: idea → script → voiceover → video → thumbnail. One click.",
      ),
      category: "ai",
      route: "/tools/ai-creator",
      available: false,
      gradient: "from-indigo-500 to-purple-500",
      Icon: Zap,
    },

    /* ── Video Tools ───────────────────────────────────── */
    {
      id: "autoclip",
      name: "AutoClip",
      subtitle: tx(t, "toolshub.tool.autoclip.subtitle", "Long-form → Shorts"),
      description: tx(
        t,
        "toolshub.tool.autoclip.description",
        "Automatically extract viral clips from long videos with AI scene detection.",
      ),
      category: "video",
      route: "/tools/autoclip",
      available: false,
      badge: "PRO",
      gradient: "from-indigo-500 to-purple-500",
      Icon: Scissors,
    },
    {
      id: "cut-crop",
      name: "Cut & Crop",
      subtitle: tx(t, "toolshub.tool.cut-crop.subtitle", "Trim · Resize · Aspect"),
      description: tx(
        t,
        "toolshub.tool.cut-crop.description",
        "Trim, crop and reframe videos for any platform with smart aspect detection.",
      ),
      category: "video",
      route: "/tools/cut-crop",
      available: true,
      badge: "FREE",
      gradient: "from-blue-500 to-indigo-500",
      Icon: Scissors,
    },
    {
      id: "subtitle-editor",
      name: "Subtitle Editor",
      subtitle: tx(t, "toolshub.tool.subtitle-editor.subtitle", "SRT · VTT · Burn-in"),
      description: tx(
        t,
        "toolshub.tool.subtitle-editor.description",
        "Generate, edit and style subtitles with auto-sync and translations.",
      ),
      category: "video",
      route: "/tools/subtitle-editor",
      available: true,
      badge: "FREE",
      gradient: "from-violet-500 to-blue-500",
      Icon: Subtitles,
    },
    {
      id: "subtitle-remover",
      name: "Subtitle Remover",
      subtitle: tx(t, "toolshub.tool.subtitle-remover.subtitle", "AI inpainting"),
      description: tx(
        t,
        "toolshub.tool.subtitle-remover.description",
        "Remove burned-in subtitles from any video using AI inpainting.",
      ),
      category: "video",
      route: "/tools/subtitle-remover",
      available: false,
      gradient: "from-violet-500 to-purple-500",
      Icon: Subtitles,
    },
    {
      id: "mp4-to-gif",
      name: "MP4 to GIF",
      subtitle: "Video · Converter",
      description:
        "Convert MP4 videos to high-quality GIF animations with custom FPS, size, and duration.",
      category: "video",
      route: "/tools/mp4-to-gif",
      available: true,
      badge: "FREE",
      gradient: "from-orange-500 to-violet-500",
      Icon: ImageIcon,
    },
    {
      id: "reddit-video",
      name: "Reddit Video Generator",
      subtitle: "Reddit · Shorts",
      description: tx(
        t,
        "toolshub.tool.reddit-video.description",
        "Turn Reddit threads into engaging short-form videos automatically.",
      ),
      category: "video",
      route: "/tools/reddit-video",
      available: false,
      gradient: "from-violet-500 to-purple-500",
      Icon: FileText,
    },
    {
      id: "fake-texts",
      name: "Fake Texts Video",
      subtitle: tx(t, "toolshub.tool.fake-texts.subtitle", "iMessage · WhatsApp"),
      description: tx(
        t,
        "toolshub.tool.fake-texts.description",
        "Generate realistic text message videos for storytelling content.",
      ),
      category: "video",
      route: "/tools/fake-texts",
      available: false,
      gradient: "from-indigo-500 to-violet-500",
      Icon: FileText,
    },

    /* ── Optimization ─────────────────────────────────── */
    {
      id: "youtube-downloader",
      name: "Video Inspector",
      subtitle: tx(t, "toolshub.tool.youtube-downloader.subtitle", "Views · Tags · Stats"),
      description: tx(
        t,
        "toolshub.tool.youtube-downloader.description",
        "Analyze YouTube videos — views, likes, comments, tags & description.",
      ),
      category: "optimization",
      route: "/tools/youtube-downloader",
      available: true,
      badge: "FREE",
      gradient: "from-rose-500 to-indigo-500",
      Icon: Search,
    },
    {
      id: "tiktok-downloader",
      name: "TikTok Downloader",
      subtitle: tx(t, "toolshub.tool.tiktok-downloader.subtitle", "No watermark · HD"),
      description: tx(
        t,
        "toolshub.tool.tiktok-downloader.description",
        "Download TikTok videos in HD without watermark for analysis.",
      ),
      category: "downloaders",
      route: "/tools/tiktok-downloader",
      available: false,
      gradient: "from-indigo-700 to-indigo-500",
      Icon: Download,
    },

    /* ── Free Tools ────────────────────────────────────── */
    {
      id: "audio-balancer",
      name: "Audio Balancer",
      subtitle: tx(t, "toolshub.tool.audio-balancer.subtitle", "EQ · Compressor · Limit"),
      description: tx(
        t,
        "toolshub.tool.audio-balancer.description",
        "Auto-balance audio levels across multiple tracks with one click.",
      ),
      category: "free",
      route: "/tools/audio-balancer",
      available: false,
      badge: "FREE",
      gradient: "from-indigo-600 to-indigo-500",
      Icon: Sliders,
    },
    {
      id: "video-compressor",
      name: "Video Compressor",
      subtitle: tx(t, "toolshub.tool.video-compressor.subtitle", "Smart bitrate"),
      description: tx(
        t,
        "toolshub.tool.video-compressor.description",
        "Compress videos without visible quality loss using smart bitrate detection.",
      ),
      category: "free",
      route: "/tools/video-compressor",
      available: true,
      badge: "FREE",
      gradient: "from-sky-500 to-indigo-500",
      Icon: Layers,
    },
    {
      id: "mp3-converter",
      name: "MP3 Converter",
      subtitle: tx(t, "toolshub.tool.mp3-converter.subtitle", "Video → Audio · Any format"),
      description: tx(
        t,
        "toolshub.tool.mp3-converter.description",
        "Convert any video to MP3 with custom bitrate and metadata.",
      ),
      category: "free",
      route: "/tools/mp3-converter",
      available: true,
      badge: "FREE",
      gradient: "from-amber-500 to-violet-500",
      Icon: Music,
    },

    /* ── More Tools ────────────────────────────────────── */
    {
      id: "background-remover",
      name: "Background Remover",
      subtitle: tx(t, "toolshub.tool.background-remover.subtitle", "Remove · Replace"),
      description: tx(
        t,
        "toolshub.tool.background-remover.description",
        "Remove or replace any background with AI matting in one click.",
      ),
      category: "ai",
      route: "/tools/background-remover",
      available: true,
      badge: "NEW",
      gradient: "from-pink-500 to-violet-500",
      Icon: ImageOff,
    },
    {
      id: "voice-changer",
      name: "Voice Changer",
      subtitle: tx(t, "toolshub.tool.voice-changer.subtitle", "Pitch · Tone · Effects"),
      description: tx(
        t,
        "toolshub.tool.voice-changer.description",
        "Transform voices with pitch shift, tone effects and AI personalities.",
      ),
      category: "audio",
      route: "/tools/voice-changer",
      available: false,
      gradient: "from-purple-600 to-violet-500",
      Icon: Volume2,
    },
    {
      id: "face-swap",
      name: "AI Face Swap",
      subtitle: tx(t, "toolshub.tool.face-swap.subtitle", "Photos · Videos"),
      description: tx(
        t,
        "toolshub.tool.face-swap.description",
        "Swap faces in photos and videos with AI — perfect for thumbnails.",
      ),
      category: "ai",
      route: "/tools/face-swap",
      available: false,
      gradient: "from-violet-500 to-fuchsia-500",
      Icon: Users,
    },

    /* ── New Tools ────────────────────────────────────── */
    {
      id: "content-planner",
      name: "Content Planner",
      subtitle: "Calendar · Ideas · Templates",
      description:
        "Plan, schedule, and organize your content across all platforms with calendar, ideas bank, and templates.",
      category: "publishing",
      route: "/tools/content-planner",
      available: true,
      badge: "NEW",
      gradient: "from-emerald-500 to-indigo-500",
      Icon: Calendar,
    },
    {
      id: "multi-publisher",
      name: tx(t, "toolshub.tool.multi-publisher.name", "Multi-Publisher"),
      subtitle: tx(t, "toolshub.tool.multi-publisher.subtitle", "YT · TT · IG · X"),
      description: tx(
        t,
        "toolshub.tool.multi-publisher.description",
        "Publish to 8+ platforms in one click with platform-specific optimizations.",
      ),
      category: "publishing",
      route: "/tools/multi-publisher",
      available: true,
      badge: "NEW",
      gradient: "from-indigo-500 to-pink-500",
      Icon: Send,
    },
    {
      id: "ai-video-generator",
      name: "AI Video Hub",
      subtitle: "Runway · Kling · Pika · Veo",
      description:
        "Explore AI video generation services — Runway ML, Kling AI, Pika, Luma, Google Veo 2 and more.",
      category: "ai",
      route: "/tools/ai-video-generator",
      available: true,
      badge: "NEW",
      gradient: "from-violet-500 to-rose-500",
      Icon: Compass,
    },

    /* ── Coming Soon ───────────────────────────────────── */
    {
      id: "scenario",
      name: tx(t, "toolshub.tool.scenario.name", "Scenario Generator"),
      subtitle: tx(t, "toolshub.tool.scenario.subtitle", "Hook · Story · CTA"),
      description: tx(
        t,
        "toolshub.tool.scenario.description",
        "Generate complete video scenarios with hook, body and call-to-action.",
      ),
      category: "creation",
      available: false,
      gradient: "from-violet-700 to-purple-500",
      Icon: FileText,
    },
    {
      id: "video-translator",
      name: "Video Translator",
      subtitle: "AI · Voice Cloning · 30+ Languages",
      description: "Translate videos to 30+ languages with AI voice cloning",
      category: "ai",
      route: "/tools/video-translator",
      available: true,
      badge: "NEW",
      gradient: "from-cyan-500 to-violet-500",
      Icon: Languages,
    },
    {
      id: "analytics",
      name: tx(t, "toolshub.tool.analytics.name", "Analytics"),
      subtitle: "YouTube · Data API",
      description: tx(
        t,
        "toolshub.tool.analytics.description",
        "Deep analytics — discover patterns in your top videos.",
      ),
      category: "optimization",
      available: false,
      gradient: "from-violet-500 to-indigo-400",
      Icon: TrendingUp,
    },
    {
      id: "scheduler",
      name: tx(t, "toolshub.tool.scheduler.name", "Scheduler"),
      subtitle: tx(t, "toolshub.tool.scheduler.subtitle", "Calendar · Auto-publish"),
      description: tx(
        t,
        "toolshub.tool.scheduler.description",
        "Schedule posts across all platforms with smart timing.",
      ),
      category: "publishing",
      available: false,
      gradient: "from-indigo-500 to-violet-400",
      Icon: RefreshCw,
    },
  ];
}

function getCategories(t: (key: string) => string): {
  key: ToolCategory;
  label: string;
}[] {
  return [
    { key: "all", label: tx(t, "toolshub.cat.all", "All") },
    { key: "ai", label: tx(t, "toolshub.cat.ai", "AI") },
    { key: "video", label: tx(t, "toolshub.cat.video", "Video") },
    { key: "audio", label: tx(t, "toolshub.cat.audio", "Audio") },
    { key: "creation", label: tx(t, "toolshub.cat.creation", "Creation") },
    { key: "downloaders", label: tx(t, "toolshub.cat.downloaders", "Downloaders") },
    { key: "free", label: tx(t, "toolshub.cat.free", "Free") },
    { key: "optimization", label: tx(t, "toolshub.cat.optimization", "Optimization") },
    { key: "publishing", label: tx(t, "toolshub.cat.publishing", "Publishing") },
  ];
}

/* ═══════════════════════════════════════════════════════════════════
   BADGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

function BadgePill({ badge }: { badge: ToolBadge }) {
  const styles: Record<ToolBadge, string> = {
    PRO: "bg-gradient-to-r from-brand-500 to-violet-500 text-white",
    NEW: "bg-emerald-500 text-white",
    FREE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    BETA: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        styles[badge],
      )}
    >
      {badge}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TOOL CARD
   ═══════════════════════════════════════════════════════════════════ */

const ToolCard = memo(function ToolCard({ tool }: { tool: ToolDef }) {
  const t = useLocaleStore((s) => s.t);
  const Icon = tool.Icon;
  const inner = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        tool.available
          ? "border-border hover:border-brand-500/40 hover:shadow-lg hover:-translate-y-0.5"
          : "border-border/60 opacity-60 grayscale",
      )}
    >
      {/* Gradient header strip with icon */}
      <div
        className={cn(
          "relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br",
          tool.gradient,
        )}
      >
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
        {/* Big icon */}
        <div
          className={cn(
            "relative z-10 flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur transition-transform duration-300",
            tool.available && "group-hover:scale-110",
          )}
        >
          <Icon className="size-7 text-white" />
        </div>

        {/* Top-right corner: badge or coming-soon */}
        <div className="absolute top-3 right-3 z-10">
          {tool.available && tool.badge ? (
            <BadgePill badge={tool.badge} />
          ) : !tool.available ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur">
              <Lock className="size-3" />
              {tx(t, "toolshub.comingSoonLabel", "Soon")}
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold text-foreground">
            {tool.name}
          </h3>
          {tool.available && (
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-500" />
          )}
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-muted-foreground/80">
          {tool.subtitle}
        </div>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
        {tool.available ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-3" />
            {tx(t, "toolshub.availableLabel", "Available")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            <Lock className="size-3" />
            {tx(t, "toolshub.comingSoonSoon", "Coming soon")}
          </span>
        )}
        {tool.available && (
          <span className="text-[11px] font-semibold text-muted-foreground transition-colors group-hover:text-brand-500">
            {tx(t, "toolshub.openArrow", "Open →")}
          </span>
        )}
      </div>
    </div>
  );

  if (tool.available && tool.route) {
    return (
      <Link
        href={tool.route}
        prefetch
        className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"
        aria-label={`${tx(t, "toolshub.openTool", "Open")} ${tool.name}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl" aria-label={`${tool.name} — ${tx(t, "toolshub.comingSoon", "coming soon")}`}>
      {inner}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   CATEGORY PILL
   ═══════════════════════════════════════════════════════════════════ */

const CategoryPill = memo(function CategoryPill({
  label,
  active,
  count,
  onSelect,
}: {
  label: string;
  active: boolean;
  count: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2",
        active
          ? "bg-foreground text-background shadow-sm"
          : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px] font-mono",
          active ? "bg-background/20 text-background" : "bg-muted-foreground/15 text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN — TOOLS HUB
   ═══════════════════════════════════════════════════════════════════ */

export function ToolsHub() {
  const t = useLocaleStore((s) => s.t);
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ToolCategory>("all");

  const TOOLS = useMemo(() => getTools(t), [t]);
  const CATEGORIES = useMemo(() => getCategories(t), [t]);

  const counts = useMemo(() => {
    const c: Record<ToolCategory, number> = {
      all: TOOLS.length,
      ai: 0,
      video: 0,
      audio: 0,
      creation: 0,
      downloaders: 0,
      free: 0,
      optimization: 0,
      publishing: 0,
    };
    for (const tool of TOOLS) c[tool.category]++;
    return c;
  }, [TOOLS]);

  const filtered = useMemo(() => {
    let list = TOOLS;
    if (category !== "all") list = list.filter((tt) => tt.category === category);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (tt) =>
          tt.name.toLowerCase().includes(q) ||
          tt.description.toLowerCase().includes(q) ||
          tt.subtitle.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) =>
      a.available === b.available ? 0 : a.available ? -1 : 1,
    );
  }, [TOOLS, search, category]);

  const handleSetCategory = useCallback((key: ToolCategory) => {
    setCategory(key);
  }, []);

  const availableCount = useMemo(() => TOOLS.filter((tt) => tt.available).length, [TOOLS]);
  const comingSoonCount = useMemo(() => TOOLS.filter((tt) => !tt.available).length, [TOOLS]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="pt-8 pb-6 text-center sm:pt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3 text-brand-500" />
          {tx(t, "toolshub.eyebrow", "TubeForge Studio")}
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {tx(t, "toolshub.title", "Every tool a creator needs")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] text-muted-foreground sm:text-base">
          {tx(
            t,
            "toolshub.subtitle",
            "From script to thumbnail to upload — one place for the entire YouTube workflow.",
          )}
        </p>
      </section>

      {/* ── Search + counters ───────────────────────────── */}
      <section className="mx-auto max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx(t, "toolshub.searchPlaceholder", "Search tools…")}
            className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-12 text-sm text-foreground shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                searchRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              aria-label={tx(t, "common.clear", "Clear")}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {availableCount}
          </span>
          <span>{tx(t, "toolshub.available", "available")}</span>
          <span className="mx-1 text-border">•</span>
          <span className="inline-flex items-center gap-1 font-mono font-semibold text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            {comingSoonCount}
          </span>
          <span>{tx(t, "toolshub.comingSoon", "coming soon")}</span>
        </div>
      </section>

      {/* ── Category pills ──────────────────────────────── */}
      <section className="mt-6 -mx-4 sm:mx-0">
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 sm:flex-wrap sm:justify-center sm:px-0 sm:overflow-visible scrollbar-none">
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.key}
              label={cat.label}
              active={category === cat.key}
              count={counts[cat.key] ?? 0}
              onSelect={() => handleSetCategory(cat.key)}
            />
          ))}
        </div>
      </section>

      {/* ── Tools grid ──────────────────────────────────── */}
      <section className="mt-8 pb-16">
        {filtered.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <Search className="mx-auto size-8 text-muted-foreground/50" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              {tx(t, "toolshub.nothingFound", "No tools found")}
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {tx(t, "toolshub.tryDifferent", "Try a different search or category.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
