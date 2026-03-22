'use client';

import { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { useSession } from 'next-auth/react';

/* ── Milestone definitions ─────────────────────────────── */

interface Milestone {
  id: string;
  icon: string;
  labelKey: string;
  check: (data: MilestoneData) => boolean;
}

interface MilestoneData {
  projectCount: number;
  referralCount: number;
}

const MILESTONES: Milestone[] = [
  {
    id: 'first-project',
    icon: '\uD83C\uDFAC',
    labelKey: 'milestone.firstVideo',
    check: (d) => d.projectCount >= 1,
  },
  {
    id: 'ten-projects',
    icon: '\u2B50',
    labelKey: 'milestone.advancedCreator',
    check: (d) => d.projectCount >= 10,
  },
  {
    id: 'first-referral',
    icon: '\uD83E\uDD1D',
    labelKey: 'milestone.ambassador',
    check: (d) => d.referralCount >= 1,
  },
];

const LS_KEY = 'tf-milestones-shown';

function getShownMilestones(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markMilestoneShown(id: string) {
  const shown = getShownMilestones();
  shown.add(id);
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(shown)));
}

/* ── Component ─────────────────────────────────────────── */

export function UsageMilestones() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const isDark = useThemeStore((s) => s.isDark);
  const { data: session } = useSession();

  const [visibleMilestone, setVisibleMilestone] = useState<Milestone | null>(null);
  const [animating, setAnimating] = useState(false);

  const profile = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });

  const referral = trpc.referral.getMyReferral.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (!profile.data) return;

    const data: MilestoneData = {
      projectCount: profile.data._count?.projects ?? 0,
      referralCount: (referral.data as { referredCount?: number } | undefined)?.referredCount ?? 0,
    };

    const shown = getShownMilestones();

    // Find first unshown achieved milestone
    for (const m of MILESTONES) {
      if (m.check(data) && !shown.has(m.id)) {
        setVisibleMilestone(m);
        markMilestoneShown(m.id);
        setAnimating(true);
        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
          setAnimating(false);
          setTimeout(() => setVisibleMilestone(null), 300);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [profile.data, referral.data]);

  const handleDismiss = useCallback(() => {
    setAnimating(false);
    setTimeout(() => setVisibleMilestone(null), 300);
  }, []);

  if (!visibleMilestone) return null;

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 900,
        background: isDark
          ? 'linear-gradient(135deg, rgba(30,30,50,.98), rgba(20,20,35,.99))'
          : 'linear-gradient(135deg, rgba(255,255,255,.99), rgba(248,248,252,.99))',
        border: `1px solid ${isDark ? 'rgba(255,255,255,.1)' : C.border}`,
        borderRadius: 16,
        padding: '16px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: isDark
          ? '0 12px 40px rgba(0,0,0,.5)'
          : '0 12px 40px rgba(0,0,0,.15)',
        cursor: 'pointer',
        transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        transform: animating ? 'translateY(0)' : 'translateY(20px)',
        opacity: animating ? 1 : 0,
        maxWidth: 320,
      }}
    >
      <span style={{ fontSize: 28 }}>{visibleMilestone.icon}</span>
      <div>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
          letterSpacing: '-.01em',
        }}>
          {t('milestone.unlocked')}
        </div>
        <div style={{
          fontSize: 15,
          fontWeight: 800,
          color: C.accent,
          letterSpacing: '-.01em',
          marginTop: 2,
        }}>
          {t(visibleMilestone.labelKey)}
        </div>
      </div>
    </div>
  );
}
