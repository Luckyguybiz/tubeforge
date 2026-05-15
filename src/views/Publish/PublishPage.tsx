"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  PlayCircle as YoutubeIcon,
  Sparkles,
  Globe,
  Link2,
  Lock,
  Calendar,
  Clock,
  Upload,
  Image as ImageIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Rocket,
  ExternalLink,
  RefreshCw,
  Eye,
  Type as TypeIcon,
  ArrowRight,
  X,
} from "lucide-react";

/* ── i18n with fallback (Dashboard convention) ──────────────────────── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── Types ──────────────────────────────────────────────────────────── */
type PrivacyStatus = "public" | "unlisted" | "private";
type PublishState = "idle" | "uploading" | "publishing" | "success" | "error";

interface PrivacyOption {
  value: PrivacyStatus;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function getPrivacyOptions(t: (k: string) => string): PrivacyOption[] {
  return [
    {
      value: "public",
      label: tx(t, "publish.privacy.public", "Public"),
      desc: tx(t, "publish.privacy.publicDesc", "Anyone can search and watch"),
      Icon: Globe,
      color: "text-emerald-500",
    },
    {
      value: "unlisted",
      label: tx(t, "publish.privacy.unlisted", "Unlisted"),
      desc: tx(t, "publish.privacy.unlistedDesc", "Only people with the link"),
      Icon: Link2,
      color: "text-amber-500",
    },
    {
      value: "private",
      label: tx(t, "publish.privacy.private", "Private"),
      desc: tx(t, "publish.privacy.privateDesc", "Only you can see it"),
      Icon: Lock,
      color: "text-rose-500",
    },
  ];
}

/* ── Local published-history (last 50, localStorage) ─────────────────── */
interface HistoryEntry {
  title: string;
  url: string;
  publishedAt: string;
  scheduled?: boolean;
  thumbnailUrl?: string;
}

function savePublishHistory(entry: HistoryEntry) {
  try {
    const key = "tf-publish-history";
    const raw = localStorage.getItem(key);
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* localStorage unavailable */
  }
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════ */

export function PublishPage() {
  const t = useLocaleStore((s) => s.t);

  /* ── Form state ─────────────────────────────────────────────────── */
  const [channelId, setChannelId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyStatus>("private");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [madeForKids, setMadeForKids] = useState(false);

  /* ── Submission state ───────────────────────────────────────────── */
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  /* ── Data ───────────────────────────────────────────────────────── */
  const profile = trpc.user.getProfile.useQuery();
  const channels = profile.data?.channels ?? [];
  const hasYouTubeScopes = profile.data?.hasYouTubeScopes ?? false;
  const syncChannels = trpc.youtube.getChannels.useQuery(undefined, {
    enabled: false,
    retry: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Phase 2: create UploadJob in DB. Worker /api/cron/youtube-upload-processor
  // picks it up within 60s, performs server-side PUT to YouTube, delivers
  // webhooks on terminal status.
  const createJob = trpc.uploadJobs.create.useMutation();

  /* Default channel when channels load */
  useEffect(() => {
    if (channels.length > 0 && !channelId) {
      setChannelId(channels[0].id);
    }
  }, [channels, channelId]);

  /* Set sensible default schedule (now+1h) when toggle flips on */
  useEffect(() => {
    if (scheduleEnabled && !scheduleDate) {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      const yyyy = future.getFullYear();
      const mm = String(future.getMonth() + 1).padStart(2, "0");
      const dd = String(future.getDate()).padStart(2, "0");
      const hh = String(future.getHours()).padStart(2, "0");
      const mins = String(future.getMinutes()).padStart(2, "0");
      setScheduleDate(`${yyyy}-${mm}-${dd}`);
      setScheduleTime(`${hh}:${mins}`);
    }
  }, [scheduleEnabled, scheduleDate]);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === channelId) ?? null,
    [channels, channelId],
  );

  /* ── Connect / sync flow ────────────────────────────────────────── */
  const handleConnect = useCallback(async () => {
    if (!hasYouTubeScopes) {
      await signIn("google", { callbackUrl: "/publish" });
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncChannels.refetch();
      if (res.error) {
        toast.error(res.error.message || "Sync failed");
      } else {
        await profile.refetch();
        toast.success("Channels synced");
      }
    } finally {
      setIsSyncing(false);
    }
  }, [hasYouTubeScopes, syncChannels, profile]);

  /* ── Tags ───────────────────────────────────────────────────────── */
  const addTag = useCallback(() => {
    const v = tagInput.trim().toLowerCase();
    if (!v || tags.includes(v) || tags.length >= 30) return;
    setTags((prev) => [...prev, v]);
    setTagInput("");
  }, [tagInput, tags]);
  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  /* ── Pre-flight checks ──────────────────────────────────────────── */
  type CheckSeverity = "ok" | "warn" | "blocker";
  interface Check {
    label: string;
    severity: CheckSeverity;
  }
  const checks: Check[] = useMemo(() => {
    const arr: Check[] = [];
    if (!channelId) {
      arr.push({ label: tx(t, "publish.check.noChannel", "Connect a YouTube channel"), severity: "blocker" });
    } else {
      arr.push({ label: tx(t, "publish.check.channel", "YouTube channel ready"), severity: "ok" });
    }
    if (!videoUrl.trim()) {
      arr.push({ label: tx(t, "publish.check.noVideo", "Provide a video URL"), severity: "blocker" });
    } else {
      try {
        new URL(videoUrl);
        arr.push({ label: tx(t, "publish.check.videoOk", "Video URL valid"), severity: "ok" });
      } catch {
        arr.push({ label: tx(t, "publish.check.videoInvalid", "Video URL is malformed"), severity: "blocker" });
      }
    }
    if (!title.trim()) {
      arr.push({ label: tx(t, "publish.check.noTitle", "Add a title"), severity: "blocker" });
    } else if (title.length > 100) {
      arr.push({ label: tx(t, "publish.check.titleTooLong", "Title exceeds 100 chars"), severity: "blocker" });
    } else {
      arr.push({ label: tx(t, "publish.check.titleOk", `Title (${title.length}/100)`), severity: "ok" });
    }
    if (description.length > 5000) {
      arr.push({ label: tx(t, "publish.check.descTooLong", "Description exceeds 5000 chars"), severity: "blocker" });
    }
    if (tags.length > 30) {
      arr.push({ label: tx(t, "publish.check.tagsTooMany", "More than 30 tags"), severity: "blocker" });
    } else if (tags.length === 0) {
      arr.push({ label: tx(t, "publish.check.noTags", "Tags help discoverability"), severity: "warn" });
    }
    if (scheduleEnabled) {
      if (!scheduleDate || !scheduleTime) {
        arr.push({ label: tx(t, "publish.check.scheduleIncomplete", "Pick a schedule date and time"), severity: "blocker" });
      } else {
        const dt = new Date(`${scheduleDate}T${scheduleTime}:00`);
        if (Number.isNaN(dt.getTime()) || dt.getTime() <= Date.now()) {
          arr.push({ label: tx(t, "publish.check.scheduleInPast", "Schedule time must be in the future"), severity: "blocker" });
        } else {
          arr.push({ label: tx(t, "publish.check.scheduleOk", `Will publish at ${dt.toLocaleString()}`), severity: "ok" });
        }
      }
    }
    return arr;
  }, [channelId, videoUrl, title, description, tags, scheduleEnabled, scheduleDate, scheduleTime, t]);

  const blockers = checks.filter((c) => c.severity === "blocker");
  const canPublish = blockers.length === 0 && publishState === "idle";

  /* ── Publish ────────────────────────────────────────────────────── */
  const handlePublish = useCallback(async () => {
    if (!canPublish || !selectedChannel) return;

    const publishAt = scheduleEnabled && scheduleDate && scheduleTime
      ? new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
      : undefined;

    setPublishState("uploading");
    try {
      const res = await createJob.mutateAsync({
        channelId: selectedChannel.id,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        privacyStatus: privacy,
        scheduledAt: publishAt,
      });

      // Job is queued; worker will fetch + PUT to YouTube within ~60s.
      // Cache an entry for the local /publish/jobs strip (legacy
      // localStorage path — Phase 2.5 swaps it for trpc.uploadJobs.list,
      // but keeping savePublishHistory write is harmless and gives
      // logged-out fallback).
      setPublishState("success");
      const channelPageUrl = selectedChannel
        ? `https://youtube.com/channel/${selectedChannel.id}`
        : null;
      setPublishedUrl(channelPageUrl);
      savePublishHistory({
        title: title.trim(),
        url: channelPageUrl ?? "",
        publishedAt: new Date().toISOString(),
        scheduled: !!publishAt,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      });
      toast.success(
        publishAt
          ? tx(t, "publish.toast.scheduled", `Scheduled — job ${res.jobId.slice(0, 8)}…`)
          : tx(t, "publish.toast.queued", `Queued — job ${res.jobId.slice(0, 8)}…`),
      );
    } catch (e) {
      setPublishState("error");
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || tx(t, "publish.toast.error", "Upload failed"));
      setTimeout(() => setPublishState("idle"), 4000);
    }
  }, [
    canPublish,
    selectedChannel,
    scheduleEnabled,
    scheduleDate,
    scheduleTime,
    createJob,
    title,
    description,
    tags,
    videoUrl,
    thumbnailUrl,
    privacy,
    t,
  ]);

  const handleReset = useCallback(() => {
    setTitle("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setVideoUrl("");
    setThumbnailUrl("");
    setPrivacy("private");
    setScheduleEnabled(false);
    setScheduleDate("");
    setScheduleTime("");
    setMadeForKids(false);
    setPublishState("idle");
    setPublishedUrl(null);
  }, []);

  /* ════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */

  // Initial loading: show skeleton form so user sees structure, not empty screen
  if (profile.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-6 pb-4 sm:pt-8">
          <div className="flex items-center gap-3">
            <Skeleton width={44} height={44} style={{ borderRadius: 16 }} />
            <div className="flex-1 max-w-md space-y-2">
              <Skeleton width="60%" height={28} />
              <Skeleton width="80%" height={14} />
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={180} style={{ borderRadius: 16 }} />
            ))}
          </div>
          <Skeleton width="100%" height={400} style={{ borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  // No channels yet → show "Connect" hero
  if (channels.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="text-center">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/20">
            <Rocket className="size-7" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {tx(t, "publish.connectTitle", "Connect a YouTube channel to publish")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted-foreground">
            {tx(
              t,
              "publish.connectDesc",
              "TubeForge uploads to YouTube on your behalf — secured by Google OAuth, your tokens never leave our servers.",
            )}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <YoutubeIcon className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-foreground">
                {tx(t, "publish.connectStep", "One step to get started")}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {hasYouTubeScopes
                  ? tx(t, "publish.connectSync", "You've already granted access — sync your channels from YouTube to start publishing.")
                  : tx(t, "publish.connectGrant", "Sign in with Google and grant access to youtube.upload + youtube.readonly scopes.")}
              </p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={isSyncing}
            className={cn(
              "mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-[15px] font-bold text-white shadow-md shadow-brand-500/20",
              isSyncing ? "opacity-60 cursor-wait" : "hover:scale-[1.01] transition-transform",
            )}
          >
            {isSyncing ? (
              <Loader2 className="size-5 animate-spin" />
            ) : hasYouTubeScopes ? (
              <RefreshCw className="size-5" />
            ) : (
              <Link2 className="size-5" />
            )}
            {isSyncing
              ? tx(t, "publish.syncing", "Syncing channels…")
              : hasYouTubeScopes
                ? tx(t, "publish.sync", "Sync from YouTube")
                : tx(t, "publish.connect", "Connect YouTube channel")}
          </button>
        </div>

        <div className="mt-6 text-center text-[12px] text-muted-foreground">
          {tx(t, "publish.connectAltDesc", "Already connected on another device?")}{" "}
          <Link href="/settings#channels" className="font-semibold text-brand-500 hover:underline">
            {tx(t, "publish.openSettings", "Manage in Settings")}
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main publishing UI ───────────────────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero strip */}
      <header className="pt-6 pb-4 sm:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/20">
              <Rocket className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {tx(t, "publish.title", "Publish video")}
              </h1>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {tx(t, "publish.subtitle", "Upload to YouTube — schedule, set privacy, optimize metadata.")}
              </p>
            </div>
          </div>
          <Link
            href="/publish/jobs"
            prefetch
            className="inline-flex h-10 items-center gap-1.5 self-start rounded-xl border border-border bg-card px-4 text-[13px] font-semibold text-foreground transition-colors hover:border-brand-500/40 hover:text-brand-500"
          >
            <Clock className="size-4" />
            {tx(t, "publish.viewJobs", "Publishing jobs")}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Channel picker pills (only if multiple channels) */}
      {channels.length > 1 && (
        <ChannelPicker
          channels={channels}
          selectedId={channelId}
          onSelect={setChannelId}
          t={t}
        />
      )}

      {/* 2-pane content */}
      <div className="grid gap-6 pb-16 lg:grid-cols-[1fr_400px]">
        {/* LEFT: Form */}
        <div className="space-y-5">
          {/* Step 1: Source */}
          <SectionCard
            stepNum={1}
            icon={<Upload className="size-4" />}
            title={tx(t, "publish.step.source", "Source")}
            description={tx(t, "publish.step.sourceDesc", "Paste a direct video URL (MP4/MOV/WebM)")}
          >
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://cdn.example.com/video.mp4"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 font-mono text-[13px] text-foreground outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              {tx(
                t,
                "publish.sourceHint",
                "Direct video URL accessible publicly (CDN, S3, R2). Drag-drop upload coming Phase 2.",
              )}
            </p>
          </SectionCard>

          {/* Step 2: Metadata */}
          <SectionCard
            stepNum={2}
            icon={<TypeIcon className="size-4" />}
            title={tx(t, "publish.step.metadata", "Metadata")}
            description={tx(t, "publish.step.metadataDesc", "Title, description, tags, optional thumbnail")}
          >
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{tx(t, "publish.field.title", "Title")}</span>
                  <span className="font-mono">{title.length}/100</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  placeholder={tx(t, "publish.titlePlaceholder", "How I built a 6-figure YouTube channel in 2026")}
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[14px] font-medium text-foreground outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{tx(t, "publish.field.desc", "Description")}</span>
                  <span className="font-mono">{description.length}/5000</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                  placeholder={tx(t, "publish.descPlaceholder", "What's this video about? Add timestamps, links, hashtags.")}
                  rows={5}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-[13px] text-foreground outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{tx(t, "publish.field.tags", "Tags")}</span>
                  <span className="font-mono">{tags.length}/30</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-brand-500/40 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-500"
                    >
                      <Tag className="size-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 text-brand-500/70 hover:text-brand-500"
                        aria-label="Remove tag"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag();
                      } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
                        removeTag(tags[tags.length - 1]);
                      }
                    }}
                    placeholder={tags.length === 0 ? tx(t, "publish.tagsPlaceholder", "type tag and Enter…") : ""}
                    className="flex-1 min-w-[100px] bg-transparent py-1 text-[13px] outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Custom thumbnail */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {tx(t, "publish.field.thumbnail", "Custom thumbnail (optional)")}
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://cdn.example.com/thumb.jpg"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 font-mono text-[12px] text-foreground outline-none focus:border-brand-500/40"
                />
              </div>
            </div>
          </SectionCard>

          {/* Step 3: Audience & timing */}
          <SectionCard
            stepNum={3}
            icon={<Eye className="size-4" />}
            title={tx(t, "publish.step.audience", "Audience & timing")}
            description={tx(t, "publish.step.audienceDesc", "Privacy, schedule, kids audience compliance")}
          >
            {/* Privacy radio cards */}
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {tx(t, "publish.field.privacy", "Privacy")}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {getPrivacyOptions(t).map((opt) => {
                  const Icon = opt.Icon;
                  const selected = privacy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPrivacy(opt.value)}
                      className={cn(
                        "relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                        selected
                          ? "border-brand-500 bg-brand-500/5 shadow-sm shadow-brand-500/10"
                          : "border-border bg-background hover:border-brand-500/40",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={cn("size-4 shrink-0 mt-0.5", opt.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-foreground">{opt.label}</div>
                          <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{opt.desc}</div>
                        </div>
                      </div>
                      {selected && (
                        <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-brand-500 text-white">
                          <CheckCircle2 className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {tx(t, "publish.field.schedule", "Schedule")}
                </label>
                <button
                  onClick={() => setScheduleEnabled((v) => !v)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    scheduleEnabled ? "bg-brand-500" : "bg-muted",
                  )}
                  aria-pressed={scheduleEnabled}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                      scheduleEnabled ? "translate-x-4" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
              {scheduleEnabled && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Calendar className="mr-1 inline size-3" />
                      {tx(t, "publish.field.date", "Date")}
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 font-mono text-[13px] text-foreground outline-none focus:border-brand-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clock className="mr-1 inline size-3" />
                      {tx(t, "publish.field.time", "Time")}
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 font-mono text-[13px] text-foreground outline-none focus:border-brand-500/40"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Made for kids */}
            <label className="mt-5 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={madeForKids}
                onChange={(e) => setMadeForKids(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border bg-background accent-brand-500"
              />
              <div className="flex-1 text-[12px] leading-relaxed text-muted-foreground">
                {tx(
                  t,
                  "publish.kidsLabel",
                  "Made for kids — required by COPPA. Disables personalized ads & comments.",
                )}
              </div>
            </label>
          </SectionCard>

          {/* Publish CTA */}
          <div className="sticky bottom-4 z-10">
            <button
              onClick={handlePublish}
              disabled={!canPublish}
              className={cn(
                "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold text-white shadow-lg shadow-brand-500/30 transition-all",
                canPublish
                  ? "bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 hover:scale-[1.01]"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
                publishState !== "idle" && "cursor-wait",
              )}
            >
              {publishState === "uploading" || publishState === "publishing" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : publishState === "success" ? (
                <CheckCircle2 className="size-5" />
              ) : publishState === "error" ? (
                <AlertCircle className="size-5" />
              ) : (
                <Rocket className="size-5" />
              )}
              {publishState === "uploading" && tx(t, "publish.cta.uploading", "Uploading to YouTube…")}
              {publishState === "publishing" && tx(t, "publish.cta.publishing", "Publishing…")}
              {publishState === "success" && tx(t, "publish.cta.success", "Published!")}
              {publishState === "error" && tx(t, "publish.cta.error", "Try again")}
              {publishState === "idle" && (
                scheduleEnabled && scheduleDate && scheduleTime
                  ? tx(t, "publish.cta.schedule", "Schedule for ") + `${scheduleDate} ${scheduleTime}`
                  : tx(t, "publish.cta.now", "Publish now")
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Live preview + checks */}
        <aside className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <YouTubePreview
            thumbnailUrl={thumbnailUrl}
            videoUrl={videoUrl}
            title={title}
            description={description}
            tags={tags}
            channel={selectedChannel}
            t={t}
          />

          {/* Pre-flight checks */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3" />
              {tx(t, "publish.preflightTitle", "Pre-flight checks")}
            </h3>
            <ul className="space-y-1.5">
              {checks.map((check, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px]">
                  {check.severity === "ok" ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  ) : check.severity === "warn" ? (
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
                  )}
                  <span
                    className={cn(
                      "leading-snug",
                      check.severity === "blocker" ? "text-foreground font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Success state with YouTube link */}
          {publishState === "success" && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-foreground">
                    {scheduleEnabled
                      ? tx(t, "publish.success.scheduled", "Scheduled successfully")
                      : tx(t, "publish.success.published", "Upload queued")}
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {tx(
                      t,
                      "publish.success.desc",
                      "Track progress in Publishing jobs. YouTube takes 30-60 seconds to process the upload.",
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href="/publish/jobs"
                      prefetch
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-[12px] font-bold text-white hover:bg-brand-600"
                    >
                      <Clock className="size-3.5" />
                      {tx(t, "publish.success.viewJobs", "View jobs")}
                    </Link>
                    {publishedUrl && (
                      <a
                        href={publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-bold text-foreground hover:border-brand-500/40"
                        title={tx(t, "publish.success.openChannelHint", "Open your channel — the video appears after YouTube finishes processing")}
                      >
                        <ExternalLink className="size-3.5" />
                        {tx(t, "publish.success.openChannel", "Open my channel")}
                      </a>
                    )}
                    <button
                      onClick={handleReset}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-bold text-foreground hover:border-brand-500/40"
                    >
                      <Rocket className="size-3.5" />
                      {tx(t, "publish.success.another", "Publish another")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

function SectionCard({
  stepNum,
  icon,
  title,
  description,
  children,
}: {
  stepNum: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-foreground">
            <span className="font-mono text-[11px] text-muted-foreground">0{stepNum}</span>
            {title}
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ChannelPicker({
  channels,
  selectedId,
  onSelect,
  t,
}: {
  channels: { id: string; title: string; thumbnail: string | null; subscribers: number }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  t: (k: string) => string;
}) {
  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-3 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <YoutubeIcon className="size-3 text-red-500" />
        {tx(t, "publish.pickChannel", "Publish to channel")}
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {channels.map((ch) => {
          const selected = selectedId === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => onSelect(ch.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 transition-all",
                selected
                  ? "border-brand-500 bg-brand-500/5 shadow-sm shadow-brand-500/10"
                  : "border-border bg-background hover:border-brand-500/40",
              )}
            >
              {ch.thumbnail ? (
                <img
                  src={ch.thumbnail}
                  alt={ch.title}
                  className="size-8 shrink-0 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                  <YoutubeIcon className="size-4" />
                </div>
              )}
              <div className="text-left">
                <div className="text-[12px] font-bold text-foreground">{ch.title}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {ch.subscribers.toLocaleString()} subs
                </div>
              </div>
              {selected && <CheckCircle2 className="ml-1 size-4 text-brand-500" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function YouTubePreview({
  thumbnailUrl,
  videoUrl,
  title,
  description,
  tags,
  channel,
  t,
}: {
  thumbnailUrl: string;
  videoUrl: string;
  title: string;
  description: string;
  tags: string[];
  channel: { id: string; title: string; thumbnail: string | null; subscribers: number } | null;
  t: (k: string) => string;
}) {
  const previewThumb = thumbnailUrl || (videoUrl ? "" : "");
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Eye className="size-3" />
          {tx(t, "publish.previewTitle", "YouTube preview")}
        </h3>
      </div>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {previewThumb ? (
          <img src={previewThumb} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8 text-muted-foreground/30" />
            <span className="text-[11px]">
              {tx(t, "publish.previewNoThumb", "Add a thumbnail URL to preview")}
            </span>
          </div>
        )}
      </div>
      {/* Metadata block (YouTube watch page mock) */}
      <div className="px-4 py-3">
        <h4 className="line-clamp-2 text-[14px] font-bold leading-snug text-foreground">
          {title || (
            <span className="text-muted-foreground/60">
              {tx(t, "publish.previewNoTitle", "Your title will appear here")}
            </span>
          )}
        </h4>
        {channel && (
          <div className="mt-2.5 flex items-center gap-2">
            {channel.thumbnail ? (
              <img
                src={channel.thumbnail}
                alt={channel.title}
                className="size-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                <YoutubeIcon className="size-3.5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate text-[12px] font-semibold text-foreground">
                {channel.title}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {channel.subscribers.toLocaleString()} subscribers
              </div>
            </div>
          </div>
        )}
        {description && (
          <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 6 && (
              <span className="text-[10px] text-muted-foreground">+{tags.length - 6} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
