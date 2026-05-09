"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Pencil,
  Eye,
  Mail,
  X,
  Trash2,
  ChevronDown,
  Activity,
  Clock,
  Loader2,
  Plus,
  AlertTriangle,
  Sparkles,
  Check,
} from "lucide-react";

/* ── Translate-with-fallback ───────────────────────────── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
type InvitableRole = "ADMIN" | "EDITOR" | "VIEWER";

/* ── Role visual config ────────────────────────────────── */
const ROLE_CONFIG: Record<
  Role,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    badgeBg: string;
    badgeText: string;
    desc: string;
  }
> = {
  OWNER: {
    label: "Owner",
    Icon: Crown,
    badgeBg: "bg-amber-500/15 border-amber-500/30",
    badgeText: "text-amber-600 dark:text-amber-400",
    desc: "Full access. Can delete the team.",
  },
  ADMIN: {
    label: "Admin",
    Icon: Shield,
    badgeBg: "bg-violet-500/15 border-violet-500/30",
    badgeText: "text-violet-600 dark:text-violet-400",
    desc: "Manage members, settings & billing.",
  },
  EDITOR: {
    label: "Editor",
    Icon: Pencil,
    badgeBg: "bg-blue-500/15 border-blue-500/30",
    badgeText: "text-blue-600 dark:text-blue-400",
    desc: "Create & edit projects. No member management.",
  },
  VIEWER: {
    label: "Viewer",
    Icon: Eye,
    badgeBg: "bg-muted border-border",
    badgeText: "text-muted-foreground",
    desc: "Read-only access to all team projects.",
  },
};

/* ── Avatar with gradient fallback ─────────────────────── */
function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-12 text-base" };
  const gradients = [
    "from-brand-500 to-violet-500",
    "from-rose-500 to-pink-500",
    "from-sky-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
  ];
  // Stable hash for deterministic gradient
  const idx =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % gradients.length;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn("shrink-0 rounded-full border border-border object-cover", sizes[size])}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm",
        gradients[idx],
        sizes[size],
      )}
    >
      {initial}
    </div>
  );
}

/* ── Role pill ─────────────────────────────────────────── */
function RolePill({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        cfg.badgeBg,
        cfg.badgeText,
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════ */

export function TeamPage() {
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitableRole>("EDITOR");
  const [teamName, setTeamName] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmCancelInviteId, setConfirmCancelInviteId] = useState<string | null>(null);

  const profile = trpc.user.getProfile.useQuery();
  const team = trpc.team.getTeam.useQuery(undefined, {
    enabled: profile.data?.plan === "STUDIO",
  });
  const pendingInvites = trpc.team.getPendingInvites.useQuery(undefined, {
    enabled: !!team.data,
  });
  const activityLog = trpc.team.getActivityLog.useQuery(undefined, {
    enabled: !!team.data,
  });

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "team.teamCreated", "Team created"));
      setTeamName("");
      team.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const invite = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "team.inviteSent", "Invite sent"));
      setInviteEmail("");
      setShowInviteForm(false);
      team.refetch();
      pendingInvites.refetch();
      activityLog.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "team.memberRemoved", "Member removed"));
      setConfirmRemoveId(null);
      team.refetch();
      activityLog.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRole = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "team.roleUpdated", "Role updated"));
      team.refetch();
      activityLog.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelInvite = trpc.team.cancelInvite.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "team.inviteCancelled", "Invite cancelled"));
      setConfirmCancelInviteId(null);
      pendingInvites.refetch();
      activityLog.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const isOwner = team.data?.ownerId === profile.data?.id;
  const isAdmin = team.data?.members?.some(
    (m) => m.user.id === profile.data?.id && (m.role === "OWNER" || m.role === "ADMIN"),
  );
  const canManage = isOwner || isAdmin;

  const formatDate = useCallback(
    (date: string | Date) => {
      const loc =
        locale === "ru"
          ? "ru-RU"
          : locale === "kk"
            ? "kk-KZ"
            : locale === "es"
              ? "es-ES"
              : "en-US";
      return new Date(date).toLocaleDateString(loc, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [locale],
  );

  const formatRelative = useCallback((date: string | Date) => {
    const ts = typeof date === "string" ? new Date(date).getTime() : date.getTime();
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(ts).toLocaleDateString();
  }, []);

  /* ── Render: Loading ─────────────────────────────── */
  if (profile.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton width="40%" height={32} />
        <div className="mt-3"><Skeleton width="60%" height={16} /></div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={64} rounded />
          ))}
        </div>
      </div>
    );
  }

  /* ── Render: STUDIO upsell ───────────────────────── */
  if (profile.data?.plan !== "STUDIO") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <Users className="size-7 text-white" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {tx(t, "team.title", "Team Workspace")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
            {tx(
              t,
              "team.studioOnly",
              "Collaborate with your editors, animators & manager. Invite up to 10 members with role-based access.",
            )}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-card p-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Studio Plan
          </div>
          <ul className="mt-3 space-y-3">
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
              const Icon = cfg.Icon;
              return (
                <li key={role} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      cfg.badgeBg,
                      cfg.badgeText,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-foreground">
                      {cfg.label}
                    </div>
                    <p className="text-[12px] text-muted-foreground">{cfg.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/billing"
            prefetch
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-[15px] font-bold text-white shadow-md shadow-amber-500/20 transition-transform hover:scale-[1.02]"
          >
            <Crown className="size-4" />
            {tx(t, "team.upgradeStudio", "Upgrade to Studio")}
          </Link>
        </div>
      </div>
    );
  }

  /* ── Render: Create team ─────────────────────────── */
  if (!team.data) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="text-center">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 shadow-lg shadow-brand-500/20">
            <Users className="size-7 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tx(t, "team.createTitle", "Create your team")}
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {tx(t, "team.createDesc", "Pick a name. You can invite members after.")}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {tx(t, "team.teamName", "Team name")}
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={tx(t, "team.teamNamePlaceholder", "My Production Team")}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[14px] outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
          />
          <button
            onClick={() => createTeam.mutate({ name: teamName.trim() })}
            disabled={!teamName.trim() || createTeam.isPending}
            className={cn(
              "mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-[14px] font-bold text-white shadow-md shadow-brand-500/20",
              !teamName.trim() || createTeam.isPending
                ? "cursor-not-allowed opacity-60"
                : "hover:scale-[1.01]",
            )}
          >
            {createTeam.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {createTeam.isPending
              ? tx(t, "team.creating", "Creating…")
              : tx(t, "team.createBtn", "Create team")}
          </button>
        </div>
      </div>
    );
  }

  /* ── Render: Dashboard ───────────────────────────── */
  const members = team.data.members ?? [];
  const memberCount = members.length;
  const maxMembers = 10;
  const slotsLeft = Math.max(0, maxMembers - memberCount);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* ── Header ────────────────────────────────────── */}
      <header className="pt-6 pb-4 sm:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/20">
              <Users className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {team.data.name}
              </h1>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {memberCount}/{maxMembers} {tx(t, "team.members", "members")} ·{" "}
                {tx(t, "team.created", "Created")} {formatDate(team.data.createdAt)}
              </p>
            </div>
          </div>
          {canManage && slotsLeft > 0 && (
            <button
              onClick={() => setShowInviteForm((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-4 text-[13px] font-bold text-white shadow-md shadow-brand-500/20 hover:scale-[1.02]"
            >
              <UserPlus className="size-4" />
              {tx(t, "team.inviteBtn", "Invite member")}
            </button>
          )}
        </div>
      </header>

      {/* ── Invite form ──────────────────────────────── */}
      {showInviteForm && canManage && (
        <section className="mt-2 rounded-2xl border-2 border-brand-500/30 bg-gradient-to-br from-brand-500/5 to-violet-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[14px] font-bold text-foreground">
              <UserPlus className="size-4 text-brand-500" />
              {tx(t, "team.inviteTitle", "Invite a teammate")}
            </h3>
            <button
              onClick={() => setShowInviteForm(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder={tx(t, "team.invitePlaceholder", "teammate@email.com")}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-[13px] outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
              />
            </div>
            <div className="relative">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as InvitableRole)}
                className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-3 pr-9 text-[13px] font-semibold text-foreground outline-none focus:border-brand-500/40"
              >
                <option value="ADMIN">Admin — manage members</option>
                <option value="EDITOR">Editor — create projects</option>
                <option value="VIEWER">Viewer — read-only</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <button
              onClick={() =>
                invite.mutate({
                  email: inviteEmail.trim(),
                  role: inviteRole,
                })
              }
              disabled={!inviteEmail.trim() || invite.isPending}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-4 text-[13px] font-bold text-white shadow-md shadow-brand-500/20",
                !inviteEmail.trim() || invite.isPending
                  ? "cursor-not-allowed opacity-60"
                  : "hover:scale-[1.02]",
              )}
            >
              {invite.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              {invite.isPending
                ? tx(t, "team.sending", "Sending…")
                : tx(t, "team.send", "Send invite")}
            </button>
          </div>
        </section>
      )}

      {/* ── Main grid: Members + Activity ─────────────── */}
      <div className="mt-5 grid gap-5 pb-16 lg:grid-cols-[1fr_320px]">
        {/* ── LEFT: Members & Pending ──────────────── */}
        <div className="space-y-5">
          {/* Members section */}
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                <Users className="size-4 text-muted-foreground" />
                {tx(t, "team.activeMembers", "Active members")}
                <span className="font-mono text-[12px] font-normal text-muted-foreground">
                  {memberCount}
                </span>
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {members.map((m) => {
                const isMe = m.user.id === profile.data?.id;
                const memberRole = m.role as Role;
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <Avatar src={m.user.image ?? undefined} name={m.user.name ?? m.user.email ?? "?"} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-semibold text-foreground">
                          {m.user.name ?? m.user.email ?? "Unknown"}
                        </span>
                        {isMe && (
                          <span className="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-500">
                            You
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[12px] text-muted-foreground">
                        {m.user.email}
                      </div>
                    </div>
                    <RolePill role={memberRole} />
                    {canManage && memberRole !== "OWNER" && !isMe && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const next = prompt(
                              `Change role for ${m.user.name ?? m.user.email ?? "user"}\n\nADMIN / EDITOR / VIEWER`,
                              memberRole,
                            ) as InvitableRole | null;
                            if (next && ["ADMIN", "EDITOR", "VIEWER"].includes(next)) {
                              updateRole.mutate({ memberId: m.id, role: next });
                            }
                          }}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Change role"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(m.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                          title="Remove"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {slotsLeft > 0 && !showInviteForm && canManage && (
              <button
                onClick={() => setShowInviteForm(true)}
                className="flex w-full items-center gap-2 border-t border-border px-5 py-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-brand-500"
              >
                <Plus className="size-4" />
                {tx(t, "team.addMore", "Add member")}{" "}
                <span className="ml-auto font-mono text-[11px]">
                  {slotsLeft} {tx(t, "team.slotsLeft", "slots left")}
                </span>
              </button>
            )}
          </section>

          {/* Pending invites */}
          {pendingInvites.data && pendingInvites.data.length > 0 && (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-500/30 px-5 py-3">
                <h2 className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                  <Clock className="size-4 text-amber-500" />
                  {tx(t, "team.pendingInvites", "Pending invites")}
                  <span className="font-mono text-[12px] font-normal text-muted-foreground">
                    {pendingInvites.data.length}
                  </span>
                </h2>
              </div>
              <ul className="divide-y divide-amber-500/15">
                {pendingInvites.data.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/15">
                      <Mail className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-foreground">
                        {inv.user.email ?? inv.user.name ?? "Pending invite"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {tx(t, "team.invitedAs", "Invited as")} {ROLE_CONFIG[inv.role as Role]?.label} ·{" "}
                        {formatRelative(inv.joinedAt)}
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => setConfirmCancelInviteId(inv.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                        title="Cancel"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── RIGHT: Activity log ──────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                <Activity className="size-4 text-muted-foreground" />
                {tx(t, "team.activity", "Activity")}
              </h2>
            </div>
            {activityLog.isLoading ? (
              <div className="space-y-3 px-5 py-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} width="100%" height={32} rounded />
                ))}
              </div>
            ) : !activityLog.data || activityLog.data.length === 0 ? (
              <div className="px-5 py-10 text-center text-[12px] text-muted-foreground">
                {tx(t, "team.activityEmpty", "No activity yet.")}
              </div>
            ) : (
              <ul className="space-y-1 p-2 max-h-[480px] overflow-y-auto">
                {activityLog.data.slice(0, 30).map((log) => (
                  <li
                    key={log.id}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2 hover:bg-muted/40"
                  >
                    <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-brand-500/60" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] leading-relaxed text-foreground">
                        <span className="font-semibold">
                          {log.actor?.name ?? log.actor?.email ?? "Someone"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {(log.action ?? "did something").replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {formatRelative(log.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* ── Confirm remove member modal ──────────────── */}
      {confirmRemoveId && (
        <ConfirmModal
          title={tx(t, "team.removeConfirmTitle", "Remove this member?")}
          desc={tx(
            t,
            "team.removeConfirmDesc",
            "They'll lose access to all team projects immediately.",
          )}
          confirmLabel={tx(t, "team.remove", "Remove")}
          danger
          onConfirm={() => removeMember.mutate({ memberId: confirmRemoveId })}
          onCancel={() => setConfirmRemoveId(null)}
          loading={removeMember.isPending}
        />
      )}
      {confirmCancelInviteId && (
        <ConfirmModal
          title={tx(t, "team.cancelInviteTitle", "Cancel this invite?")}
          desc={tx(
            t,
            "team.cancelInviteDesc",
            "They won't be able to join unless re-invited.",
          )}
          confirmLabel={tx(t, "team.confirmCancel", "Cancel invite")}
          danger
          onConfirm={() => cancelInvite.mutate({ memberId: confirmCancelInviteId })}
          onCancel={() => setConfirmCancelInviteId(null)}
          loading={cancelInvite.isPending}
        />
      )}
    </div>
  );
}

/* ── Confirm modal ─────────────────────────────────────── */
function ConfirmModal({
  title,
  desc,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  desc: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              danger ? "bg-rose-500/15 text-rose-500" : "bg-brand-500/15 text-brand-500",
            )}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">{desc}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] font-semibold text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white shadow-sm",
              danger
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-gradient-to-r from-brand-500 to-violet-500",
              loading && "cursor-wait opacity-60",
            )}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
