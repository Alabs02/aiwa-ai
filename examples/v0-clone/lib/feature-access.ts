export type UserPlan = "free" | "pro" | "advanced" | "white_label";

export interface FeatureAccess {
  canExport: boolean;
  canDownload: boolean;
  canUseGitHub: boolean;
  canUsePromptEnhancer: boolean;
  canUsePromptLibrary: boolean;
  canUsePromptAnalysis: boolean;
  maxProjects: number;
  hasUnlimitedSubdomains: boolean;
  hasAutoSyncGitHub: boolean;
  hasCreditRollover: boolean;
}

export function getFeatureAccess(plan: UserPlan): FeatureAccess {
  const features: Record<UserPlan, FeatureAccess> = {
    free: {
      canExport: false,
      canDownload: false,
      canUseGitHub: false,
      canUsePromptEnhancer: false,
      canUsePromptLibrary: false,
      canUsePromptAnalysis: true,
      maxProjects: 1,
      hasUnlimitedSubdomains: false,
      hasAutoSyncGitHub: false,
      hasCreditRollover: false
    },
    pro: {
      canExport: true,
      canDownload: true,
      canUseGitHub: true,
      canUsePromptEnhancer: true,
      canUsePromptLibrary: true,
      canUsePromptAnalysis: true,
      maxProjects: 10,
      hasUnlimitedSubdomains: true,
      hasAutoSyncGitHub: false,
      hasCreditRollover: true
    },
    advanced: {
      canExport: true,
      canDownload: true,
      canUseGitHub: true,
      canUsePromptEnhancer: true,
      canUsePromptLibrary: true,
      canUsePromptAnalysis: true,
      maxProjects: -1, // unlimited
      hasUnlimitedSubdomains: true,
      hasAutoSyncGitHub: true,
      hasCreditRollover: true
    },
    white_label: {
      canExport: true,
      canDownload: true,
      canUseGitHub: true,
      canUsePromptEnhancer: true,
      canUsePromptLibrary: true,
      canUsePromptAnalysis: true,
      maxProjects: -1,
      hasUnlimitedSubdomains: true,
      hasAutoSyncGitHub: true,
      hasCreditRollover: true
    }
  };

  return features[plan];
}

export function canAccessFeature(
  plan: UserPlan,
  feature: keyof FeatureAccess
): boolean {
  return getFeatureAccess(plan)[feature] as boolean;
}
