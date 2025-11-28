export type UserPlan = "free" | "pro" | "advanced" | "ultimate" | "white_label";

export interface FeatureAccess {
  canExport: boolean;
  canDownload: boolean;
  canUseGitHub: boolean;
  canUsePromptEnhancer: boolean;
  canUsePromptLibrary: boolean;
  canUsePromptAnalysis: boolean;
  maxProjects: number;
  maxIntegrations: number; // New field for integration limits
  hasUnlimitedSubdomains: boolean;
  hasAutoSyncGitHub: boolean;
  hasCreditRollover: boolean;
  hasInAppCodeEdit: boolean; // Future feature
  hasCloneWebsite: boolean; // Future feature
  hasPrioritySupport: boolean;
  hasVIPSupport: boolean;
}

export function getFeatureAccess(
  plan: UserPlan,
  isAdmin: boolean = false
): FeatureAccess {
  // Admin users get full access to everything
  if (isAdmin) {
    return {
      canExport: true,
      canDownload: true,
      canUseGitHub: true,
      canUsePromptEnhancer: true,
      canUsePromptLibrary: true,
      canUsePromptAnalysis: true,
      maxProjects: -1, // unlimited
      maxIntegrations: -1, // unlimited
      hasUnlimitedSubdomains: true,
      hasAutoSyncGitHub: true,
      hasCreditRollover: true,
      hasInAppCodeEdit: true,
      hasCloneWebsite: true,
      hasPrioritySupport: true,
      hasVIPSupport: true
    };
  }

  const features: Record<UserPlan, FeatureAccess> = {
    free: {
      canExport: false,
      canDownload: false,
      canUseGitHub: false,
      canUsePromptEnhancer: false,
      canUsePromptLibrary: false,
      canUsePromptAnalysis: true,
      maxProjects: 1,
      maxIntegrations: 0,
      hasUnlimitedSubdomains: false,
      hasAutoSyncGitHub: false,
      hasCreditRollover: false,
      hasInAppCodeEdit: false,
      hasCloneWebsite: false,
      hasPrioritySupport: false,
      hasVIPSupport: false
    },
    pro: {
      canExport: true,
      canDownload: true,
      canUseGitHub: true,
      canUsePromptEnhancer: true,
      canUsePromptLibrary: true,
      canUsePromptAnalysis: true,
      maxProjects: 10,
      maxIntegrations: 5, // Updated for new pricing
      hasUnlimitedSubdomains: true,
      hasAutoSyncGitHub: false,
      hasCreditRollover: true,
      hasInAppCodeEdit: false,
      hasCloneWebsite: false,
      hasPrioritySupport: false,
      hasVIPSupport: false
    },
    advanced: {
      canExport: true,
      canDownload: true,
      canUseGitHub: true,
      canUsePromptEnhancer: true,
      canUsePromptLibrary: true,
      canUsePromptAnalysis: true,
      maxProjects: -1, // unlimited
      maxIntegrations: 10, // Updated for new pricing
      hasUnlimitedSubdomains: true,
      hasAutoSyncGitHub: true,
      hasCreditRollover: true,
      hasInAppCodeEdit: false,
      hasCloneWebsite: false,
      hasPrioritySupport: true,
      hasVIPSupport: false
    },
    ultimate: {
      canExport: true,
      canDownload: true,
      canUseGitHub: true,
      canUsePromptEnhancer: true,
      canUsePromptLibrary: true,
      canUsePromptAnalysis: true,
      maxProjects: -1, // unlimited
      maxIntegrations: 20, // New ultimate tier
      hasUnlimitedSubdomains: true,
      hasAutoSyncGitHub: true,
      hasCreditRollover: true,
      hasInAppCodeEdit: true, // Future feature - ultimate exclusive
      hasCloneWebsite: true, // Future feature - ultimate exclusive
      hasPrioritySupport: true,
      hasVIPSupport: true
    },
    white_label: {
      canExport: true,
      canDownload: true,
      canUseGitHub: true,
      canUsePromptEnhancer: true,
      canUsePromptLibrary: true,
      canUsePromptAnalysis: true,
      maxProjects: -1,
      maxIntegrations: -1,
      hasUnlimitedSubdomains: true,
      hasAutoSyncGitHub: true,
      hasCreditRollover: true,
      hasInAppCodeEdit: true,
      hasCloneWebsite: true,
      hasPrioritySupport: true,
      hasVIPSupport: true
    }
  };

  return features[plan];
}

export function canAccessFeature(
  plan: UserPlan,
  feature: keyof FeatureAccess,
  isAdmin: boolean = false
): boolean {
  return getFeatureAccess(plan, isAdmin)[feature] as boolean;
}
