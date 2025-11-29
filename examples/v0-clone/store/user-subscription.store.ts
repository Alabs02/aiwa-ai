import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserPlan } from "@/lib/feature-access";

export interface SubscriptionData {
  id: string;
  user_id: string;
  plan: UserPlan;
  billing_cycle: string;
  status: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  rollover_credits: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleData {
  role: "user" | "admin";
}

interface UserSubscriptionState {
  subscription: SubscriptionData | null;
  role: UserRoleData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface UserSubscriptionActions {
  setSubscription: (subscription: SubscriptionData | null) => void;
  setRole: (role: UserRoleData | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetched: (timestamp: number) => void;
  fetchUserData: () => Promise<void>;
  reset: () => void;
}

interface UserSubscriptionGetters {
  getPlan: () => UserPlan;
  isAdmin: () => boolean;
  getCreditsRemaining: () => number;
  shouldRefetch: () => boolean;
}

type UserSubscriptionStore = UserSubscriptionState &
  UserSubscriptionActions &
  UserSubscriptionGetters;

const initialState: UserSubscriptionState = {
  subscription: null,
  role: null,
  isLoading: false,
  error: null,
  lastFetched: null
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useUserSubscriptionStore = create<UserSubscriptionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSubscription: (subscription) => set({ subscription }),
      setRole: (role) => set({ role }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setLastFetched: (timestamp) => set({ lastFetched: timestamp }),

      getPlan: () => {
        const { subscription, role } = get();
        // Admin users always get admin privileges
        if (role?.role === "admin") return "pro"; // or keep as free but admin check handles it
        return subscription?.plan || "free";
      },

      isAdmin: () => {
        const { role } = get();
        return role?.role === "admin";
      },

      getCreditsRemaining: () => {
        const { subscription } = get();
        return subscription?.credits_remaining || 0;
      },

      shouldRefetch: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > CACHE_DURATION;
      },

      fetchUserData: async () => {
        const { isLoading, shouldRefetch } = get();

        // Prevent duplicate fetches
        if (isLoading) return;

        // Use cache if available and fresh
        if (!shouldRefetch()) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Parallel fetch for both endpoints
          const [subscriptionRes, roleRes] = await Promise.allSettled([
            fetch("/api/billing/subscription"),
            fetch("/api/user/role")
          ]);

          let subscription: SubscriptionData | null = null;
          let role: UserRoleData | null = null;

          // Handle subscription response
          if (
            subscriptionRes.status === "fulfilled" &&
            subscriptionRes.value.ok
          ) {
            subscription = await subscriptionRes.value.json();
          } else {
            console.warn("Failed to fetch subscription data");
          }

          // Handle role response
          if (roleRes.status === "fulfilled" && roleRes.value.ok) {
            role = await roleRes.value.json();
          } else {
            console.warn("Failed to fetch role data");
          }

          set({
            subscription,
            role,
            isLoading: false,
            error: null,
            lastFetched: Date.now()
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      },

      reset: () => set(initialState)
    }),
    {
      name: "user-subscription-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        role: state.role,
        lastFetched: state.lastFetched
        // Don't persist isLoading or error
      })
    }
  )
);
