import { trpc } from '@/lib/trpc';

const LIMITS: Record<string, { projects: number; ai: number }> = {
  FREE: { projects: 3, ai: 5 },
  PRO: { projects: 25, ai: 100 },
  STUDIO: { projects: Infinity, ai: Infinity },
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
