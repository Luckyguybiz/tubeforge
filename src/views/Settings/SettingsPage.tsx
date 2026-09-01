"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useThemeStore, type ThemeMode } from "@/stores/useThemeStore";
import { useLocaleStore, type Locale } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { getPlanLimits } from "@/lib/constants";
import {
  User,
  CreditCard,
  Bell,
  Palette,
  Plug,
  Shield,
  PlayCircle as YoutubeIcon,
  Check,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Camera,
  LogOut,
  Trash2,
  Download,
  RotateCcw,
  Mail,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Languages,
  Key,
  Zap,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Link2,
  Copy,
  Plus,
  X,
  Webhook,
  Send,
} from "lucide-react";

/* ── Translate-with-fallback (Dashboard convention) ── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── Tab definition ── */
type TabId = "profile" | "plan" | "channels" | "notifications" | "appearance" | "integrations" | "privacy";

interface TabDef {
  id: TabId;
  labelKey: string;
  fallback: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: "profile",       labelKey: "settings.tab.profile",       fallback: "Profile",       icon: <User className="size-4" /> },
  { id: "plan",          labelKey: "settings.tab.plan",          fallback: "Plan",          icon: <CreditCard className="size-4" /> },
  { id: "channels",      labelKey: "settings.tab.channels",      fallback: "Channels",      icon: <YoutubeIcon className="size-4" /> },
  { id: "notifications", labelKey: "settings.tab.notifications", fallback: "Notifications", icon: <Bell className="size-4" /> },
  { id: "appearance",    labelKey: "settings.tab.appearance",    fallback: "Appearance",    icon: <Palette className="size-4" /> },
  { id: "integrations",  labelKey: "settings.tab.integrations",  fallback: "Integrations",  icon: <Plug className="size-4" /> },
  { id: "privacy",       labelKey: "settings.tab.privacy",       fallback: "Privacy",       icon: <Shield className="size-4" /> },
];

const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: "en", label: "English",  flag: "🇬🇧" },
  { id: "ru", label: "Русский",  flag: "🇷🇺" },
  { id: "es", label: "Español",  flag: "🇪🇸" },
  { id: "kk", label: "Қазақша",  flag: "🇰🇿" },
];

/* ─────────────── Main ─────────────── */

export function SettingsPage() {
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  /* Sync with URL hash for deep-linking */
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === hash)) setActiveTab(hash as TabId);
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.id === h)) setActiveTab(h as TabId);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-12">
      {/* Hero header */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          {tx(t, "settings.title", "Settings")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tx(t, "settings.subtitle", "Manage your account, plan, and preferences")}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 lg:gap-8">
        {/* Tab nav (sidebar on desktop, top tabs on mobile) */}
        <nav className="md:sticky md:top-4 md:self-start">
          {/* Mobile horizontal scroll tabs — snap + edge-fade so the user
              sees there's more to scroll. h-10 touch-friendly. */}
          <div className="tf-snap-x tf-scrollbar-hidden tf-fade-edge-right -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:hidden">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.replaceState(null, "", `#${tab.id}`);
                }}
                aria-pressed={activeTab === tab.id}
                className={cn(
                  "tf-focusable inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border border-brand-500/40 bg-card text-foreground"
                    : "border border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.icon}
                {tx(t, tab.labelKey, tab.fallback)}
              </button>
            ))}
          </div>
          {/* Desktop vertical tabs */}
          <div className="hidden md:flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.replaceState(null, "", `#${tab.id}`);
                }}
                className={cn(
                  "group inline-flex items-center gap-2.5 h-10 px-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-card text-foreground border-l-2 border-brand-500 pl-2.5"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60 border-l-2 border-transparent pl-2.5",
                )}
              >
                <span className={cn("transition-colors", activeTab === tab.id ? "text-brand-500" : "text-muted-foreground/70 group-hover:text-foreground")}>
                  {tab.icon}
                </span>
                {tx(t, tab.labelKey, tab.fallback)}
              </button>
            ))}
            <Link
              href="/billing"
              className="inline-flex items-center justify-between gap-2 h-10 px-3 mt-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <ExternalLink className="size-4" />
                {tx(t, "settings.openBilling", "Open Billing")}
              </span>
              <ChevronRight className="size-3.5 opacity-50" />
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2.5 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors text-left"
            >
              <LogOut className="size-4" />
              {tx(t, "settings.signOut", "Sign out")}
            </button>
          </div>
        </nav>

        {/* Tab content */}
        <main className="min-w-0 space-y-6">
          {activeTab === "profile" && <ProfileTab session={session} t={t} />}
          {activeTab === "plan" && <PlanTab t={t} />}
          {activeTab === "channels" && <ChannelsTab t={t} />}
          {activeTab === "notifications" && <NotificationsTab t={t} />}
          {activeTab === "appearance" && <AppearanceTab t={t} />}
          {activeTab === "integrations" && <IntegrationsTab t={t} />}
          {activeTab === "privacy" && <PrivacyTab t={t} router={router} />}
        </main>
      </div>
    </div>
  );
}

/* ─────────────── PROFILE TAB ─────────────── */

function ProfileTab({ session, t }: { session: ReturnType<typeof useSession>["data"]; t: (k: string) => string }) {
  const profile = trpc.user.getProfile.useQuery();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile.data?.name) setName(profile.data.name);
  }, [profile.data?.name]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "settings.profile.saved", "Profile saved"));
      setEditing(false);
      profile.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const user = profile.data;
  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (profile.isLoading) {
    return <Skeleton width="100%" height={400} style={{ borderRadius: 16 }} />;
  }

  return (
    <SettingsCard
      icon={<User className="size-4" />}
      title={tx(t, "settings.profile", "Profile")}
      description={tx(t, "settings.profile.desc", "Your name and avatar shown across TubeForge")}
    >
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 sm:items-center">
        {/* Avatar */}
        <div className="relative shrink-0">
          {user?.image ? (
            <img
              src={user.image}
              alt={user?.name || "User"}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => (e.currentTarget.style.display = "none")}
              className="size-20 rounded-full object-cover ring-4 ring-border"
            />
          ) : (
            <div className="size-20 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-border">
              {initials}
            </div>
          )}
          <button
            type="button"
            className="absolute bottom-0 right-0 size-7 rounded-full bg-card border-2 border-background shadow-sm hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={tx(t, "settings.profile.changeAvatar", "Change avatar")}
            onClick={() => toast.info(tx(t, "settings.profile.uploadComingSoon", "Avatar upload coming soon"))}
          >
            <Camera className="size-3.5" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tx(t, "settings.profile.name", "Display name")}
            </label>
            {editing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 h-10 rounded-lg bg-card border border-border px-3 text-sm text-foreground focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                  placeholder={tx(t, "settings.profile.namePlaceholder", "Your name")}
                />
                <button
                  type="button"
                  onClick={() => updateProfile.mutate({ name })}
                  disabled={updateProfile.isPending || !name.trim()}
                  className="h-10 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                  {tx(t, "common.save", "Save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(user?.name || "");
                  }}
                  className="h-10 px-4 rounded-lg bg-muted hover:bg-card text-foreground text-sm font-semibold border border-border transition-colors"
                >
                  {tx(t, "common.cancel", "Cancel")}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 h-10 rounded-lg bg-card border border-border px-3">
                <span className="text-sm text-foreground truncate">
                  {user?.name || tx(t, "settings.profile.noName", "Not set")}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-400 transition-colors shrink-0"
                >
                  {tx(t, "common.edit", "Edit")}
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tx(t, "settings.profile.email", "Email")}
            </label>
            <div className="flex items-center justify-between gap-2 h-10 rounded-lg bg-muted/30 border border-border px-3 opacity-70">
              <span className="text-sm text-foreground truncate">{user?.email}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {tx(t, "settings.profile.verified", "Verified")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected accounts */}
      <div className="mt-6 pt-5 border-t border-border space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {tx(t, "settings.profile.connectedAccounts", "Connected accounts")}
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3 min-w-0">
            {/* Google logo (official 4-color G) */}
            <div className="size-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
              <svg viewBox="0 0 18 18" className="size-5">
                <path d="M16.51 8.18a8.65 8.65 0 0 0-.13-1.51H8.86v2.87h4.3a3.7 3.7 0 0 1-1.6 2.42v2.01h2.59a7.84 7.84 0 0 0 2.36-5.79z" fill="#4285F4"/>
                <path d="M8.86 16.5a7.66 7.66 0 0 0 5.3-1.93l-2.59-2.01a4.86 4.86 0 0 1-7.22-2.55h-2.7v2.07A8.49 8.49 0 0 0 8.86 16.5z" fill="#34A853"/>
                <path d="M4.35 10.01a4.95 4.95 0 0 1 0-3.02V4.93h-2.7a8.49 8.49 0 0 0 0 7.15l2.7-2.07z" fill="#FBBC05"/>
                <path d="M8.86 4.04a4.6 4.6 0 0 1 3.27 1.28l2.3-2.3A8.18 8.18 0 0 0 8.86.5a8.49 8.49 0 0 0-7.21 4.43l2.7 2.07a4.86 4.86 0 0 1 4.51-2.96z" fill="#EA4335"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">Google</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 shrink-0">
            <Check className="size-3" />
            {tx(t, "settings.profile.connected", "Connected")}
          </span>
        </div>
      </div>
    </SettingsCard>
  );
}

/* ─────────────── PLAN TAB ─────────────── */

function PlanTab({ t }: { t: (k: string) => string }) {
  const profile = trpc.user.getProfile.useQuery();
  const subscription = trpc.billing.getSubscription.useQuery();
  const createPortal = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => toast.error(err.message),
  });

  if (profile.isLoading) {
    return <Skeleton width="100%" height={300} style={{ borderRadius: 16 }} />;
  }

  const plan = (profile.data?.plan ?? "FREE") as "FREE" | "PRO" | "STUDIO";
  const limits = getPlanLimits(plan);
  const projectCount = profile.data?._count?.projects ?? 0;
  const aiUsage = profile.data?.aiUsage ?? 0;
  const sub = subscription.data?.subscription;
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd * 1000) : null;

  return (
    <SettingsCard
      icon={<CreditCard className="size-4" />}
      title={tx(t, "settings.subscription", "Plan & usage")}
      description={tx(t, "settings.subscription.desc", "View limits and manage your subscription")}
    >
      <div className="rounded-2xl bg-gradient-to-br from-brand-500/10 via-card to-card border border-brand-500/20 p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
              plan === "STUDIO" && "bg-amber-500/15 text-amber-400",
              plan === "PRO" && "bg-brand-500/15 text-brand-500",
              plan === "FREE" && "bg-muted text-muted-foreground",
            )}>
              {plan}
            </span>
            <span className="text-base font-bold text-foreground">
              {tx(t, "settings.subscription.currentPlan", "Current plan")}
            </span>
          </div>
          {periodEnd && plan !== "FREE" && (
            <div className="text-xs text-muted-foreground font-mono">
              {sub?.cancelAtPeriodEnd
                ? `${tx(t, "settings.subscription.endsOn", "Ends on")} ${periodEnd.toLocaleDateString()}`
                : `${tx(t, "settings.subscription.renewsOn", "Renews on")} ${periodEnd.toLocaleDateString()}`}
            </div>
          )}
        </div>

        {/* Usage bars */}
        <div className="space-y-3">
          <UsageBar
            label={tx(t, "settings.subscription.projects", "Projects")}
            used={projectCount}
            total={limits.projects}
          />
          <UsageBar
            label={tx(t, "settings.subscription.aiGenerations", "AI generations this month")}
            used={aiUsage}
            total={limits.aiGenerations}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap mt-4">
          {plan === "FREE" ? (
            <Link
              href="/billing"
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 hover:shadow-lg text-white text-sm font-semibold transition-all"
            >
              <Sparkles className="size-4" />
              {tx(t, "settings.subscription.upgrade", "Upgrade plan")}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {createPortal.isPending ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
              {tx(t, "settings.subscription.manageInStripe", "Manage in Stripe")}
            </button>
          )}
          <Link
            href="/billing"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-sm font-semibold transition-colors"
          >
            {tx(t, "settings.subscription.comparePlans", "Compare plans")}
            <ChevronRight className="size-3.5 opacity-60" />
          </Link>
        </div>
      </div>
    </SettingsCard>
  );
}

/* ─────────────── CHANNELS TAB ─────────────── */

function ChannelsTab({ t }: { t: (k: string) => string }) {
  const profile = trpc.user.getProfile.useQuery();
  const channels = profile.data?.channels ?? [];
  const hasYouTubeScopes = profile.data?.hasYouTubeScopes ?? false;

  // III.D.2.3.1.a/b compliance — disconnect channel revokes Google OAuth + deletes local data
  const disconnectMutation = trpc.youtube.disconnectChannel.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.revokedAtGoogle
          ? `Disconnected ${data.channelTitle}. Access revoked at Google.`
          : `Disconnected ${data.channelTitle}.`
      );
      profile.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to disconnect channel");
    },
  });
  const handleDisconnect = (channelId: string, channelTitle: string) => {
    if (typeof window !== "undefined" && window.confirm(
      `Disconnect ${channelTitle}?\n\nThis will revoke TubeForge's access via Google and delete all upload jobs for this channel. This cannot be undone.`
    )) {
      disconnectMutation.mutate({ channelId });
    }
  };

  // Real-time sync from YouTube Data API → upserts Channel rows in our DB.
  // Only useful once the user has granted youtube.upload scope. When scopes
  // are missing we trigger signIn('google') instead, which forces a fresh
  // consent screen (prompt: 'consent' is already set in NextAuth config).
  const syncChannels = trpc.youtube.getChannels.useQuery(undefined, {
    enabled: false, // manual trigger only
    retry: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = useCallback(async () => {
    if (!hasYouTubeScopes) {
      // III.E.3.4 compliance — explicit pre-OAuth consent screen explaining
      // what TubeForge will access before redirecting to Google's consent flow.
      if (typeof window !== "undefined") {
        const consent = window.confirm(
          "Connect YouTube channel\n\n" +
            "TubeForge will access your YouTube channel to:\n" +
            "  (1) read public channel info (name, subscriber count)\n" +
            "  (2) upload videos you schedule via TubeForge\n" +
            "  (3) check upload status of those videos\n\n" +
            "TubeForge will not modify existing videos, comments, or settings without your explicit instruction. " +
            "Non-statistical data is retained for max 30 days. You can disconnect any channel anytime in Settings.\n\n" +
            "Continue to Google for sign-in?"
        );
        if (!consent) return;
      }
      // Re-auth flow: forces Google consent screen with full scope list.
      // After redirect back to /settings#channels the new tokens cover youtube.upload.
      await signIn("google", { callbackUrl: "/settings#channels" });
      return;
    }
    // User already consented — just sync from YouTube API.
    setIsSyncing(true);
    try {
      const res = await syncChannels.refetch();
      if (res.error) {
        toast.error(res.error.message || tx(t, "settings.youtubeChannels.syncError", "Sync failed"));
      } else {
        await profile.refetch();
        toast.success(tx(t, "settings.youtubeChannels.syncedToast", "Channels synced"));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || tx(t, "settings.youtubeChannels.syncError", "Sync failed"));
    } finally {
      setIsSyncing(false);
    }
  }, [hasYouTubeScopes, syncChannels, profile, t]);

  if (profile.isLoading) {
    return <Skeleton width="100%" height={200} style={{ borderRadius: 16 }} />;
  }

  return (
    <SettingsCard
      icon={<YoutubeIcon className="size-4 text-red-500" />}
      title={tx(t, "settings.youtubeChannels", "YouTube channels")}
      description={tx(
        t,
        "settings.youtubeChannels.desc",
        "Connect your channels via Google OAuth to publish videos and read insights."
      )}
    >
      {channels.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
          <div className="size-12 mx-auto rounded-xl bg-red-500/10 flex items-center justify-center mb-3">
            <YoutubeIcon className="size-6 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">
            {tx(t, "settings.youtubeChannels.empty", "No channels connected yet")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {hasYouTubeScopes
              ? tx(
                  t,
                  "settings.youtubeChannels.emptyDescScoped",
                  "You've granted access — click Sync to fetch your channels from YouTube."
                )
              : tx(
                  t,
                  "settings.youtubeChannels.emptyDesc",
                  "Connect via Google to see your channel data inside TubeForge."
                )}
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={isSyncing}
            className={cn(
              "inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-brand-500 text-white text-sm font-semibold transition-colors",
              isSyncing ? "opacity-60 cursor-wait" : "hover:bg-brand-600"
            )}
          >
            {isSyncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : hasYouTubeScopes ? (
              <RefreshCw className="size-4" />
            ) : (
              <Link2 className="size-4" />
            )}
            {isSyncing
              ? tx(t, "settings.youtubeChannels.syncing", "Syncing…")
              : hasYouTubeScopes
                ? tx(t, "settings.youtubeChannels.sync", "Sync from YouTube")
                : tx(t, "settings.youtubeChannels.connect", "Connect channel")}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleConnect}
              disabled={isSyncing}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground transition-colors",
                isSyncing ? "opacity-60 cursor-wait" : "hover:border-brand-500/40 hover:text-brand-500"
              )}
              aria-label={tx(t, "settings.youtubeChannels.refresh", "Refresh channels")}
            >
              {isSyncing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {isSyncing
                ? tx(t, "settings.youtubeChannels.syncing", "Syncing…")
                : tx(t, "settings.youtubeChannels.refresh", "Refresh")}
            </button>
          </div>
          <div className="tf-stagger-in space-y-2.5">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="group/ch tf-settings-card flex items-center gap-4 rounded-xl border border-border bg-card p-3"
              >
                {ch.thumbnail ? (
                  <img
                    src={ch.thumbnail}
                    alt={ch.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Avatar 404'd (Google/YouTube CDN sometimes rotates
                      // image hashes) — fall back to the YouTube icon
                      // placeholder via the sibling div.
                      e.currentTarget.style.display = "none";
                      const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (sib) sib.style.display = "flex";
                    }}
                    className="size-12 shrink-0 rounded-full object-cover ring-2 ring-border transition-all duration-300 group-hover/ch:ring-brand-500/40 group-hover/ch:scale-105"
                  />
                ) : null}
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500 transition-transform duration-300 group-hover/ch:scale-105"
                  style={{ display: ch.thumbnail ? "none" : "flex" }}
                >
                  <YoutubeIcon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{ch.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {ch.subscribers.toLocaleString()} {tx(t, "settings.youtubeChannels.subs", "subscribers")}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                  <Check className="size-3" />
                  {tx(t, "settings.youtubeChannels.synced", "Synced")}
                </span>
                <button
                  type="button"
                  onClick={() => handleDisconnect(ch.id, ch.title)}
                  disabled={disconnectMutation.isPending}
                  className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Disconnect ${ch.title}`}
                >
                  {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </SettingsCard>
  );
}

/* ─────────────── NOTIFICATIONS TAB ─────────────── */

function NotificationsTab({ t }: { t: (k: string) => string }) {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  return (
    <SettingsCard
      icon={<Bell className="size-4" />}
      title={tx(t, "settings.notifications", "Notifications")}
      description={tx(t, "settings.notifications.desc", "Choose how you receive updates from TubeForge")}
    >
      <div className="space-y-2">
        <NotificationToggle
          icon={<Mail className="size-4" />}
          title={tx(t, "settings.emailNotifications", "Email notifications")}
          description={tx(t, "settings.emailNotifications.desc", "Get notified about important updates by email")}
          enabled={emailEnabled}
          onChange={setEmailEnabled}
        />
        <NotificationToggle
          icon={<Smartphone className="size-4" />}
          title={tx(t, "settings.pushNotifications", "Push notifications")}
          description={tx(t, "settings.pushNotifications.desc", "Browser push when generation finishes or content is ready")}
          enabled={pushEnabled}
          onChange={setPushEnabled}
        />
      </div>
      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
        {tx(t, "settings.notifications.unsubscribe", "Disable email notifications anytime — we will never send marketing emails without consent.")}
      </p>
    </SettingsCard>
  );
}

function NotificationToggle({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
      <div className="flex items-start gap-3 min-w-0">
        <div className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative shrink-0 w-11 h-6 rounded-full transition-colors",
          enabled ? "bg-brand-500" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            enabled && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

/* ─────────────── APPEARANCE TAB ─────────────── */

function AppearanceTab({ t }: { t: (k: string) => string }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode; preview: string }[] = [
    { id: "light",  label: tx(t, "settings.theme.light",  "Light"),  icon: <Sun className="size-4" />,    preview: "from-amber-200 to-orange-300" },
    { id: "dark",   label: tx(t, "settings.theme.dark",   "Dark"),   icon: <Moon className="size-4" />,   preview: "from-slate-700 to-slate-900" },
    { id: "system", label: tx(t, "settings.theme.system", "System"), icon: <Monitor className="size-4" />, preview: "from-slate-400 to-amber-200" },
  ];

  return (
    <>
      <SettingsCard
        icon={<Palette className="size-4" />}
        title={tx(t, "settings.themeTitle", "Theme")}
        description={tx(t, "settings.theme.desc", "Choose how TubeForge looks. System matches your OS preference.")}
      >
        <div className="grid grid-cols-3 gap-3">
          {themes.map((th) => {
            const active = mode === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => setMode(th.id)}
                className={cn(
                  "group rounded-xl bg-card border-2 overflow-hidden transition-all text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  active ? "border-brand-500" : "border-border hover:border-brand-500/30",
                )}
              >
                <div className={cn("h-16 bg-gradient-to-br", th.preview)} />
                <div className="p-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {th.icon}
                    {th.label}
                  </span>
                  {active && <Check className="size-4 text-brand-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Languages className="size-4" />}
        title={tx(t, "settings.languageTitle", "Language")}
        description={tx(t, "settings.language.desc", "Interface language. New languages coming soon.")}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LOCALES.map((l) => {
            const active = locale === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setLocale(l.id)}
                className={cn(
                  "h-12 rounded-lg flex items-center justify-center gap-2 transition-all border-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  active
                    ? "bg-brand-500/10 border-brand-500 text-foreground"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-brand-500/30",
                )}
              >
                <span className="text-xl leading-none">{l.flag}</span>
                <span className="text-sm font-semibold">{l.label}</span>
              </button>
            );
          })}
        </div>
      </SettingsCard>
    </>
  );
}

/* ─────────────── INTEGRATIONS TAB ─────────────── */

function IntegrationsTab({ t }: { t: (k: string) => string }) {
  return (
    <>
      <ApiKeysSection t={t} />
      <WebhooksSection t={t} />

      <SettingsCard
        icon={<Zap className="size-4" />}
        title={tx(t, "settings.integrations.more", "More integrations")}
        description={tx(t, "settings.integrations.moreDesc", "AI voice cloning, white-label embedding")}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <IntegrationCard
            icon={
              <div className="size-9 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-500">
                <Sparkles className="size-4" />
              </div>
            }
            title={tx(t, "settings.aiVoice.title", "Custom AI voice")}
            description={tx(t, "settings.aiVoice.desc", "Train your own voice model for voiceovers (Studio plan)")}
            action={tx(t, "common.contact", "Contact us")}
            href="mailto:support@tubeforge.co?subject=AI%20Voice%20Cloning"
            badge={tx(t, "settings.studioOnly", "Studio")}
          />
          <IntegrationCard
            icon={
              <div className="size-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
                <ExternalLink className="size-4" />
              </div>
            }
            title={tx(t, "settings.whiteLabel.title", "White label")}
            description={tx(t, "settings.whiteLabel.desc", "Embed TubeForge in your product with custom branding (Enterprise)")}
            action={tx(t, "common.contact", "Contact sales")}
            href="mailto:support@tubeforge.co?subject=White%20Label"
            badge={tx(t, "settings.enterprise", "Enterprise")}
          />
        </div>
      </SettingsCard>
    </>
  );
}

/* ─────────────── API Keys section ─────────────── */

function ApiKeysSection({ t }: { t: (k: string) => string }) {
  const keys = trpc.apikey.list.useQuery();
  const usage = trpc.apikey.usage.useQuery();
  const [creating, setCreating] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [revealedKey, setRevealedKey] = useState<{ key: string; label: string } | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const generate = trpc.apikey.generate.useMutation({
    onSuccess: (data) => {
      setRevealedKey({ key: data.key, label: data.label });
      setNewKeyLabel("");
      setCreating(false);
      void keys.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const revoke = trpc.apikey.revoke.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "settings.apiKey.revoked", "API key revoked"));
      setRevokeId(null);
      void keys.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      /* fallback skipped */
    }
  };

  return (
    <SettingsCard
      icon={<Key className="size-4 text-emerald-500" />}
      title={tx(t, "settings.apiKeys.title", "API keys")}
      description={tx(
        t,
        "settings.apiKeys.desc2",
        "Generate keys to call the TubeForge Publishing API (POST /api/v1/youtube/upload) — auto-post videos to YouTube from any project.",
      )}
    >
      {/* List */}
      {keys.isLoading ? (
        <Skeleton width="100%" height={120} style={{ borderRadius: 12 }} />
      ) : keys.data && keys.data.length > 0 ? (
        <div className="tf-stagger-in space-y-2">
          {keys.data.map((k) => (
            <div
              key={k.id}
              className="group/key tf-settings-card flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 transition-transform duration-300 group-hover/key:scale-110 group-hover/key:rotate-[-6deg]">
                <Key className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-foreground">{k.label}</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    tf_…{k.last4}
                  </code>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span className="font-mono">
                    {k.usageCount.toLocaleString()} {tx(t, "settings.apiKey.uses", "uses")}
                  </span>
                  {k.lastUsed ? (
                    <span>
                      {tx(t, "settings.apiKey.lastUsed", "last used")}{" "}
                      <span className="font-mono">{new Date(k.lastUsed).toLocaleDateString()}</span>
                    </span>
                  ) : (
                    <span className="italic">{tx(t, "settings.apiKey.neverUsed", "never used")}</span>
                  )}
                  <span>
                    {tx(t, "settings.apiKey.created", "created")}{" "}
                    <span className="font-mono">{new Date(k.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevokeId(k.id)}
                className="tf-focusable rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
              >
                {tx(t, "settings.apiKey.revoke", "Revoke")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
          <div className="size-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <Key className="size-5 text-emerald-500" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">
            {tx(t, "settings.apiKey.emptyTitle", "No API keys yet")}
          </h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            {tx(
              t,
              "settings.apiKey.emptyDesc",
              "Create your first key to start uploading videos via the REST API. Keys are revocable any time.",
            )}
          </p>
        </div>
      )}

      {/* Usage stat */}
      {usage.data && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            {tx(t, "settings.apiKey.usageThisMonth", "API requests this month")}
          </span>
          <span className="font-mono font-bold text-foreground">
            {usage.data.count.toLocaleString()}
          </span>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="tf-focusable group/gen relative mt-4 inline-flex h-10 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:shadow-brand-500/30"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover/gen:translate-x-full"
        />
        <Plus className="size-4 transition-transform duration-200 group-hover/gen:rotate-90" />
        {tx(t, "settings.apiKey.create", "Generate new key")}
      </button>

      {/* Docs link */}
      <div className="mt-3 text-[11px] text-muted-foreground">
        <Link href="/docs/api" prefetch className="text-brand-500 hover:text-brand-600 inline-flex items-center gap-1">
          {tx(t, "settings.apiKey.docs", "Read API docs →")}
        </Link>
      </div>

      {/* Generation modal */}
      {creating && (
        <ModalShell onClose={() => !generate.isPending && setCreating(false)}>
          <h3 className="text-lg font-bold text-foreground">
            {tx(t, "settings.apiKey.modalTitle", "Generate API key")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx(
              t,
              "settings.apiKey.modalDesc",
              "Give the key a label so you remember what uses it (e.g. 'production server' or 'webflow integration').",
            )}
          </p>
          <label className="mt-4 block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tx(t, "settings.apiKey.labelField", "Label")}
            </span>
            <input
              type="text"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value.slice(0, 50))}
              placeholder={tx(t, "settings.apiKey.labelPlaceholder", "Production server")}
              maxLength={50}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-4 text-[14px] text-foreground outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
              autoFocus
            />
            <span className="mt-1 block text-[10px] font-mono text-muted-foreground">
              {newKeyLabel.length}/50
            </span>
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              disabled={generate.isPending}
              className="px-4 h-10 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
            >
              {tx(t, "common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              onClick={() => generate.mutate({ label: newKeyLabel.trim() || undefined })}
              disabled={generate.isPending}
              className={cn(
                "inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-bold shadow-sm shadow-brand-500/20",
                generate.isPending ? "cursor-wait opacity-60" : "hover:scale-[1.02] transition-transform",
              )}
            >
              {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {generate.isPending
                ? tx(t, "settings.apiKey.generating", "Generating…")
                : tx(t, "settings.apiKey.generate", "Generate")}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Reveal modal (shown once) */}
      {revealedKey && (
        <ModalShell
          onClose={() => {
            // Block backdrop / Escape close when the user hasn't copied
            // yet — the key is one-time-shown and we don't want a
            // misclick to wipe it. Once copied, dismissal is fine.
            if (copiedKey) setRevealedKey(null);
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Check className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {tx(t, "settings.apiKey.revealTitle", "Your API key")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tx(
                  t,
                  "settings.apiKey.revealDesc",
                  "Copy this now — you won't see it again. If you lose it, generate a new key.",
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-border bg-muted px-3 py-2.5 font-mono text-[12px] break-all select-all">
            {revealedKey.key}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {tx(t, "settings.apiKey.label", "Label")}:{" "}
              <span className="font-semibold text-foreground">{revealedKey.label}</span>
            </span>
            <button
              type="button"
              onClick={() => copyKey(revealedKey.key)}
              className={cn(
                "tf-focusable inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all",
                copiedKey
                  ? "bg-emerald-500 text-white tf-check-pop"
                  : "bg-brand-500 text-white hover:bg-brand-600 hover:scale-[1.02]",
              )}
              aria-label={copiedKey ? "Copied to clipboard" : "Copy API key to clipboard"}
            >
              {copiedKey ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiedKey ? tx(t, "common.copied", "Copied") : tx(t, "common.copy", "Copy")}
            </button>
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mb-0.5 mr-1 inline size-3.5" />
            {tx(
              t,
              "settings.apiKey.warning",
              "Treat this key like a password. Anyone with it can upload to your YouTube channels.",
            )}
          </div>
          <button
            type="button"
            onClick={() => setRevealedKey(null)}
            disabled={!copiedKey}
            className={cn(
              "tf-focusable mt-5 h-10 w-full rounded-lg text-sm font-semibold transition-all",
              copiedKey
                ? "border border-border bg-card text-foreground hover:bg-muted"
                : "cursor-not-allowed border border-dashed border-border bg-muted/40 text-muted-foreground",
            )}
            title={!copiedKey ? tx(t, "settings.apiKey.copyFirst", "Copy the key first") : undefined}
          >
            {copiedKey
              ? tx(t, "common.gotIt", "Got it, I've saved it")
              : tx(t, "settings.apiKey.copyFirst", "Copy the key first")}
          </button>
        </ModalShell>
      )}

      {/* Revoke confirm */}
      {revokeId && (
        <ModalShell onClose={() => !revoke.isPending && setRevokeId(null)}>
          <div className="flex items-start gap-3">
            <div className="size-10 shrink-0 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {tx(t, "settings.apiKey.revokeConfirmTitle", "Revoke this API key?")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tx(
                  t,
                  "settings.apiKey.revokeConfirmDesc",
                  "All requests using this key will start failing immediately with 401. This cannot be undone.",
                )}
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRevokeId(null)}
              disabled={revoke.isPending}
              className="px-4 h-10 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
            >
              {tx(t, "common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              onClick={() => revoke.mutate({ id: revokeId })}
              disabled={revoke.isPending}
              className={cn(
                "inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold",
                revoke.isPending && "cursor-wait opacity-60",
              )}
            >
              {revoke.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {tx(t, "settings.apiKey.revoke", "Revoke")}
            </button>
          </div>
        </ModalShell>
      )}
    </SettingsCard>
  );
}

/* ─────────────── Webhooks section ─────────────── */

const WEBHOOK_EVENT_OPTIONS = [
  { id: "job.completed", label: "Upload completed", color: "emerald" },
  { id: "job.failed", label: "Upload failed", color: "rose" },
  { id: "job.uploading", label: "Upload started", color: "blue" },
  { id: "job.cancelled", label: "Upload cancelled", color: "amber" },
  { id: "video.completed", label: "Video processing done", color: "emerald" },
] as const;

function WebhooksSection({ t }: { t: (k: string) => string }) {
  const webhooks = trpc.webhook.list.useQuery();
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["job.completed", "job.failed"]);
  const [revealedSecret, setRevealedSecret] = useState<{ url: string; secret: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const register = trpc.webhook.register.useMutation({
    onSuccess: (data) => {
      setRevealedSecret({ url: data.url, secret: data.secret });
      setNewUrl("");
      setNewEvents(["job.completed", "job.failed"]);
      setCreating(false);
      void webhooks.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteHook = trpc.webhook.delete.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "settings.webhook.deleted", "Webhook deleted"));
      setDeleteId(null);
      void webhooks.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const testHook = trpc.webhook.test.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "settings.webhook.tested", "Test event sent"));
      // Auto-expand the activity log for the tested webhook so the
      // user sees the delivery row appear within a few seconds — the
      // 10s poll inside WebhookActivityLog picks it up. Far more
      // satisfying than just a generic toast.
      if (testingId) setExpandedId(testingId);
      setTestingId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setTestingId(null);
    },
  });

  const toggleEvent = (id: string) => {
    setNewEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const copySecret = async (s: string) => {
    try {
      await navigator.clipboard.writeText(s);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      /* fallback skipped */
    }
  };

  return (
    <SettingsCard
      icon={<Webhook className="size-4 text-violet-500" />}
      title={tx(t, "settings.webhooks.title", "Webhooks")}
      description={tx(
        t,
        "settings.webhooks.desc",
        "Receive HMAC-signed HTTP POST notifications when upload jobs complete, fail, or change status.",
      )}
    >
      {webhooks.isLoading ? (
        <Skeleton width="100%" height={100} style={{ borderRadius: 12 }} />
      ) : webhooks.data && webhooks.data.length > 0 ? (
        <div className="tf-stagger-in space-y-2">
          {webhooks.data.map((wh) => {
            const isExpanded = expandedId === wh.id;
            return (
              <div
                key={wh.id}
                className={cn(
                  "tf-settings-card group/wh rounded-xl border bg-card",
                  isExpanded
                    ? "border-brand-500/40 shadow-sm shadow-brand-500/10"
                    : "border-border",
                )}
              >
                {/* Mobile stacks: URL + events row on top, actions row below.
                    Desktop keeps single horizontal row. */}
                <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500 transition-transform duration-300 group-hover/wh:scale-110">
                      <Webhook className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-sm font-semibold text-foreground">{wh.url}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px]">
                        {wh.events.map((ev) => (
                          <span
                            key={ev}
                            className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground transition-colors group-hover/wh:bg-muted-foreground/15"
                          >
                            {ev}
                          </span>
                        ))}
                        {!wh.active && (
                          <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-bold text-rose-500">
                            {tx(t, "settings.webhook.inactive", "INACTIVE")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Action buttons — h-9 on mobile (36px touch), tighter desktop */}
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : wh.id)}
                      className={cn(
                        "tf-focusable inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-colors sm:h-auto sm:py-1",
                        isExpanded
                          ? "bg-brand-500/10 text-brand-500"
                          : "text-muted-foreground hover:bg-muted hover:text-brand-500",
                      )}
                      title={tx(t, "settings.webhook.activityHint", "Show recent delivery attempts")}
                      aria-expanded={isExpanded}
                    >
                      <ChevronRight
                        className={cn(
                          "size-3 transition-transform duration-200 ease-out",
                          isExpanded && "rotate-90",
                        )}
                      />
                      {tx(t, "settings.webhook.activity", "Activity")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTestingId(wh.id);
                        testHook.mutate({ id: wh.id });
                      }}
                      disabled={testHook.isPending && testingId === wh.id}
                      className="tf-focusable group/test inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-brand-500 transition-all hover:bg-brand-500/10 hover:text-brand-600 disabled:cursor-wait disabled:opacity-60 sm:h-auto sm:py-1"
                      title={tx(t, "settings.webhook.testHint", "Send a synthetic job.completed event")}
                    >
                      {testHook.isPending && testingId === wh.id ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3 transition-transform duration-200 group-hover/test:translate-x-0.5" />}
                      {tx(t, "settings.webhook.test", "Test")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(wh.id)}
                      className="tf-focusable inline-flex h-9 items-center rounded-md px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500 sm:h-auto sm:py-1"
                    >
                      {tx(t, "common.delete", "Delete")}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="tf-expand-down">
                    <WebhookActivityLog webhookId={wh.id} t={t} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
          <div className="size-12 mx-auto rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
            <Webhook className="size-5 text-violet-500" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">
            {tx(t, "settings.webhook.emptyTitle", "No webhooks yet")}
          </h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
            {tx(
              t,
              "settings.webhook.emptyDesc",
              "Add a webhook URL to receive notifications when your uploads complete. Each delivery is HMAC-SHA256 signed.",
            )}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:scale-[1.01] text-white text-sm font-semibold transition-transform shadow-sm shadow-violet-500/20"
      >
        <Plus className="size-4" />
        {tx(t, "settings.webhook.add", "Add webhook")}
      </button>

      {/* Add modal */}
      {creating && (
        <ModalShell onClose={() => !register.isPending && setCreating(false)}>
          <h3 className="text-lg font-bold text-foreground">
            {tx(t, "settings.webhook.addTitle", "Add webhook")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx(
              t,
              "settings.webhook.addDesc",
              "Your endpoint will receive HTTP POST with JSON body and X-Forge-Signature header (HMAC-SHA256).",
            )}
          </p>
          <label className="mt-4 block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tx(t, "settings.webhook.url", "Endpoint URL")}
            </span>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks/tubeforge"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-4 font-mono text-[12px] text-foreground outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
              autoFocus
            />
          </label>
          <div className="mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tx(t, "settings.webhook.events", "Events to subscribe")}
            </span>
            <div className="mt-2 grid grid-cols-1 gap-1">
              {WEBHOOK_EVENT_OPTIONS.map((ev) => {
                const selected = newEvents.includes(ev.id);
                return (
                  <label
                    key={ev.id}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                      selected
                        ? "border-brand-500/40 bg-brand-500/5"
                        : "border-border bg-background hover:border-brand-500/30",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleEvent(ev.id)}
                      className="size-4 rounded border-border accent-brand-500"
                    />
                    <code className="font-mono text-[12px] font-semibold text-foreground">{ev.id}</code>
                    <span className="text-[11px] text-muted-foreground">— {ev.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              disabled={register.isPending}
              className="px-4 h-10 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
            >
              {tx(t, "common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newUrl.trim()) {
                  toast.error(tx(t, "settings.webhook.urlRequired", "URL is required"));
                  return;
                }
                if (newEvents.length === 0) {
                  toast.error(tx(t, "settings.webhook.eventsRequired", "Select at least one event"));
                  return;
                }
                register.mutate({
                  url: newUrl.trim(),
                  events: newEvents as Parameters<typeof register.mutate>[0]["events"],
                });
              }}
              disabled={register.isPending || !newUrl.trim() || newEvents.length === 0}
              className={cn(
                "inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold shadow-sm",
                register.isPending && "cursor-wait opacity-60",
              )}
            >
              {register.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {register.isPending
                ? tx(t, "settings.webhook.adding", "Adding…")
                : tx(t, "settings.webhook.create", "Create webhook")}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Secret reveal */}
      {revealedSecret && (
        <ModalShell onClose={() => setRevealedSecret(null)}>
          <div className="flex items-start gap-3">
            <div className="size-10 shrink-0 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-500">
              <Check className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {tx(t, "settings.webhook.revealTitle", "Webhook signing secret")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tx(
                  t,
                  "settings.webhook.revealDesc",
                  "Verify incoming requests with this secret + HMAC-SHA256 over the raw body. Stored hashed — you won't see it again.",
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-muted-foreground">
            {tx(t, "settings.webhook.url", "Endpoint")}:
          </div>
          <code className="mt-1 block px-3 py-2 rounded-lg bg-muted border border-border font-mono text-[11px] break-all">
            {revealedSecret.url}
          </code>
          <div className="mt-3 text-[11px] text-muted-foreground">
            {tx(t, "settings.webhook.secret", "Signing secret")}:
          </div>
          <code className="mt-1 block px-3 py-2 rounded-lg bg-muted border border-border font-mono text-[12px] break-all">
            {revealedSecret.secret}
          </code>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => copySecret(revealedSecret.secret)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold transition-colors",
                copiedSecret
                  ? "bg-emerald-500 text-white"
                  : "bg-brand-500 hover:bg-brand-600 text-white",
              )}
            >
              {copiedSecret ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiedSecret ? tx(t, "common.copied", "Copied") : tx(t, "settings.webhook.copySecret", "Copy secret")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRevealedSecret(null)}
            className="mt-5 w-full h-10 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted"
          >
            {tx(t, "common.gotIt", "Got it, I've saved it")}
          </button>
        </ModalShell>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ModalShell onClose={() => !deleteHook.isPending && setDeleteId(null)}>
          <div className="flex items-start gap-3">
            <div className="size-10 shrink-0 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {tx(t, "settings.webhook.deleteConfirmTitle", "Delete this webhook?")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tx(
                  t,
                  "settings.webhook.deleteConfirmDesc",
                  "Future events will not be delivered to this URL. Cannot be undone.",
                )}
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteId(null)}
              disabled={deleteHook.isPending}
              className="px-4 h-10 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
            >
              {tx(t, "common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              onClick={() => deleteHook.mutate({ id: deleteId })}
              disabled={deleteHook.isPending}
              className={cn(
                "inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold",
                deleteHook.isPending && "cursor-wait opacity-60",
              )}
            >
              {deleteHook.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {tx(t, "common.delete", "Delete")}
            </button>
          </div>
        </ModalShell>
      )}
    </SettingsCard>
  );
}

/* ─────────────── Modal shell (reusable) ─────────────── */

/* ─────────────── Webhook Activity Log ─────────────── */

function WebhookActivityLog({
  webhookId,
  t,
}: {
  webhookId: string;
  t: (k: string) => string;
}) {
  const activity = trpc.webhook.deliveries.useQuery(
    { webhookId, limit: 20 },
    {
      refetchInterval: 10_000, // poll every 10s while expanded
      refetchOnWindowFocus: true,
    },
  );

  const retry = trpc.webhook.retry.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(tx(t, "settings.webhook.retried", "Re-delivered successfully"));
      } else {
        toast.error(tx(t, "settings.webhook.retryFailed", "Retry attempt failed — check endpoint"));
      }
      void activity.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const formatTime = (iso: string | Date | null) => {
    if (!iso) return "—";
    const d = typeof iso === "string" ? new Date(iso) : iso;
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="border-t border-border px-3 pt-3 pb-3 bg-muted/20 rounded-b-xl">
      {/* Stats */}
      {activity.data && activity.data.stats.total > 0 && (
        <div className="mb-3 flex items-center gap-3 text-[11px]">
          <span className="text-muted-foreground">
            {tx(t, "settings.webhook.successRate", "Success rate")}:
          </span>
          <span
            className={cn(
              "font-mono font-bold",
              (activity.data.stats.successRate ?? 0) >= 95
                ? "text-emerald-500"
                : (activity.data.stats.successRate ?? 0) >= 70
                  ? "text-amber-500"
                  : "text-rose-500",
            )}
          >
            {activity.data.stats.successRate?.toFixed(1) ?? "—"}%
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono text-muted-foreground">
            {activity.data.stats.succeeded}/{activity.data.stats.total}{" "}
            {tx(t, "settings.webhook.delivered", "delivered")}
          </span>
        </div>
      )}

      {activity.isLoading ? (
        <Skeleton width="100%" height={80} style={{ borderRadius: 8 }} />
      ) : !activity.data || activity.data.deliveries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-4 text-center text-[11px] text-muted-foreground">
          {tx(t, "settings.webhook.noDeliveries", "No delivery attempts yet — trigger one with Test or wait for a real event.")}
        </div>
      ) : (
        <div className="tf-stagger-in max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {activity.data.deliveries.map((d) => {
            const isSuccess = d.success;
            const statusColor = isSuccess
              ? "bg-emerald-500/15 text-emerald-500"
              : d.statusCode == null
                ? "bg-amber-500/15 text-amber-600"
                : d.statusCode >= 500
                  ? "bg-rose-500/15 text-rose-500"
                  : "bg-amber-500/15 text-amber-600";
            const isRetrying = retry.isPending && retry.variables?.deliveryId === d.id;

            return (
              <div
                key={d.id}
                className="group/d flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] transition-all hover:border-brand-500/30 hover:bg-card hover:shadow-sm"
              >
                <span
                  className={cn(
                    "inline-flex w-12 shrink-0 items-center justify-center rounded px-1.5 py-0.5 text-center font-mono font-bold",
                    statusColor,
                  )}
                  title={d.errorMessage ?? undefined}
                >
                  {d.statusCode ?? (isSuccess ? "OK" : "ERR")}
                </span>
                <code className="shrink-0 font-mono text-foreground">{d.event}</code>
                {d.attempt > 1 && (
                  <span className="shrink-0 rounded bg-muted px-1 py-0 font-mono text-muted-foreground">
                    attempt #{d.attempt}
                  </span>
                )}
                <span className="flex-1 truncate font-mono text-[10px] text-muted-foreground">
                  {d.errorMessage
                    ? d.errorMessage.slice(0, 80)
                    : d.responseBody
                      ? d.responseBody.slice(0, 80)
                      : ""}
                </span>
                <span className="shrink-0 font-mono text-muted-foreground">
                  {formatTime(d.createdAt)}
                </span>
                {!isSuccess && (
                  <button
                    type="button"
                    onClick={() => retry.mutate({ deliveryId: d.id })}
                    disabled={isRetrying}
                    className="tf-focusable inline-flex shrink-0 items-center rounded p-1 text-brand-500 transition-all hover:bg-brand-500/10 hover:text-brand-600 disabled:cursor-wait disabled:opacity-60"
                    title={tx(t, "settings.webhook.retryHint", "Re-send this delivery")}
                    aria-label={tx(t, "settings.webhook.retryHint", "Re-send this delivery")}
                  >
                    {isRetrying ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3 transition-transform duration-300 group-hover/d:rotate-180" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm tf-overlay-enter"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tf-modal-enter relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="tf-focusable absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:rotate-90 hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function IntegrationCard({
  icon,
  title,
  description,
  action,
  href,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href: string;
  badge?: string;
}) {
  const isExternal = href.startsWith("mailto:") || href.startsWith("http");
  const Comp: React.ElementType = isExternal ? "a" : Link;
  const extra = isExternal ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
  return (
    <Comp
      {...extra}
      className="group relative p-4 rounded-xl bg-card border border-border hover:border-brand-500/40 transition-colors flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        {icon}
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 group-hover:gap-1.5 transition-all">
        {action} <ChevronRight className="size-3.5" />
      </div>
    </Comp>
  );
}

/* ─────────────── PRIVACY TAB ─────────────── */

function PrivacyTab({ t, router }: { t: (k: string) => string; router: ReturnType<typeof useRouter> }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const exportData = trpc.user.exportData.useQuery(undefined, { enabled: false });
  const resetOnboarding = trpc.user.resetOnboarding.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "settings.tour.replayed", "Tour will replay next session"));
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteAccount = trpc.user.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "settings.account.deleted", "Account deleted"));
      signOut({ callbackUrl: "/" });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleExport = () => {
    exportData.refetch().then((res) => {
      if (res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tubeforge-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(tx(t, "settings.exportData.success", "Data exported"));
      }
    });
  };

  return (
    <>
      <SettingsCard
        icon={<Download className="size-4" />}
        title={tx(t, "settings.exportData", "Export your data")}
        description={tx(t, "settings.exportData.desc", "Download all your projects, AI generations, and account info as JSON")}
      >
        <button
          type="button"
          onClick={handleExport}
          disabled={exportData.isFetching}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {exportData.isFetching ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {tx(t, "settings.exportData.action", "Download JSON")}
        </button>
      </SettingsCard>

      <SettingsCard
        icon={<RotateCcw className="size-4" />}
        title={tx(t, "settings.replayTour", "Replay onboarding tour")}
        description={tx(t, "settings.replayTour.desc", "Reset the welcome tour to see the platform walkthrough again")}
      >
        <button
          type="button"
          onClick={() => resetOnboarding.mutate()}
          disabled={resetOnboarding.isPending}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {resetOnboarding.isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
          {tx(t, "settings.replayTour.action", "Replay tour")}
        </button>
      </SettingsCard>

      {/* Danger zone */}
      <div className="rounded-2xl bg-red-500/5 border border-red-500/20 overflow-hidden">
        <div className="p-5 border-b border-red-500/15 flex items-start gap-3">
          <div className="size-9 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-500">
              {tx(t, "settings.dangerZone", "Danger zone")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {tx(t, "settings.dangerZone.desc", "Permanent actions — these cannot be undone")}
            </p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {tx(t, "settings.deleteAccount", "Delete account")}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tx(t, "settings.deleteAccount.desc", "Permanently delete your account, all projects, and YouTube channel data within 30 days")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-sm font-semibold transition-colors"
            >
              <Trash2 className="size-4" />
              {tx(t, "settings.deleteAccount.action", "Delete account")}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-border p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {tx(t, "settings.deleteAccount.confirmTitle", "Delete account permanently?")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {tx(t, "settings.deleteAccount.confirmDesc", "This deletes everything: projects, AI generations, channel data, subscription. Type DELETE to confirm.")}
                </p>
              </div>
            </div>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full h-10 rounded-lg bg-background border border-border px-3 text-sm font-mono focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteConfirmText("");
                }}
                className="h-9 px-4 rounded-lg bg-muted hover:bg-card text-foreground text-sm font-semibold border border-border transition-colors"
              >
                {tx(t, "common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => deleteAccount.mutate()}
                disabled={deleteAccount.isPending || deleteConfirmText !== "DELETE"}
                className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {deleteAccount.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {tx(t, "settings.deleteAccount.action", "Delete account")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────── Shared Settings Card ─────────────── */

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card border border-border p-5 sm:p-6">
      <header className="flex items-start gap-3 mb-5">
        <div className="size-9 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </header>
      <div>{children}</div>
    </section>
  );
}

/* ─────────────── Usage Bar (used in PlanTab) ─────────────── */

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) {
  const isInfinite = !isFinite(total);
  const pct = isInfinite ? 0 : total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const colorClass = pct > 90 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-xs font-mono font-bold text-foreground">
          {used}/{isInfinite ? "∞" : total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", isInfinite ? "bg-gradient-to-r from-brand-500 to-violet-500" : colorClass)}
          style={{ width: isInfinite ? "100%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}
