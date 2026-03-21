'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { useSession } from 'next-auth/react';

/* ── Checklist step definitions ─────────────────────────── */

interface ChecklistStep {
  id: string;
  labelKey: string;
  href?: string;
}

const STEPS: ChecklistStep[] = [
  { id: 'account', labelKey: 'checklist.account' },
  { id: 'project', labelKey: 'checklist.project', href: '/editor' },
  { id: 'ai', labelKey: 'checklist.ai', href: '/editor' },
  { id: 'export', labelKey: 'checklist.export', href: '/editor' },
  { id: 'profile', labelKey: 'checklist.profile', href: '/settings' },
];

const LS_KEY = 'tf-onboarding-checklist-hidden';

/* ── Component ─────────────────────────────────────────── */

export function OnboardingChecklist() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
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

  const completedLabel = t('checklist.completedOf')
    .replace('{completed}', String(completedCount))
    .replace('{total}', String(totalCount));

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
              {t('checklist.title')}
            </div>
            <div style={{ fontSize: 12, color: C.sub }}>
              {completedLabel}
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
          {t('checklist.hide')}
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
                {t(step.labelKey)}
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
