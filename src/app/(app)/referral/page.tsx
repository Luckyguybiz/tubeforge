"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";
import {
  Gift,
  Copy,
  Check,
  Download,
  Sparkles,
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  Send,
  MessageCircle,
  Mail,
  Loader2,
  Star,
  ExternalLink,
} from "lucide-react";

/* ── Translate-with-fallback ───────────────────────────── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── X (Twitter) icon — Lucide doesn't have it ─────────── */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ── Telegram icon ─────────────────────────────────────── */
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.2 3.1L2.8 10.4C1.7 10.9 1.7 11.6 2.6 11.9L7.3 13.4L18.1 6.7C18.6 6.4 19.1 6.5 18.7 6.8L9.7 15.1L9.4 19.9C9.8 19.9 10 19.7 10.3 19.5L12.6 17.3L17.3 20.8C18.1 21.2 18.6 21 18.8 20.1L21.9 4.5C22.2 3.4 21.6 2.9 21.2 3.1Z" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */

function ReferralContent() {
  const t = useLocaleStore((s) => s.t);

  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [claimingMilestone, setClaimingMilestone] = useState<string | null>(null);

  const myReferral = trpc.referral.getMyReferral.useQuery();
  const stats = trpc.referral.getStats.useQuery(undefined, {
    enabled: !!myReferral.data?.code,
  });
  const rewards = trpc.referral.getRewards.useQuery(undefined, {
    enabled: !!myReferral.data?.code,
  });
  const activateMutation = trpc.referral.activate.useMutation({
    onSuccess: () => {
      myReferral.refetch();
      stats.refetch();
      toast.success(tx(t, "referral.activated", "Program activated!"));
    },
    onError: () => {
      toast.error(tx(t, "referral.activateError", "Failed to activate"));
    },
  });
  const claimRewardMutation = trpc.referral.claimReward.useMutation({
    onSuccess: () => {
      rewards.refetch();
      setClaimingMilestone(null);
      toast.success(tx(t, "referral.claimSuccess", "Reward claimed!"));
    },
    onError: () => {
      setClaimingMilestone(null);
      toast.error(tx(t, "referral.claimError", "Failed to claim"));
    },
  });

  /* Parse milestone label and credits from reward strings */
  const parseMilestone = (milestone: string): { label: string; refs: number } => {
    if (milestone === "1_signup") return { label: "First signup", refs: 1 };
    if (milestone === "3_signups") return { label: "3 signups", refs: 3 };
    if (milestone === "1_paid") return { label: "First paying user", refs: 1 };
    if (milestone === "5_paid") return { label: "5 paying users", refs: 5 };
    if (milestone === "10_paid") return { label: "10 paying users", refs: 10 };
    return { label: milestone, refs: 0 };
  };
  const parseReward = (reward: string): string => {
    if (reward.startsWith("bonus_") && reward.endsWith("_credits")) {
      return `+${reward.replace("bonus_", "").replace("_credits", "")} credits`;
    }
    if (reward === "extended_trial_7d") return "+7-day trial";
    if (reward === "free_pro_month") return "1 free Pro month";
    return reward;
  };

  const referralCode = myReferral.data?.code ?? null;
  const referralLink = referralCode ? `https://tubeforge.co?ref=${referralCode}` : "";
  const invited = stats.data?.invited ?? 0;
  const paid = stats.data?.paid ?? 0;
  const earnings = stats.data?.earnings ?? 0;

  /* QR generation */
  useEffect(() => {
    if (!referralLink) return;
    QRCode.toDataURL(referralLink, {
      width: 200,
      margin: 2,
      color: { dark: "#1e1b4b", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [referralLink]);

  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      await activateMutation.mutateAsync();
    } finally {
      setActivating(false);
    }
  }, [activateMutation]);

  const handleCopy = useCallback(async (text: string, kind: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    if (kind === "link") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCodeCopied(true);
      toast.success(tx(t, "referral.codeCopied", "Code copied"));
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }, [t]);

  const shareUrls = useCallback(() => {
    const text = encodeURIComponent(
      `${tx(t, "referral.shareText", "Build viral YouTube videos with TubeForge — try it free:")} ${referralLink}`,
    );
    return {
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      email: `mailto:?subject=${encodeURIComponent(
        tx(t, "referral.shareEmailSubject", "Try TubeForge"),
      )}&body=${encodeURIComponent(`${tx(t, "referral.shareEmailBody", "I've been using this for YouTube — check it out:")}\n\n${referralLink}`)}`,
    };
  }, [referralLink, t]);

  const handleDownloadQR = useCallback(async () => {
    if (!referralLink) return;
    try {
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, referralLink, {
        width: 512,
        margin: 3,
        color: { dark: "#1e1b4b", light: "#ffffff" },
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `tubeforge-referral-${referralCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(tx(t, "referral.qrDownloaded", "QR code downloaded"));
    } catch {
      toast.error(tx(t, "referral.qrDownloadError", "Failed to download QR"));
    }
  }, [referralLink, referralCode, t]);

  const isLoading = myReferral.isLoading;

  /* ── Tier definitions (Bronze / Silver / Gold) ────── */
  const tiers = [
    {
      label: tx(t, "referral.tier1Label", "Bronze"),
      commission: tx(t, "referral.tier1Commission", "20% lifetime"),
      threshold: "0–9",
      Icon: Trophy,
      gradient: "from-amber-700 to-orange-600",
      active: invited < 10,
      comingSoon: false,
    },
    {
      label: tx(t, "referral.tier2Label", "Silver"),
      commission: tx(t, "referral.tier2Commission", "30% lifetime"),
      threshold: "10–49",
      Icon: Trophy,
      gradient: "from-slate-400 to-slate-600",
      active: invited >= 10 && invited < 50,
      comingSoon: true,
    },
    {
      label: tx(t, "referral.tier3Label", "Gold"),
      commission: tx(t, "referral.tier3Commission", "40% lifetime"),
      threshold: "50+",
      Icon: Trophy,
      gradient: "from-yellow-400 to-amber-500",
      active: invited >= 50,
      comingSoon: true,
    },
  ];

  /* ── Render: Loading ─────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-brand-500" />
      </div>
    );
  }

  /* ── Render: Error ────────────────────────────────── */
  if (myReferral.isError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted-foreground">
          {tx(t, "referral.loadError", "Couldn't load referral data")}
        </p>
        <button
          onClick={() => myReferral.refetch()}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"
        >
          {tx(t, "referral.retry", "Try again")}
        </button>
      </div>
    );
  }

  /* ── Render: Not yet activated ────────────────────── */
  if (!referralCode) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Hero */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 p-8 text-white shadow-xl shadow-violet-500/25 sm:p-12">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur w-fit">
            <Sparkles className="size-3" />
            Refer & Earn
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {tx(t, "referral.heading", "Earn 20% lifetime on every paying referral")}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-white/85">
            {tx(
              t,
              "referral.subheading",
              "Share TubeForge with creators. Get",
            )}{" "}
            <strong className="font-bold text-white">20%</strong>{" "}
            {tx(t, "referral.subheadingEnd", "of their subscription — every month, forever.")}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Min payout", value: "$50" },
              { label: "Top earners", value: "$500+/mo" },
              { label: "Cookie window", value: "60 days" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/10 p-3 backdrop-blur"
              >
                <div className="font-mono text-xl font-bold sm:text-2xl">
                  {item.value}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-white/70">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <section className="mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {tx(t, "referral.howItWorks", "How it works")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: 1, text: tx(t, "referral.howStep1", "Activate your referral link") },
              { step: 2, text: tx(t, "referral.howStep2", "Share with creator friends") },
              { step: 3, text: tx(t, "referral.howStep3", "They sign up & subscribe") },
              { step: 4, text: tx(t, "referral.howStep4", "You earn 20% every month") },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 font-mono text-sm font-bold text-white">
                  {s.step}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-foreground">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tiers preview */}
        <section className="mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {tx(t, "referral.tiersTitle", "Commission tiers")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {tiers.map((tier) => {
              const TierIcon = tier.Icon;
              return (
                <div
                  key={tier.label}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border bg-card p-4",
                    tier.active ? "border-brand-500/40 shadow-md shadow-brand-500/10" : "border-border",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                      tier.gradient,
                    )}
                  >
                    <TierIcon className="size-5" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-foreground">{tier.label}</h3>
                    {tier.comingSoon && (
                      <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Soon
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-[13px] font-semibold text-brand-500">
                    {tier.commission}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {tier.threshold} referrals
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={handleActivate}
            disabled={activating}
            className={cn(
              "inline-flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-violet-500 px-8 text-[15px] font-bold text-white shadow-lg shadow-brand-500/25 transition-transform",
              activating ? "cursor-wait opacity-70" : "hover:scale-[1.02]",
            )}
          >
            {activating ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Gift className="size-5" />
            )}
            {activating
              ? tx(t, "referral.activating", "Activating…")
              : tx(t, "referral.activateProgram", "Activate my referral link")}
          </button>
          <p className="mt-3 text-[12px] text-muted-foreground">
            {tx(
              t,
              "referral.activationNote",
              "Free to join · No minimum sign-ups · Get paid in USD via Stripe or PayPal",
            )}
          </p>
        </div>
      </div>
    );
  }

  /* ── Render: Dashboard (active) ──────────────────── */
  const urls = shareUrls();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* ── Hero gradient strip ─────────────────────── */}
      <header className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 p-6 text-white shadow-lg shadow-violet-500/20 sm:rounded-3xl sm:p-8">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/85">
          <Gift className="size-3.5" />
          {tx(t, "referral.dashboard", "Referral Dashboard")}
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {tx(t, "referral.dashboardHeading", "Earn 20% on every paying referral")}
        </h1>
      </header>

      {/* ── Stats row ───────────────────────────────── */}
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Users className="size-4" />}
          iconBg="bg-brand-500/10 text-brand-500"
          label={tx(t, "referral.statInvited", "Invited")}
          value={String(invited)}
          subtitle={tx(t, "referral.statInvitedSub", "total signups")}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          iconBg="bg-violet-500/10 text-violet-500"
          label={tx(t, "referral.statPaid", "Paid")}
          value={String(paid)}
          subtitle={tx(t, "referral.statPaidSub", "active subscribers")}
        />
        <StatCard
          icon={<DollarSign className="size-4" />}
          iconBg="bg-emerald-500/10 text-emerald-500"
          label={tx(t, "referral.statEarnings", "Earnings")}
          value={`$${earnings.toFixed(2)}`}
          subtitle={tx(t, "referral.statEarningsSub", "lifetime")}
        />
      </section>

      {/* ── Main grid ──────────────────────────────── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* ── LEFT: Link, share, code ─────────────── */}
        <div className="space-y-5">
          {/* Link card */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {tx(t, "referral.yourLink", "Your referral link")}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-500">
                {referralCode}
                <button
                  onClick={() => handleCopy(referralCode!, "code")}
                  className="opacity-70 transition-opacity hover:opacity-100"
                  aria-label="Copy code"
                >
                  {codeCopied ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={referralLink}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="h-11 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <button
                onClick={() => handleCopy(referralLink, "link")}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-bold text-white shadow-sm transition-colors",
                  copied
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600",
                )}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied
                  ? tx(t, "referral.copied", "Copied!")
                  : tx(t, "referral.copy", "Copy")}
              </button>
            </div>
          </section>

          {/* Share buttons */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tx(t, "referral.shareOn", "Share to platforms")}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ShareButton
                href={urls.telegram}
                color="bg-[#26A5E4] hover:bg-[#1f8eca]"
                Icon={<TelegramIcon className="size-4" />}
                label="Telegram"
              />
              <ShareButton
                href={urls.whatsapp}
                color="bg-[#25D366] hover:bg-[#1ebe5b]"
                Icon={<MessageCircle className="size-4" />}
                label="WhatsApp"
              />
              <ShareButton
                href={urls.twitter}
                color="bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                Icon={<XIcon className="size-3.5" />}
                label="X / Twitter"
              />
              <ShareButton
                href={urls.email}
                color="bg-slate-600 hover:bg-slate-700"
                Icon={<Mail className="size-4" />}
                label="Email"
              />
            </div>
          </section>

          {/* Tiers */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tx(t, "referral.tiersTitle", "Commission tiers")}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {tiers.map((tier) => {
                const TierIcon = tier.Icon;
                return (
                  <div
                    key={tier.label}
                    className={cn(
                      "relative overflow-hidden rounded-xl border bg-background p-3",
                      tier.active
                        ? "border-brand-500/40 shadow-md shadow-brand-500/10"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                          tier.gradient,
                        )}
                      >
                        <TierIcon className="size-4" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-foreground">{tier.label}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {tier.threshold} refs
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 font-mono text-[14px] font-bold text-brand-500">
                      {tier.commission}
                    </div>
                    {tier.active && (
                      <span className="absolute top-2 right-2 rounded-md bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Milestones (if rewards exist) */}
          {rewards.data && rewards.data.rewards.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {tx(t, "referral.milestones", "Milestone bonuses")}
              </h2>
              <div className="mt-3 space-y-2">
                {rewards.data.rewards.map((m) => {
                  const { label, refs } = parseMilestone(m.milestone);
                  return (
                    <div
                      key={m.milestone}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border p-3",
                        m.earned && !m.claimed
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border bg-background",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Star
                          className={cn(
                            "size-5 shrink-0",
                            m.earned ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30",
                          )}
                        />
                        <div>
                          <div className="text-[13px] font-semibold text-foreground">
                            {label}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {parseReward(m.reward)}
                          </div>
                        </div>
                      </div>
                      {m.claimed ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="size-3" />
                          {tx(t, "referral.claimed", "Claimed")}
                        </span>
                      ) : m.earned ? (
                        <button
                          onClick={() => {
                            setClaimingMilestone(m.milestone);
                            claimRewardMutation.mutate({ milestone: m.milestone });
                          }}
                          disabled={claimingMilestone === m.milestone}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 px-3 text-[12px] font-bold text-white shadow-sm hover:scale-[1.02] disabled:opacity-60"
                        >
                          {claimingMilestone === m.milestone ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Sparkles className="size-3" />
                          )}
                          {tx(t, "referral.claim", "Claim")}
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {refs > 0 ? `${invited}/${refs}` : "Locked"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT: QR code ─────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tx(t, "referral.qrTitle", "Quick QR")}
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {tx(
                t,
                "referral.qrDesc",
                "Stick on streams, business cards, or in-video.",
              )}
            </p>
            {qrDataUrl ? (
              <div className="mt-3 rounded-xl border border-border bg-white p-3 shadow-sm">
                <img
                  src={qrDataUrl}
                  alt={tx(t, "referral.qrAlt", "Referral QR code")}
                  className="size-full"
                />
              </div>
            ) : (
              <div className="mt-3 flex aspect-square items-center justify-center rounded-xl border border-border bg-muted">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <button
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background text-[13px] font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              <Download className="size-4" />
              {tx(t, "referral.qrDownload", "Download PNG")}
            </button>
          </div>
        </aside>
      </div>

      <div className="h-12" />
    </div>
  );
}

/* ── StatCard ──────────────────────────────────────────── */
function StatCard({
  icon,
  iconBg,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", iconBg)}>
          {icon}
        </span>
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>
    </div>
  );
}

/* ── ShareButton ──────────────────────────────────────── */
function ShareButton({
  href,
  color,
  Icon,
  label,
}: {
  href: string;
  color: string;
  Icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-[12px] font-bold text-white shadow-sm transition-colors",
        color,
      )}
    >
      {Icon}
      {label}
    </a>
  );
}

/* ════════════════════════════════════════════════════════════════════ */

export default function ReferralPage() {
  return (
    <ErrorBoundary>
      <ReferralContent />
    </ErrorBoundary>
  );
}
