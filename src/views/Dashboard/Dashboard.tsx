"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useThemeStore } from "@/stores/useThemeStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorFallback } from "@/components/ui/ErrorFallback";
import { toast } from "@/stores/useNotificationStore";
import { getRecentActivity, type ActivityEntry } from "@/lib/activity-log";
import { ChannelAnalytics } from "./ChannelAnalytics";
import { DashboardUpgradeModal } from "@/components/ui/DashboardUpgradeModal";
import { cn } from "@/lib/utils";
import {
  Eye,
  Users,
  FolderOpen,
  Sparkles,
  Wand2,
  Video,
  Search,
  Calendar,
  Image as ImageIcon,
  ArrowRight,
  PlayCircle as Youtube,
  Clock,
  Zap,
  ChevronRight,
} from "lucide-react";


/** t with fallback: returns fallback if translation key is missing (returns key itself). */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ───────── Constants ───────── */

const PLAN_LIMITS = {
  FREE: { projects: 3, ai: 3 },
  PRO: { projects: 25, ai: 100 },
  STUDIO: { projects: Infinity, ai: Infinity },
} as const;

interface FeatureCard {
  key: string;
  href: string;
  titleKey: string;
  descKey: string;
  descFallback: string;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
  requiresYoutube?: boolean;
}

const FEATURES: FeatureCard[] = [
  {
    key: "aiThumbnails",
    href: "/ai-thumbnails",
    titleKey: "dashboard.tool.aiThumbnails",
    descKey: "dashboard.tool.aiThumbnailsDesc",
    descFallback: "Create viral YouTube thumbnails with AI",
    icon: <Sparkles className="size-5" />,
    gradient: "from-indigo-500 to-violet-500",
    badge: "NEW",
  },
  {
    key: "videoEditor",
    href: "/editor",
    titleKey: "dashboard.tool.videoEditor",
    descKey: "dashboard.tool.videoEditorDesc",
    descFallback: "AI-powered video creation",
    icon: <Video className="size-5" />,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    key: "seoOptimizer",
    href: "/preview?tab=seo",
    titleKey: "dashboard.tool.seoOptimizer",
    descKey: "dashboard.tool.seoOptimizerDesc",
    descFallback: "Optimize titles, tags, and descriptions",
    icon: <Search className="size-5" />,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    key: "contentPlanner",
    href: "/preview?tab=planner",
    titleKey: "dashboard.tool.contentPlanner",
    descKey: "dashboard.tool.contentPlannerDesc",
    descFallback: "Schedule and plan your content",
    icon: <Calendar className="size-5" />,
    gradient: "from-orange-500 to-pink-500",
  },
  {
    key: "designStudio",
    href: "/thumbnails",
    titleKey: "dashboard.tool.designStudio",
    descKey: "dashboard.tool.designStudioDesc",
    descFallback: "Canvas editor for graphics",
    icon: <ImageIcon className="size-5" />,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    key: "keywords",
    href: "/keywords",
    titleKey: "nav.keywords",
    descKey: "dashboard.tool.keywordsDesc",
    descFallback: "Discover trending search terms",
    icon: <Wand2 className="size-5" />,
    gradient: "from-violet-500 to-fuchsia-500",
  },
];

/* ───────── Helpers ───────── */

function formatNumber(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(iso: number | string, t: (k: string) => string): string {
  const ts = typeof iso === "number" ? iso : new Date(iso).getTime();
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}${tx(t, "time.dShort", "d")}`;
  if (h > 0) return `${h}${tx(t, "time.hShort", "h")}`;
  if (m > 0) return `${m}${tx(t, "time.mShort", "m")}`;
  return tx(t, "time.justNow", "now");
}

/* ───────── Stat Tile ───────── */

interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  loading?: boolean;
  href?: string;
}

function StatTile({ label, value, hint, icon, loading, href }: StatTileProps) {
  const inner = (
    <div className="group relative rounded-2xl bg-card border border-border p-4 sm:p-5 transition-all hover:border-brand-500/40 hover:shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-muted-foreground/60 group-hover:text-brand-500 transition-colors">
          {icon}
        </span>
      </div>
      {loading ? (
        <Skeleton width={80} height={32} />
      ) : (
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-foreground">
          {value}
        </div>
      )}
      {hint && !loading && (
        <div className="text-[11px] text-muted-foreground mt-1.5">{hint}</div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-2xl"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

/* ───────── Quick Action Card ───────── */

function QuickActionCard({
  feature,
  t,
  locked,
  connectLabel,
  onConnect,
}: {
  feature: FeatureCard;
  t: (k: string) => string;
  locked?: boolean;
  connectLabel: string;
  onConnect: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (locked) {
      e.preventDefault();
      onConnect();
    }
  };

  return (
    <Link
      href={locked ? "#" : feature.href}
      onClick={handleClick}
      className={cn(
        "group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200",
        "hover:border-brand-500/40 hover:-translate-y-0.5 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      )}
    >
      <div className={cn("h-20 sm:h-24 bg-gradient-to-br relative", feature.gradient)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-1.5">
          {feature.badge && (
            <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-white text-black">
              {feature.badge}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-4 size-9 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
          {feature.icon}
        </div>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white px-3 py-1.5 rounded-md bg-black/50">
              🔒 {connectLabel}
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {t(feature.titleKey)}
          </h3>
          <ArrowRight className="size-4 text-muted-foreground group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {tx(t, feature.descKey, feature.descFallback)}
        </p>
      </div>
    </Link>
  );
}

/* ───────── Compact Connect Banner ───────── */

function ConnectBanner({
  onConnect,
  t,
}: {
  onConnect: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-500/10 via-card to-card border border-brand-500/20 p-5 sm:p-6 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
        <div className="size-12 sm:size-14 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-500 shrink-0">
          <Youtube className="size-7" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {tx(t, "dashboard.connectChannel.title", "Connect your YouTube channel")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            {tx(t, "dashboard.connectChannel.desc", "Unlock channel analytics, smart content planning, and personalized AI recommendations.")}
          </p>
        </div>
        <button
          onClick={onConnect}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
            <path
              d="M16.51 8.18a8.65 8.65 0 0 0-.13-1.51H8.86v2.87h4.3a3.7 3.7 0 0 1-1.6 2.42v2.01h2.59a7.84 7.84 0 0 0 2.36-5.79z"
              fill="#4285F4"
            />
            <path
              d="M8.86 16.5a7.66 7.66 0 0 0 5.3-1.93l-2.59-2.01a4.86 4.86 0 0 1-7.22-2.55h-2.7v2.07A8.49 8.49 0 0 0 8.86 16.5z"
              fill="#34A853"
            />
            <path
              d="M4.35 10.01a4.95 4.95 0 0 1 0-3.02V4.93h-2.7a8.49 8.49 0 0 0 0 7.15l2.7-2.07z"
              fill="#FBBC05"
            />
            <path
              d="M8.86 4.04a4.6 4.6 0 0 1 3.27 1.28l2.3-2.3A8.18 8.18 0 0 0 8.86.5a8.49 8.49 0 0 0-7.21 4.43l2.7 2.07a4.86 4.86 0 0 1 4.51-2.96z"
              fill="#EA4335"
            />
          </svg>
          {tx(t, "dashboard.locked.connect", "Connect channel")}
        </button>
      </div>
    </div>
  );
}

/* ───────── Onboarding Steps ───────── */

function OnboardingSteps({
  onConnect,
  isConnected,
  t,
}: {
  onConnect: () => void;
  isConnected: boolean;
  t: (k: string) => string;
}) {
  const steps: Array<{
    id: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
    done?: boolean;
    action: { label: string; href?: string; onClick?: () => void };
  }> = [
    {
      id: "connect",
      title: tx(t, "dashboard.onboarding.connect", "Connect your YouTube channel"),
      desc:
        tx(t, "dashboard.onboarding.connectDesc", "Pull in real channel stats and unlock personalized AI"),
      icon: <Youtube className="size-5" />,
      done: isConnected,
      action: { label: tx(t, "dashboard.locked.connect", "Connect"), onClick: onConnect },
    },
    {
      id: "thumbnail",
      title: tx(t, "dashboard.onboarding.thumbnail", "Generate your first thumbnail"),
      desc:
        tx(t, "dashboard.onboarding.thumbnailDesc", "Try the AI-powered thumbnail generator. 3 free per month."),
      icon: <Sparkles className="size-5" />,
      action: { label: tx(t, "dashboard.onboarding.try", "Try it"), href: "/ai-thumbnails" },
    },
    {
      id: "explore",
      title: tx(t, "dashboard.onboarding.explore", "Explore all tools"),
      desc:
        tx(t, "dashboard.onboarding.exploreDesc", "SEO optimizer, content planner, design studio, keyword finder"),
      icon: <Zap className="size-5" />,
      action: { label: tx(t, "dashboard.onboarding.browse", "Browse"), href: "/tools" },
    },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground mb-4">
        {tx(t, "dashboard.onboarding.title", "Get started in 3 steps")}
      </h2>
      <div className="grid gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start sm:items-center gap-4 p-4 rounded-xl border bg-card transition-colors",
              step.done
                ? "border-emerald-500/25 opacity-70"
                : "border-border hover:border-brand-500/30"
            )}
          >
            <div
              className={cn(
                "size-9 rounded-lg flex items-center justify-center shrink-0",
                step.done
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-brand-500/10 text-brand-500"
              )}
            >
              {step.done ? "✓" : step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{step.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {step.desc}
              </div>
            </div>
            {!step.done &&
              (step.action.href ? (
                <Link
                  href={step.action.href}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-card hover:bg-muted text-foreground text-xs font-semibold border border-border transition-colors whitespace-nowrap"
                >
                  {step.action.label} <ChevronRight className="size-3" />
                </Link>
              ) : (
                <button
                  onClick={step.action.onClick}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {step.action.label} <ChevronRight className="size-3" />
                </button>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── Recent Activity ───────── */

function RecentActivity({
  entries,
  t,
}: {
  entries: ActivityEntry[];
  t: (k: string) => string;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          {tx(t, "dashboard.recentHistory", "Recent activity")}
        </h2>
        <Link
          href="/preview"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          {tx(t, "dashboard.seeAll", "See all")} <ChevronRight className="size-3" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {entries.slice(0, 6).map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-brand-500/30 transition-colors"
          >
            <div className="size-9 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {activity.label || tx(t, "dashboard.activity.generic", "Action")}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="size-3" />
                {timeAgo(activity.timestamp, t)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── Main Dashboard Component ───────── */

export function Dashboard() {
  const t = useLocaleStore((s) => s.t);

  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);
  useEffect(() => {
    setRecentActivities(getRecentActivity(6));
  }, []);

  const profile = trpc.user.getProfile.useQuery();
  const profileChannels = profile.data?.channels ?? [];

  const channelsQuery = trpc.youtube.getChannels.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled: profileChannels.length > 0,
  });

  const apiChannels = channelsQuery.data ?? [];
  const isConnected =
    profileChannels.length > 0 || (channelsQuery.isSuccess && apiChannels.length > 0);
  const isCheckingConnection = profile.isLoading;

  const handleConnect = useCallback(() => {
    signIn("google", { callbackUrl: "/dashboard" });
  }, []);

  const initCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("initCheckout");
    if (plan === "PRO" || plan === "STUDIO") {
      window.history.replaceState({}, "", "/dashboard");
      initCheckout.mutate({ plan });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      toast.success(tx(t, "billing.upgradeSuccess", "Upgraded successfully"));
      window.history.replaceState({}, "", "/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (profile.isError) {
    const err = profile.error;
    return (
      <ErrorFallback
        error={
          err instanceof Error
            ? err
            : new Error((err as { message?: string })?.message ?? String(err))
        }
        reset={() => profile.refetch()}
      />
    );
  }

  const user = profile.data;
  const plan = (user?.plan ?? "FREE") as keyof typeof PLAN_LIMITS;
  const planLimits = PLAN_LIMITS[plan];
  const projectCount = user?._count?.projects ?? 0;
  const aiUsage = user?.aiUsage ?? 0;
  const planLabel =
    ({
      FREE: t("common.free"),
      PRO: t("common.pro"),
      STUDIO: t("common.studio"),
    } as Record<string, string>)[plan] ?? plan;

  const channel = profileChannels[0] ?? apiChannels[0];
  const subscribers = channel?.subscribers ?? 0;
  const totalViews = (channel as { totalViews?: number } | undefined)?.totalViews ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-12">
      {/* Hero */}
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
            {profile.isLoading ? (
              <Skeleton width={260} height={32} />
            ) : (
              <>
                {tx(t, "dashboard.welcomeBack", "Welcome back")}
                {user?.name ? `, ${user.name.split(" ")[0]}` : ""}{" "}
                <span className="inline-block">👋</span>
              </>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.isLoading ? (
              <Skeleton width={200} height={14} />
            ) : isConnected ? (
              tx(t, "dashboard.heroConnectedSub", "Here's what's happening with your channel")
            ) : (
              tx(t, "dashboard.heroSub", "Let's grow your channel today")
            )}
          </p>
        </div>
        {!profile.isLoading && (
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                plan === "STUDIO" && "bg-violet-500/15 text-violet-400",
                plan === "PRO" && "bg-brand-500/15 text-brand-500",
                plan === "FREE" && "bg-card border border-border text-muted-foreground"
              )}
            >
              {planLabel}
            </span>
            {plan === "FREE" && (
              <Link
                href="/billing"
                className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
              >
                {tx(t, "usage.upgradePlan", "Upgrade")}
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatTile
          label={tx(t, "dashboard.stat.subscribers", "Subscribers")}
          value={isConnected ? formatNumber(subscribers) : "—"}
          hint={
            isConnected
              ? channel?.title
              : tx(t, "dashboard.stat.connectToSee", "Connect channel")
          }
          icon={<Users className="size-4" />}
          loading={isCheckingConnection}
        />
        <StatTile
          label={tx(t, "dashboard.stat.totalViews", "Total views")}
          value={isConnected && totalViews > 0 ? formatNumber(totalViews) : "—"}
          hint={
            isConnected
              ? tx(t, "dashboard.stat.allTime", "All time")
              : tx(t, "dashboard.stat.connectToSee", "Connect channel")
          }
          icon={<Eye className="size-4" />}
          loading={isCheckingConnection}
        />
        <StatTile
          label={tx(t, "dashboard.stat.projects", "Projects")}
          value={formatNumber(projectCount)}
          hint={
            planLimits.projects === Infinity
              ? tx(t, "dashboard.stat.unlimited", "Unlimited")
              : `${projectCount}/${planLimits.projects} ${
                  tx(t, "dashboard.stat.used", "used")
                }`
          }
          icon={<FolderOpen className="size-4" />}
          loading={profile.isLoading}
          href="/preview"
        />
        <StatTile
          label={tx(t, "dashboard.stat.aiGenerations", "AI generations")}
          value={formatNumber(aiUsage)}
          hint={
            planLimits.ai === Infinity
              ? tx(t, "dashboard.stat.unlimited", "Unlimited")
              : `${aiUsage}/${planLimits.ai} ${
                  tx(t, "dashboard.stat.thisMonth", "this month")
                }`
          }
          icon={<Sparkles className="size-4" />}
          loading={profile.isLoading}
          href="/ai-thumbnails"
        />
      </section>

      {/* Connect banner OR Channel analytics */}
      {isCheckingConnection ? (
        <Skeleton
          width="100%"
          height={120}
          style={{ borderRadius: 16, marginBottom: 24 }}
        />
      ) : isConnected ? (
        <div className="mb-6 sm:mb-8 rounded-2xl border border-border bg-card overflow-hidden">
          <ChannelAnalytics />
        </div>
      ) : (
        <ConnectBanner onConnect={handleConnect} t={t} />
      )}

      {/* Quick Actions */}
      <section className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              {tx(t, "dashboard.yourTools", "Your tools")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tx(t, "dashboard.yourToolsDesc", "All the tools you need to grow your channel")}
            </p>
          </div>
          <Link
            href="/tools"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 shrink-0"
          >
            {tx(t, "dashboard.seeAll", "See all")} <ChevronRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map((f) => (
            <QuickActionCard
              key={f.key}
              feature={f}
              t={t}
              locked={f.requiresYoutube && !isConnected && !isCheckingConnection}
              connectLabel={tx(t, "dashboard.locked.connect", "Connect")}
              onConnect={handleConnect}
            />
          ))}
        </div>
      </section>

      {/* Recent activity OR onboarding */}
      {recentActivities.length > 0 ? (
        <RecentActivity entries={recentActivities} t={t} />
      ) : (
        <OnboardingSteps onConnect={handleConnect} isConnected={isConnected} t={t} />
      )}

      {user && <DashboardUpgradeModal userPlan={user.plan} />}
    </div>
  );
}
