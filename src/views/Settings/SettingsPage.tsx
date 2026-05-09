"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
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
  Globe,
  Sparkles,
  ChevronRight,
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
          {/* Mobile horizontal scroll tabs */}
          <div className="md:hidden flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.replaceState(null, "", `#${tab.id}`);
                }}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "bg-card border border-brand-500/40 text-foreground"
                    : "text-muted-foreground hover:text-foreground border border-transparent",
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

  if (profile.isLoading) {
    return <Skeleton width="100%" height={200} style={{ borderRadius: 16 }} />;
  }

  return (
    <SettingsCard
      icon={<YoutubeIcon className="size-4 text-red-500" />}
      title={tx(t, "settings.youtubeChannels", "YouTube channels")}
      description={tx(t, "settings.youtubeChannels.desc", "Connect your channels via Google OAuth to unlock channel insights")}
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
            {tx(t, "settings.youtubeChannels.emptyDesc", "Connect via Google to see your channel data inside TubeForge.")}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            {tx(t, "settings.youtubeChannels.connect", "Connect channel")}
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-brand-500/30 transition-colors">
              {ch.thumbnail ? (
                <img
                  src={ch.thumbnail}
                  alt={ch.title}
                  className="size-12 rounded-full object-cover ring-2 ring-border shrink-0"
                />
              ) : (
                <div className="size-12 rounded-full bg-red-500/15 flex items-center justify-center text-red-500 shrink-0">
                  <YoutubeIcon className="size-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{ch.title}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {ch.subscribers.toLocaleString()} {tx(t, "settings.youtubeChannels.subs", "subscribers")}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 shrink-0">
                <Check className="size-3" />
                {tx(t, "settings.youtubeChannels.synced", "Synced")}
              </span>
            </div>
          ))}
        </div>
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
      <SettingsCard
        icon={<Zap className="size-4" />}
        title={tx(t, "settings.integrations", "Integrations")}
        description={tx(t, "settings.integrations.desc", "Power-user tools — API keys, VPN, and more")}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <IntegrationCard
            icon={
              <div className="size-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                <Key className="size-4" />
              </div>
            }
            title={tx(t, "settings.apiKeys", "API access")}
            description={tx(t, "settings.apiKeys.desc", "Generate API keys for programmatic access (Studio plan)")}
            action={tx(t, "settings.apiKeys.manage", "Manage keys")}
            href="/admin#api"
            badge={tx(t, "settings.studioOnly", "Studio")}
          />
          <IntegrationCard
            icon={
              <div className="size-9 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500">
                <Globe className="size-4" />
              </div>
            }
            title={tx(t, "settings.vpn", "Built-in VPN")}
            description={tx(t, "settings.vpn.desc", "WireGuard config for region-restricted YouTube features")}
            action={tx(t, "settings.vpn.config", "Get config")}
            href="/vpn"
          />
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
