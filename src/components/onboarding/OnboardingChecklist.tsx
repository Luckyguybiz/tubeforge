'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { useSession } from 'next-auth/react';

/* ── Checklist step definitions ─────────────────────────── */

interface ChecklistStep {
  id: string;
  label: string;
  href?: string;
}

const STEPS: ChecklistStep[] = [
  { id: 'account', label: '\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442' },
  { id: 'project', label: '\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0435\u0440\u0432\u044B\u0439 \u043F\u0440\u043E\u0435\u043A\u0442', href: '/editor' },
  { id: 'ai', label: '\u0421\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0446\u0435\u043D\u0443 \u0441 \u0418\u0418', href: '/editor' },
  { id: 'export', label: '\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u0438\u0434\u0435\u043E', href: '/editor' },
  { id: 'profile', label: '\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C', href: '/settings' },
];

const LS_KEY = 'tf-onboarding-checklist-hidden';

/* ── Component ─────────────────────────────────────────── */

export function OnboardingChecklist() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const router = useRouter();
  const { data: session } = useSession();

  const [hidden, setHidden] = useState(true); // start hidden, show after check
  const [hov, setHov] = useState<string | null>(null);

  const profile = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY);
    if (dismissed === 'true') {
      setHidden(true);
    } else {
      setHidden(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(LS_KEY, 'true');
    setHidden(true);
  }, []);

  if (hidden || !profile.data) return null;

  const user = profile.data;
  const projectCount = user._count?.projects ?? 0;
  const aiUsage = user.aiUsage ?? 0;
  const hasName = !!(user.name && user.name.trim());

  // Determine completion status for each step
  const completed: Record<string, boolean> = {
    account: true, // always complete if they see the dashboard
    project: projectCount > 0,
    ai: aiUsage > 0,
    export: projectCount > 0 && aiUsage > 0, // approximate: if they've used AI on a project
    profile: hasName && !!(user.image),
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalCount = STEPS.length;

  // If all completed, don't show
  if (completedCount === totalCount) return null;

  const pct = Math.round((completedCount / totalCount) * 100);

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '20px 22px',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${C.accent}, ${C.purple ?? C.accent})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-.01em' }}>
              {'\u041D\u0430\u0447\u0430\u043B\u043E \u0440\u0430\u0431\u043E\u0442\u044B'}
            </div>
            <div style={{ fontSize: 12, color: C.sub }}>
              {completedCount} {'\u0438\u0437'} {totalCount} {'\u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E'}
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          onMouseEnter={() => setHov('dismiss')}
          onMouseLeave={() => setHov(null)}
          style={{
            background: hov === 'dismiss' ? (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)') : 'transparent',
            border: 'none',
            color: C.dim,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '6px 12px',
            borderRadius: 8,
            transition: 'all .15s',
          }}
        >
          {'\u0421\u043A\u0440\u044B\u0442\u044C'}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 6,
        borderRadius: 3,
        background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 3,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${C.accent}, ${C.purple ?? C.accent})`,
          transition: 'width .4s ease',
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STEPS.map((step) => {
          const done = completed[step.id];
          return (
            <div
              key={step.id}
              onClick={() => {
                if (!done && step.href) router.push(step.href);
              }}
              onMouseEnter={() => setHov(step.id)}
              onMouseLeave={() => setHov(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 10,
                cursor: done ? 'default' : step.href ? 'pointer' : 'default',
                background: hov === step.id && !done ? (isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)') : 'transparent',
                transition: 'background .15s',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: done ? 'none' : `2px solid ${C.border}`,
                background: done ? C.green ?? '#22c55e' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all .2s',
              }}>
                {done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: done ? C.dim : C.text,
                textDecoration: done ? 'line-through' : 'none',
                opacity: done ? 0.6 : 1,
                flex: 1,
              }}>
                {step.label}
              </span>

              {/* Arrow for incomplete items with href */}
              {!done && step.href && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: hov === step.id ? 1 : 0.4, transition: 'opacity .15s' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
