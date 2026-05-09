"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { trackEvent } from "@/lib/analytics-events";
import { PLAN_LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Check,
  Sparkles,
  Crown,
  Rocket,
  ChevronDown,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  Loader2,
  X,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

/* ── Types ── */

type PlanId = "FREE" | "PRO" | "STUDIO";

interface PlanDef {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  annualMonthly: string;
  annualTotal: number;
  badge?: string;
  features: string[];
  buttonLabel: string;
  highlight?: boolean;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

interface CompareFeature {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  studio: string | boolean;
}

interface FaqItem {
  question: string;
  answer: string;
}

/** Translate-with-fallback (Dashboard convention). */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── Data ── */

function getPlans(t: (k: string) => string): PlanDef[] {
  return [
    {
      id: "FREE",
      name: tx(t, "billing.planFree", "Free"),
      price: 0,
      priceLabel: "$0",
      annualMonthly: "$0",
      annualTotal: 0,
      icon: <Sparkles className="size-4" />,
      gradient: "from-slate-500 to-zinc-700",
      description: tx(t, "billing.freePlanDesc", "Get started with the basics"),
      features: [
        `${PLAN_LIMITS.FREE.projects} ${tx(t, "billing.feat.projectsUnit", "projects")}`,
        `${PLAN_LIMITS.FREE.aiGenerations} ${tx(t, "billing.feat.aiUnit", "AI generations")}`,
        tx(t, "billing.feat.export720", "720p export"),
        tx(t, "billing.feat.basicThumbs", "Basic AI editor"),
        tx(t, "billing.feat.watermark", "Watermark on export"),
      ],
      buttonLabel: tx(t, "billing.getStarted", "Get started"),
    },
    {
      id: "PRO",
      name: "Pro",
      price: 12,
      priceLabel: "$12",
      annualMonthly: "$9.58",
      annualTotal: 115,
      badge: tx(t, "billing.popular", "Most popular"),
      icon: <Rocket className="size-4" />,
      gradient: "from-brand-500 via-violet-500 to-fuchsia-500",
      description: tx(t, "billing.paidPlanDesc", "For serious creators"),
      features: [
        `${PLAN_LIMITS.PRO.projects} ${tx(t, "billing.feat.projectsUnit", "projects")}`,
        `${PLAN_LIMITS.PRO.aiGenerations} ${tx(t, "billing.feat.aiUnit", "AI generations / month")}`,
        tx(t, "billing.feat.export1080", "1080p export"),
        tx(t, "billing.feat.advancedThumbs", "Advanced thumbnails"),
        tx(t, "billing.feat.seo", "SEO toolkit"),
        tx(t, "billing.feat.noWatermark", "No watermark"),
        tx(t, "billing.feat.prioritySupport", "Priority support"),
      ],
      buttonLabel: tx(t, "billing.planPro", "Upgrade to Pro"),
      highlight: true,
    },
    {
      id: "STUDIO",
      name: "Studio",
      price: 30,
      priceLabel: "$30",
      annualMonthly: "$24",
      annualTotal: 288,
      icon: <Crown className="size-4" />,
      gradient: "from-amber-500 to-rose-500",
      description: tx(t, "billing.studioPlanDesc", "For teams and professionals"),
      features: [
        tx(t, "billing.feat.allPro", "Everything in Pro"),
        tx(t, "billing.feat.unlimitedAi", "Unlimited AI generations"),
        tx(t, "billing.feat.export4k", "4K export"),
        `${tx(t, "billing.feat.teamUnit", "Team")} (${PLAN_LIMITS.STUDIO.teamMembers})`,
        tx(t, "billing.feat.api", "API access"),
        tx(t, "billing.feat.whiteLabel", "White label"),
        tx(t, "billing.feat.personalManager", "Personal manager"),
      ],
      buttonLabel: tx(t, "billing.planStudio", "Upgrade to Studio"),
    },
  ];
}

function getCompareFeatures(t: (k: string) => string): CompareFeature[] {
  return [
    { name: tx(t, "billing.feat.projectsUnit", "Projects"), free: String(PLAN_LIMITS.FREE.projects), pro: String(PLAN_LIMITS.PRO.projects), studio: tx(t, "billing.feat.unlimited", "Unlimited") },
    { name: tx(t, "billing.feat.aiUnit", "AI generations / mo"), free: String(PLAN_LIMITS.FREE.aiGenerations), pro: String(PLAN_LIMITS.PRO.aiGenerations), studio: tx(t, "billing.feat.unlimited", "Unlimited") },
    { name: tx(t, "billing.feat.exportQuality", "Export quality"), free: "720p", pro: "1080p", studio: "4K" },
    { name: tx(t, "billing.feat.storage", "Storage"), free: "500 MB", pro: "5 GB", studio: "50 GB" },
    { name: tx(t, "billing.feat.advancedThumbs", "Advanced thumbnails"), free: false, pro: true, studio: true },
    { name: tx(t, "billing.feat.seo", "SEO toolkit"), free: false, pro: true, studio: true },
    { name: tx(t, "billing.feat.noWatermark", "No watermark"), free: false, pro: true, studio: true },
    { name: tx(t, "billing.feat.prioritySupport", "Priority support"), free: false, pro: true, studio: true },
    { name: tx(t, "billing.feat.teamUnit", "Team members"), free: false, pro: false, studio: `${PLAN_LIMITS.STUDIO.teamMembers}` },
    { name: tx(t, "billing.feat.api", "API access"), free: false, pro: false, studio: true },
    { name: tx(t, "billing.feat.whiteLabel", "White label"), free: false, pro: false, studio: true },
    { name: tx(t, "billing.feat.personalManager", "Personal manager"), free: false, pro: false, studio: true },
  ];
}

const FAQ_ITEMS: FaqItem[] = [
  { question: "Can I cancel anytime?", answer: "Yes — cancel in two clicks from your account. You keep access until the end of the current billing period." },
  { question: "What payment methods do you accept?", answer: "All major credit cards via Stripe. Plus Apple Pay and Google Pay where available." },
  { question: "Is there a free trial?", answer: "The Free plan is forever free. Upgrade only when you need more projects or AI generations." },
  { question: "Can I switch plans?", answer: "Yes — upgrade or downgrade anytime. Pro-rated charges apply automatically." },
  { question: "Do you offer refunds?", answer: "14-day money-back guarantee on all paid plans, no questions asked." },
  { question: "What happens when I reach my limit?", answer: "You will be prompted to upgrade. Existing work is never deleted or restricted." },
];

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment overdue",
  canceled: "Canceled",
  incomplete: "Incomplete",
  unpaid: "Unpaid",
};

/* ─────────────── Main ─────────────── */

export function BillingPage() {
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userPlan: PlanId = (session?.user?.plan as PlanId) ?? "FREE";

  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  /* Stripe redirect success */
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      toast.success(tx(t, "billing.successTitle", "Welcome to your new plan!"));
      trackEvent("upgrade_success", { plan: userPlan });
      router.replace("/billing", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* tRPC */
  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
      else if ("updated" in data && data.updated) {
        toast.success(tx(t, "billing.planUpdated", "Plan updated"));
        router.refresh();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const createPortal = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => toast.error(err.message),
  });

  const invoicesQuery = trpc.billing.getInvoices.useQuery(undefined, {
    enabled: userPlan !== "FREE",
  });
  const subscriptionQuery = trpc.billing.getSubscription.useQuery();
  const subscription = subscriptionQuery.data?.subscription ?? null;
  const isCancelledAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;

  const cancelSubscription = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "billing.cancelSuccess", "Subscription cancelled"));
      subscriptionQuery.refetch();
      setConfirmCancel(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const reactivateSubscription = trpc.billing.reactivateSubscription.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "billing.reactivateSuccess", "Subscription reactivated"));
      subscriptionQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const PLANS = useMemo(() => getPlans(t), [t]);
  const COMPARE = useMemo(() => getCompareFeatures(t), [t]);

  const handleSelect = useCallback(
    (planId: PlanId) => {
      if (planId === "FREE") {
        router.push("/dashboard");
        return;
      }
      if (planId === userPlan) {
        createPortal.mutate();
        return;
      }
      createCheckout.mutate({ plan: planId, annual: isAnnual });
    },
    [userPlan, isAnnual, createCheckout, createPortal, router],
  );

  /* ── Render ── */

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-12">
      {/* Hero header */}
      <header className="mb-8 sm:mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
          {tx(t, "billing.title", "Plans & Billing")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
          {tx(t, "billing.subtitle", "Start free, scale when you're ready. No hidden fees, cancel anytime.")}
        </p>
      </header>

      {/* Current plan banner (when paid) */}
      {userPlan !== "FREE" && subscription && (
        <CurrentPlanCard
          subscription={subscription}
          planLabel={userPlan}
          isCancelled={isCancelledAtPeriodEnd}
          onManage={() => createPortal.mutate()}
          onCancel={() => setConfirmCancel(true)}
          onReactivate={() => reactivateSubscription.mutate()}
          managePending={createPortal.isPending}
          reactivatePending={reactivateSubscription.isPending}
          t={t}
        />
      )}

      {/* Monthly/Annual toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-card border border-border">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={cn(
              "h-9 px-5 rounded-full text-sm font-semibold transition-all",
              !isAnnual ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tx(t, "billing.monthly", "Monthly")}
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={cn(
              "h-9 px-5 rounded-full text-sm font-semibold transition-all inline-flex items-center gap-2",
              isAnnual ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tx(t, "billing.annual", "Annual")}
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", isAnnual ? "bg-emerald-500 text-white" : "bg-emerald-500/15 text-emerald-500")}>
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-10 sm:mb-12">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isAnnual={isAnnual}
            isCurrent={plan.id === userPlan}
            onSelect={() => handleSelect(plan.id)}
            pending={createCheckout.isPending && createCheckout.variables?.plan === plan.id}
            t={t}
          />
        ))}
      </section>

      {/* Compare table (collapsible) */}
      <section className="mb-10">
        <button
          type="button"
          onClick={() => setShowCompare((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border hover:border-brand-500/40 transition-colors text-left"
        >
          <div>
            <h2 className="text-base font-bold text-foreground">
              {tx(t, "billing.compareAll", "Compare all features")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tx(t, "billing.compareAllSub", "Side-by-side breakdown of every feature in each plan.")}
            </p>
          </div>
          <ChevronDown className={cn("size-5 text-muted-foreground shrink-0 transition-transform", showCompare && "rotate-180")} />
        </button>
        {showCompare && (
          <div className="mt-2 rounded-xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {tx(t, "billing.feature", "Feature")}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[80px]">
                      Free
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-500 min-w-[80px]">
                      Pro
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-amber-500 min-w-[80px]">
                      Studio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((feat, i) => (
                    <tr key={i} className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-muted/10")}>
                      <td className="px-4 py-3 text-sm text-foreground">{feat.name}</td>
                      <td className="px-4 py-3 text-center"><CompareCell value={feat.free} /></td>
                      <td className="px-4 py-3 text-center"><CompareCell value={feat.pro} accent="brand" /></td>
                      <td className="px-4 py-3 text-center"><CompareCell value={feat.studio} accent="amber" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Payment history (paid plans only) */}
      {userPlan !== "FREE" && (
        <section className="mb-10">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground mb-4">
            {tx(t, "billing.paymentHistory", "Payment history")}
          </h2>
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            {invoicesQuery.isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={48} />)}
              </div>
            ) : invoicesQuery.data && invoicesQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tx(t, "billing.date", "Date")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tx(t, "billing.amount", "Amount")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tx(t, "billing.status", "Status")}</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesQuery.data.map((inv) => (
                      <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground font-mono">{new Date(inv.date * 1000).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-mono font-semibold">${(inv.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                            inv.status === "paid" && "bg-emerald-500/15 text-emerald-500",
                            inv.status === "open" && "bg-amber-500/15 text-amber-500",
                            inv.status === "void" && "bg-muted text-muted-foreground",
                          )}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {inv.pdf && (
                            <a
                              href={inv.pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400 transition-colors"
                            >
                              {tx(t, "billing.invoice", "Invoice")} <ExternalLink className="size-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {tx(t, "billing.noInvoices", "No payment history yet.")}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground mb-4">
          {tx(t, "billing.faqTitle", "Frequently asked questions")}
        </h2>
        <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">
          {FAQ_ITEMS.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full p-4 text-left hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-foreground">{item.question}</span>
                <ChevronDown className={cn("size-4 text-muted-foreground shrink-0 transition-transform", openFaq === i && "rotate-180")} />
              </div>
              {openFaq === i && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.answer}</p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Trust footer */}
      <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <ShieldCheck className="size-3.5 text-emerald-500" />
        <span>{tx(t, "billing.secureNote", "Secure payments powered by Stripe. 14-day money-back guarantee.")}</span>
      </div>

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_150ms]"
          onClick={() => setConfirmCancel(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {tx(t, "billing.cancelTitle", "Cancel subscription?")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {tx(t, "billing.cancelDesc", "You'll keep access to all Pro features until the end of your current billing period. No more charges after that.")}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="h-9 px-4 rounded-lg bg-muted hover:bg-card text-foreground text-sm font-semibold border border-border transition-colors"
              >
                {tx(t, "common.cancel", "Keep plan")}
              </button>
              <button
                type="button"
                onClick={() => cancelSubscription.mutate()}
                disabled={cancelSubscription.isPending}
                className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {cancelSubscription.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {tx(t, "billing.confirmCancel", "Cancel anyway")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

function CurrentPlanCard({
  subscription,
  planLabel,
  isCancelled,
  onManage,
  onCancel,
  onReactivate,
  managePending,
  reactivatePending,
  t,
}: {
  subscription: {
    id: string;
    status: string;
    cancelAt: number | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number | null;
  };
  planLabel: string;
  isCancelled: boolean;
  onManage: () => void;
  onCancel: () => void;
  onReactivate: () => void;
  managePending: boolean;
  reactivatePending: boolean;
  t: (k: string) => string;
}) {
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd * 1000) : null;
  const status = subscription.status ?? "unknown";
  

  return (
    <section className="mb-8 rounded-2xl bg-gradient-to-br from-brand-500/10 via-card to-card border border-brand-500/20 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="size-12 sm:size-14 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-500 shrink-0">
          <Zap className="size-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-foreground">{planLabel} {tx(t, "billing.plan", "plan")}</span>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
              status === "active" && "bg-emerald-500/15 text-emerald-500",
              status === "trialing" && "bg-brand-500/15 text-brand-500",
              status === "past_due" && "bg-red-500/15 text-red-500",
              status === "canceled" && "bg-muted text-muted-foreground",
            )}>
              {STATUS_LABEL[status] || status}
            </span>
            {isCancelled && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500">
                {tx(t, "billing.cancelsAtPeriodEnd", "Cancels at period end")}
              </span>
            )}
          </div>
          {periodEnd && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isCancelled
                ? `${tx(t, "billing.accessUntil", "Access until")} ${periodEnd.toLocaleDateString()}`
                : `${tx(t, "billing.renewsOn", "Renews on")} ${periodEnd.toLocaleDateString()}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onManage}
            disabled={managePending}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-card border border-border text-foreground text-xs font-semibold hover:border-brand-500/40 transition-colors disabled:opacity-50"
          >
            {managePending ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
            {tx(t, "billing.manageSubscription", "Manage in Stripe")}
          </button>
          {isCancelled ? (
            <button
              type="button"
              onClick={onReactivate}
              disabled={reactivatePending}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {reactivatePending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {tx(t, "billing.reactivate", "Reactivate")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors"
            >
              {tx(t, "billing.cancel", "Cancel")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  isAnnual,
  isCurrent,
  onSelect,
  pending,
  t,
}: {
  plan: PlanDef;
  isAnnual: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  pending: boolean;
  t: (k: string) => string;
}) {
  const price = isAnnual && plan.price > 0 ? plan.annualMonthly : plan.priceLabel;
  const annualNote = isAnnual && plan.price > 0 ? `$${plan.annualTotal}/${tx(t, "billing.yr", "yr")}` : null;

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card p-5 sm:p-6 flex flex-col transition-all",
        plan.highlight
          ? "border-brand-500/40 shadow-lg shadow-brand-500/10 lg:scale-[1.02]"
          : "border-border hover:border-brand-500/30",
      )}
    >
      {/* Badge ribbon */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 text-white shadow-lg">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("size-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", plan.gradient)}>
          {plan.icon}
        </div>
        <span className="text-lg font-bold text-foreground">{plan.name}</span>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground min-h-[36px]">{plan.description}</p>

      {/* Price */}
      <div className="mt-4 mb-1 flex items-baseline gap-1">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tighter font-mono text-foreground">{price}</span>
        {plan.price > 0 && (
          <span className="text-sm text-muted-foreground">/{tx(t, "billing.mo", "mo")}</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-5 min-h-[18px]">
        {annualNote ? `${annualNote} • ${tx(t, "billing.billedAnnually", "billed annually")}` : isAnnual ? "" : tx(t, "billing.billedMonthly", "billed monthly")}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onSelect}
        disabled={pending || (isCurrent && plan.id === "FREE")}
        className={cn(
          "h-11 rounded-lg font-semibold text-sm transition-all inline-flex items-center justify-center gap-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          plan.highlight
            ? "bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:scale-[1.01]"
            : isCurrent
              ? "bg-muted text-muted-foreground"
              : "bg-foreground text-background hover:opacity-90",
          (pending || (isCurrent && plan.id === "FREE")) && "opacity-50 cursor-not-allowed",
        )}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {tx(t, "common.loading", "Loading...")}
          </>
        ) : isCurrent ? (
          tx(t, "billing.currentPlan", "Current plan")
        ) : (
          plan.buttonLabel
        )}
      </button>

      {/* Features */}
      <ul className="mt-5 space-y-2.5 flex-1">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="size-4 text-brand-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{feat}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompareCell({ value, accent }: { value: string | boolean; accent?: "brand" | "amber" }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={cn(
        "size-5 mx-auto",
        accent === "brand" ? "text-brand-500" : accent === "amber" ? "text-amber-500" : "text-emerald-500",
      )} />
    ) : (
      <X className="size-4 mx-auto text-muted-foreground/40" />
    );
  }
  return (
    <span className={cn(
      "text-sm font-semibold",
      accent === "brand" ? "text-brand-500" : accent === "amber" ? "text-amber-500" : "text-foreground",
    )}>
      {value}
    </span>
  );
}
