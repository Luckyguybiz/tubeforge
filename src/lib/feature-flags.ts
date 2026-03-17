export interface FeatureFlags {
  aiVideoGeneration: boolean;
  aiThumbnails: boolean;
  aiMetadata: boolean;
  teamCollaboration: boolean;
  advancedAnalytics: boolean;
  scheduledPublish: boolean;
}

const defaultFlags: FeatureFlags = {
  aiVideoGeneration: true,
  aiThumbnails: true,
  aiMetadata: true,
  teamCollaboration: false,
  advancedAnalytics: false,
  scheduledPublish: false,
};

function loadFlags(): FeatureFlags {
  const envOverride = process.env.NEXT_PUBLIC_FLAGS;

  if (!envOverride) return { ...defaultFlags };

  const enabled = envOverride
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const result: FeatureFlags = {
    aiVideoGeneration: false,
    aiThumbnails: false,
    aiMetadata: false,
    teamCollaboration: false,
    advancedAnalytics: false,
    scheduledPublish: false,
  };

  for (const key of enabled) {
    if (key in result) {
      (result as unknown as Record<string, boolean>)[key] = true;
    }
  }

  return result;
}

export const flags: FeatureFlags = loadFlags();

export function isFeatureEnabled(flag: string): boolean {
  if (flag in flags) {
    return flags[flag as keyof FeatureFlags];
  }
  return false;
}
