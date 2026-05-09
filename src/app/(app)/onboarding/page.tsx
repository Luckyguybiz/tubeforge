// This page intentionally uses dark theme (renders without app layout).
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Users as UsersIcon,
  TrendingUp,
  Clock as ClockIcon,
  ImageIcon,
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  Crown,
  Zap,
  Rocket,
  PartyPopper,
} from "lucide-react";

/* ── Constants ────────────────────────────────────────── */
const TOTAL_QUIZ_STEPS = 4;
const COUNTDOWN_SECONDS = 15 * 60;
const LS_QUIZ_KEY = "tf-onboarding-quiz";
const LS_DONE_KEY = "tf-quiz-done";

interface QuizAnswers {
  usage?: string;
  goal?: string;
  frequency?: string;
  tools?: string[];
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function cls(...args: (string | false | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

/* ── Tool brand SVGs (anti-силиконность: real logos) ─── */
const TOOL_BRANDS: Record<string, { color: string; mark: string }> = {
  vidiq: { color: "#FF1B6B", mark: "vidIQ" },
  tubebuddy: { color: "#3373DC", mark: "TB" },
  canva: { color: "#00C4CC", mark: "C" },
  capcut: { color: "#000000", mark: "✂" },
  invideo: { color: "#0080FF", mark: "iV" },
  none: { color: "#737373", mark: "○" },
};

function ToolMark({ id, selected }: { id: string; selected: boolean }) {
  const brand = TOOL_BRANDS[id];
  if (!brand) return null;
  return (
    <span
      className={cls(
        "flex size-9 shrink-0 items-center justify-center rounded-lg font-bold text-white text-[12px] transition-transform",
        selected && "scale-110",
      )}
      style={{ background: brand.color }}
      aria-hidden
    >
      {brand.mark}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════ */

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);

  /* Skip if already done */
  useEffect(() => {
    try {
      if (localStorage.getItem(LS_DONE_KEY) === "true") {
        router.replace("/ai-thumbnails");
      }
    } catch {}
  }, [router]);

  /* Restore saved answers */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_QUIZ_KEY);
      if (saved) setAnswers(JSON.parse(saved));
    } catch {}
  }, []);

  /* Persist answers */
  useEffect(() => {
    try {
      localStorage.setItem(LS_QUIZ_KEY, JSON.stringify(answers));
    } catch {}
  }, [answers]);

  /* Countdown timer */
  useEffect(() => {
    if (step !== 4 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((p) => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const goToStep = useCallback(
    (nextStep: number, direction: "forward" | "backward") => {
      setSlideDirection(direction);
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(nextStep);
        setIsTransitioning(false);
      }, 180);
    },
    [],
  );

  const canContinue = useCallback((): boolean => {
    switch (step) {
      case 0: return !!answers.usage;
      case 1: return !!answers.goal;
      case 2: return !!answers.frequency;
      case 3: return !!answers.tools && answers.tools.length > 0;
      default: return true;
    }
  }, [step, answers]);

  const handleContinue = useCallback(() => {
    if (!canContinue()) return;
    if (step < TOTAL_QUIZ_STEPS - 1) goToStep(step + 1, "forward");
    else if (step === TOTAL_QUIZ_STEPS - 1) goToStep(4, "forward");
  }, [canContinue, step, goToStep]);

  const handleBack = useCallback(() => {
    if (step > 0) goToStep(step - 1, "backward");
  }, [step, goToStep]);

  const handleSkip = useCallback(() => {
    try { localStorage.setItem(LS_DONE_KEY, "true"); } catch {}
    router.replace("/ai-thumbnails");
  }, [router]);

  const handleClaimOffer = useCallback(() => {
    try { localStorage.setItem(LS_DONE_KEY, "true"); } catch {}
    router.replace("/billing?plan=pro");
  }, [router]);

  const handleSkipOffer = useCallback(() => {
    try { localStorage.setItem(LS_DONE_KEY, "true"); } catch {}
    router.replace("/ai-thumbnails");
  }, [router]);

  const progressPct = step <= 3 ? ((step + 1) / TOTAL_QUIZ_STEPS) * 100 : 100;
  const isQuizStep = step <= 3;

  /* ── Slide transition helpers ─────────────────────── */
  const slideClass = cls(
    "transition-all duration-200",
    isTransitioning && (slideDirection === "forward" ? "opacity-0 translate-x-8" : "opacity-0 -translate-x-8"),
  );

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#0a0a0a] text-white">
      {/* Decorative gradient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(99,102,241,0.18) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.10) 0%, transparent 60%)",
        }}
      />

      {/* ── Top bar: progress + skip ─────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 shadow-lg shadow-brand-500/30">
            <span className="text-[12px] font-black text-white">TF</span>
          </div>
          <span className="text-[14px] font-bold tracking-tight">TubeForge</span>
        </div>
        {isQuizStep && (
          <button
            onClick={handleSkip}
            className="text-[13px] font-medium text-white/40 transition-colors hover:text-white/70"
          >
            Skip onboarding
          </button>
        )}
      </header>

      {/* ── Progress bar ─────────────────────────────────── */}
      {isQuizStep && (
        <div className="relative z-10 mx-auto -mt-2 w-full max-w-2xl px-6 sm:px-10">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white/50">
            <span>Step {step + 1} of {TOTAL_QUIZ_STEPS}</span>
            <span className="font-mono">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          {step === 0 && (
            <Step1Usage
              value={answers.usage}
              onChange={(v) => setAnswers((a) => ({ ...a, usage: v }))}
              slideClass={slideClass}
            />
          )}
          {step === 1 && (
            <Step2Goal
              value={answers.goal}
              onChange={(v) => setAnswers((a) => ({ ...a, goal: v }))}
              slideClass={slideClass}
            />
          )}
          {step === 2 && (
            <Step3Frequency
              value={answers.frequency}
              onChange={(v) => setAnswers((a) => ({ ...a, frequency: v }))}
              slideClass={slideClass}
            />
          )}
          {step === 3 && (
            <Step4Tools
              value={answers.tools ?? []}
              onChange={(tools) => setAnswers((a) => ({ ...a, tools }))}
              slideClass={slideClass}
            />
          )}
          {step === 4 && (
            <OfferStep
              countdown={countdown}
              onClaim={handleClaimOffer}
              onSkip={handleSkipOffer}
              slideClass={slideClass}
            />
          )}

          {/* ── Navigation ────────────────────────────── */}
          {isQuizStep && (
            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 0 ? (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white/80 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={handleContinue}
                disabled={!canContinue()}
                className={cls(
                  "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-bold transition-all sm:max-w-xs",
                  canContinue()
                    ? "bg-gradient-to-r from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-500/30 hover:scale-[1.02]"
                    : "cursor-not-allowed bg-white/5 text-white/30",
                )}
              >
                {step === 3 ? "See my results" : "Continue"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   STEP 1: Usage
   ──────────────────────────────────────────────────────── */
function Step1Usage({
  value,
  onChange,
  slideClass,
}: {
  value?: string;
  onChange: (v: string) => void;
  slideClass: string;
}) {
  const opts = [
    { id: "personal", title: "For personal use", desc: "Solo creators growing their channel", Icon: Sparkles, gradient: "from-violet-500 to-fuchsia-500" },
    { id: "team", title: "With my team", desc: "Agencies & teams collaborating at scale", Icon: UsersIcon, gradient: "from-blue-500 to-cyan-500" },
  ];
  return (
    <div className={slideClass}>
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
          <Sparkles className="size-3" />
          Welcome
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          How do you plan to use TubeForge?
        </h1>
        <p className="mt-2 text-[14px] text-white/55 sm:text-base">
          We&apos;ll personalize your experience.
        </p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {opts.map((opt) => {
          const Icon = opt.Icon;
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cls(
                "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200",
                selected
                  ? "border-brand-500 bg-gradient-to-br from-brand-500/10 to-violet-500/10 shadow-md shadow-brand-500/20"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
            >
              <div className={cls(
                "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
                opt.gradient,
                selected ? "shadow-brand-500/30" : "shadow-black/30",
              )}>
                <Icon className="size-5 text-white" />
              </div>
              <h3 className="mt-3 text-[16px] font-bold">{opt.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-white/55">{opt.desc}</p>
              {selected && (
                <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-brand-500">
                  <Check className="size-3 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   STEP 2: Goal
   ──────────────────────────────────────────────────────── */
function Step2Goal({
  value,
  onChange,
  slideClass,
}: {
  value?: string;
  onChange: (v: string) => void;
  slideClass: string;
}) {
  const goals = [
    { id: "grow", title: "Grow my channel", desc: "More views, subs, engagement", Icon: TrendingUp, gradient: "from-emerald-500 to-cyan-500" },
    { id: "save-time", title: "Save time on editing", desc: "AI tools speed up creation", Icon: ClockIcon, gradient: "from-amber-500 to-orange-500" },
    { id: "thumbnails", title: "Better thumbnails", desc: "Click-worthy designs that convert", Icon: ImageIcon, gradient: "from-pink-500 to-rose-500" },
    { id: "seo", title: "Optimize SEO", desc: "Rank higher in YouTube search", Icon: Search, gradient: "from-blue-500 to-indigo-500" },
  ];
  return (
    <div className={slideClass}>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          What&apos;s your main goal?
        </h1>
        <p className="mt-2 text-[14px] text-white/55 sm:text-base">
          Pick one — you can change later.
        </p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {goals.map((g) => {
          const Icon = g.Icon;
          const selected = value === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange(g.id)}
              className={cls(
                "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all",
                selected
                  ? "border-brand-500 bg-gradient-to-br from-brand-500/10 to-violet-500/10 shadow-md shadow-brand-500/20"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
            >
              <div className={cls("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-black/30", g.gradient)}>
                <Icon className="size-5 text-white" />
              </div>
              <h3 className="mt-3 text-[15px] font-bold">{g.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-white/55">{g.desc}</p>
              {selected && (
                <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-brand-500">
                  <Check className="size-3 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   STEP 3: Frequency
   ──────────────────────────────────────────────────────── */
function Step3Frequency({
  value,
  onChange,
  slideClass,
}: {
  value?: string;
  onChange: (v: string) => void;
  slideClass: string;
}) {
  const freqs = [
    { id: "1-2", label: "1–2 videos", subtitle: "Just starting" },
    { id: "3-5", label: "3–5 videos", subtitle: "Regular creator" },
    { id: "6-10", label: "6–10 videos", subtitle: "Power user" },
    { id: "10+", label: "10+ videos", subtitle: "Pro production" },
  ];
  return (
    <div className={slideClass}>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How many videos per month?
        </h1>
        <p className="mt-2 text-[14px] text-white/55 sm:text-base">
          We&apos;ll recommend the right plan.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {freqs.map((f) => {
          const selected = value === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              className={cls(
                "relative rounded-2xl border px-4 py-5 text-center transition-all",
                selected
                  ? "border-brand-500 bg-gradient-to-br from-brand-500/15 to-violet-500/10 shadow-md shadow-brand-500/20"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
            >
              <div className={cls(
                "font-mono text-2xl font-bold sm:text-3xl",
                selected ? "text-white" : "text-white/85",
              )}>
                {f.label.split(" ")[0]}
              </div>
              <div className="mt-1 text-[11px] text-white/55">{f.subtitle}</div>
              {selected && (
                <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-brand-500">
                  <Check className="size-2.5 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   STEP 4: Tools
   ──────────────────────────────────────────────────────── */
function Step4Tools({
  value,
  onChange,
  slideClass,
}: {
  value: string[];
  onChange: (tools: string[]) => void;
  slideClass: string;
}) {
  const tools = [
    { id: "vidiq", label: "vidIQ" },
    { id: "tubebuddy", label: "TubeBuddy" },
    { id: "canva", label: "Canva" },
    { id: "capcut", label: "CapCut" },
    { id: "invideo", label: "InVideo" },
    { id: "none", label: "None — I'm new!" },
  ];
  const toggleTool = (id: string) => {
    if (id === "none") {
      onChange(value.includes("none") ? [] : ["none"]);
      return;
    }
    const withoutNone = value.filter((t) => t !== "none");
    if (withoutNone.includes(id)) onChange(withoutNone.filter((t) => t !== id));
    else onChange([...withoutNone, id]);
  };
  return (
    <div className={slideClass}>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          What tools have you tried?
        </h1>
        <p className="mt-2 text-[14px] text-white/55 sm:text-base">
          Select all that apply — we&apos;ll show how TubeForge compares.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tools.map((tool) => {
          const selected = value.includes(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => toggleTool(tool.id)}
              className={cls(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                selected
                  ? "border-brand-500 bg-gradient-to-br from-brand-500/10 to-violet-500/10 shadow-sm shadow-brand-500/15"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
            >
              <ToolMark id={tool.id} selected={selected} />
              <span className="flex-1 text-[14px] font-semibold">{tool.label}</span>
              <span
                className={cls(
                  "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                  selected ? "border-brand-500 bg-brand-500" : "border-white/15 bg-transparent",
                )}
              >
                {selected && <Check className="size-3 text-white" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   STEP 5: Offer
   ──────────────────────────────────────────────────────── */
function OfferStep({
  countdown,
  onClaim,
  onSkip,
  slideClass,
}: {
  countdown: number;
  onClaim: () => void;
  onSkip: () => void;
  slideClass: string;
}) {
  const expired = countdown <= 0;
  return (
    <div className={cls(slideClass, "text-center")}>
      <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/30">
        <PartyPopper className="size-7 text-white" />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome to TubeForge!
      </h1>
      <p className="mt-2 text-[14px] text-white/60 sm:text-base">
        Based on your answers,{" "}
        <strong className="text-white">Pro plan</strong> is perfect for you.
      </p>

      {/* Offer card */}
      <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-500/15 to-violet-500/10 p-6 shadow-2xl shadow-brand-500/30 sm:p-8">
        {/* SPECIAL OFFER chip */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-400">
          <Crown className="size-3" />
          Limited offer
        </div>

        <div className="mt-4 text-[18px] font-bold sm:text-[20px]">
          50% off your first month
        </div>

        <div className="mt-3 flex items-baseline justify-center gap-2">
          <span className="font-mono text-2xl text-white/40 line-through">$12</span>
          <span className="font-mono text-5xl font-black tracking-tight">$6</span>
          <span className="text-[15px] text-white/60">/mo</span>
        </div>

        <div className="mt-1 text-[13px] text-white/55">
          Save $6 today. Cancel anytime.
        </div>

        {/* Countdown */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[13px]">
          <ClockIcon className="size-3.5 text-white/60" />
          {expired ? (
            <span className="font-semibold text-rose-400">Offer expired</span>
          ) : (
            <>
              <span className="text-white/60">Offer expires in</span>
              <span className="font-mono font-bold text-white">
                {formatCountdown(countdown)}
              </span>
            </>
          )}
        </div>

        {/* Features */}
        <ul className="mt-5 space-y-2 text-left">
          {[
            "Unlimited AI thumbnails",
            "Priority video generation",
            "Advanced metadata + SEO",
            "Premium support",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <span className="text-[13px] text-white/85">{f}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClaim}
          disabled={expired}
          className={cls(
            "mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-all",
            expired
              ? "cursor-not-allowed bg-white/5 text-white/30"
              : "bg-gradient-to-r from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-500/30 hover:scale-[1.02]",
          )}
        >
          <Rocket className="size-4" />
          {expired ? "Offer expired" : "Claim 50% off"}
          {!expired && <ArrowRight className="size-4" />}
        </button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white/40 transition-colors hover:text-white/70"
      >
        Skip for now
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}
