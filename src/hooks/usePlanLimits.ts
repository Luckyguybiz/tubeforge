import { trpc } from '@/lib/trpc';
import { PLAN_LIMITS } from '@/lib/constants';

/**
 * Frontend-visible plan limits derived from the single source of truth
 * in `lib/constants.ts`. Previously the hook hard-coded `99999` for both
 * FREE and PRO, which meant the dashboard sidebar showed "AI generations
 * 2/99999" — wildly off from the real 50-credit FREE budget and left
 * PRO looking identical to FREE (no upgrade incentive in the UI).
 */
const LIMITS: Record<string, { projects: number; ai: number }> = {
  FREE: { projects: PLAN_LIMITS.FREE.projects, ai: PLAN_LIMITS.FREE.aiGenerations },
  PRO: { projects: PLAN_LIMITS.PRO.projects, ai: PLAN_LIMITS.PRO.aiGenerations },
  STUDIO: { projects: PLAN_LIMITS.STUDIO.projects, ai: PLAN_LIMITS.STUDIO.aiGenerations },
};

export function usePlanLimits() {
  const profile = trpc.user.getProfile.useQuery();

  const plan = (profile.data?.plan ?? 'FREE') as 'FREE' | 'PRO' | 'STUDIO';
  const limits = LIMITS[plan];
  const projectCount = profile.data?._count?.projects ?? 0;
  const aiCount = profile.data?.aiUsage ?? 0;

  return {
    plan,
    isLoading: profile.isLoading,
    isError: profile.isError,
    error: profile.error,
    refetch: profile.refetch,
    canCreateProject: projectCount < limits.projects,
    canUseAI: aiCount < limits.ai,
    remainingProjects: Math.max(0, limits.projects - projectCount),
    remainingAI: Math.max(0, limits.ai - aiCount),
    projectCount,
    aiCount,
    limits,
  };
}


export function getPlanLimits(plan: string) {
  return LIMITS[plan] ?? LIMITS.FREE;
}

export function getUpgradePrompt(plan: string, aiUsage: number, projectCount: number) {
  const limits = getPlanLimits(plan);
  if (plan !== 'FREE') return null;

  if (aiUsage >= limits.ai - 1) {
    return { type: 'ai' as const, message: 'You have 1 AI generation left. Upgrade for unlimited.' };
  }
  if (projectCount >= limits.projects - 1) {
    return { type: 'projects' as const, message: 'You can create 1 more project. Upgrade for unlimited.' };
  }
  return null;
}
