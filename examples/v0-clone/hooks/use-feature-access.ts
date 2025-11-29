import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useUserSubscriptionStore } from "@/store/user-subscription.store";
import { getFeatureAccess, type FeatureAccess } from "@/lib/feature-access";

export interface FeatureGuardResult extends FeatureAccess {
  isLoading: boolean;
  error: string | null;
  plan: string;
  isAdmin: boolean;
  creditsRemaining: number;
  refresh: () => Promise<void>;
}

/**
 * Hook to check feature access based on user plan and role
 * Automatically fetches user data on mount if authenticated
 */
export function useFeatureAccess(): FeatureGuardResult {
  const { status } = useSession();
  const {
    subscription,
    role,
    isLoading,
    error,
    fetchUserData,
    getPlan,
    isAdmin,
    getCreditsRemaining
  } = useUserSubscriptionStore();

  const isAuthenticated = status === "authenticated";

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated, fetchUserData]);

  const refresh = useCallback(async () => {
    if (isAuthenticated) {
      await fetchUserData();
    }
  }, [isAuthenticated, fetchUserData]);

  const plan = getPlan();
  const adminStatus = isAdmin();
  const creditsRemaining = getCreditsRemaining();

  // Get feature access based on plan and admin status
  const features = getFeatureAccess(plan, adminStatus);

  return {
    ...features,
    isLoading,
    error,
    plan,
    isAdmin: adminStatus,
    creditsRemaining,
    refresh
  };
}

/**
 * Hook to guard a specific feature
 * Returns whether the feature is accessible and a function to handle blocked access
 */
export function useFeatureGuard(featureName: keyof FeatureAccess) {
  const featureAccess = useFeatureAccess();
  const hasAccess = featureAccess[featureName] as boolean;

  const checkAccess = useCallback(
    (onBlocked?: (feature: string) => void): boolean => {
      if (!hasAccess && onBlocked) {
        onBlocked(featureName);
      }
      return hasAccess;
    },
    [hasAccess, featureName]
  );

  return {
    hasAccess,
    checkAccess,
    isLoading: featureAccess.isLoading,
    plan: featureAccess.plan,
    isAdmin: featureAccess.isAdmin
  };
}
