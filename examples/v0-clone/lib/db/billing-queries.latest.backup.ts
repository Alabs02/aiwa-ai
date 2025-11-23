import db from "@/lib/db/connection";
import {
  subscriptions,
  usage_events,
  credit_purchases,
  payment_transactions,
  users,
  Subscription,
  UsageEvent,
  CreditPurchase
} from "@/lib/db/schema";
import { eq, and, gte, lte, sum, count, sql, desc } from "drizzle-orm";

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

export async function getUserSubscription(
  userId: string
): Promise<Subscription | null> {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.user_id, userId));

    return subscription || null;
  } catch (error) {
    console.error("Failed to get user subscription:", error);
    return null;
  }
}

export async function createSubscription({
  userId,
  plan,
  billingCycle,
  creditsTotal,
  stripeCustomerId,
  stripeSubscriptionId,
  stripePriceId,
  currentPeriodStart,
  currentPeriodEnd
}: {
  userId: string;
  plan: string;
  billingCycle?: string;
  creditsTotal: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}): Promise<Subscription> {
  try {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        user_id: userId,
        plan,
        billing_cycle: billingCycle || null,
        credits_total: creditsTotal,
        credits_remaining: creditsTotal,
        stripe_customer_id: stripeCustomerId || null,
        stripe_subscription_id: stripeSubscriptionId || null,
        stripe_price_id: stripePriceId || null,
        current_period_start: currentPeriodStart || null,
        current_period_end: currentPeriodEnd || null
      })
      .returning();

    return subscription;
  } catch (error) {
    console.error("Failed to create subscription:", error);
    throw error;
  }
}

export async function updateSubscription({
  userId,
  updates
}: {
  userId: string;
  updates: Partial<Subscription>;
}): Promise<Subscription> {
  try {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(subscriptions.user_id, userId))
      .returning();

    return subscription;
  } catch (error) {
    console.error("Failed to update subscription:", error);
    throw error;
  }
}

// ============================================================================
// CREDIT MANAGEMENT
// ============================================================================

export async function deductCredits({
  userId,
  creditsToDeduct,
  usageEventId
}: {
  userId: string;
  creditsToDeduct: number;
  usageEventId: string;
}): Promise<Subscription> {
  try {
    const subscription = await getUserSubscription(userId);

    if (!subscription) {
      throw new Error("No subscription found for user");
    }

    if (subscription.credits_remaining < creditsToDeduct) {
      throw new Error("Insufficient credits");
    }

    const newCreditsUsed = subscription.credits_used + creditsToDeduct;
    const newCreditsRemaining =
      subscription.credits_remaining - creditsToDeduct;

    return await updateSubscription({
      userId,
      updates: {
        credits_used: newCreditsUsed,
        credits_remaining: newCreditsRemaining
      }
    });
  } catch (error) {
    console.error("Failed to deduct credits:", error);
    throw error;
  }
}

export async function addCredits({
  userId,
  creditsToAdd,
  type = "purchase"
}: {
  userId: string;
  creditsToAdd: number;
  type?: "purchase" | "rollover" | "bonus";
}): Promise<Subscription> {
  try {
    const subscription = await getUserSubscription(userId);

    if (!subscription) {
      throw new Error("No subscription found for user");
    }

    const updates: Partial<Subscription> = {
      credits_total: subscription.credits_total + creditsToAdd,
      credits_remaining: subscription.credits_remaining + creditsToAdd
    };

    if (type === "rollover") {
      updates.rollover_credits =
        (subscription.rollover_credits || 0) + creditsToAdd;
    }

    return await updateSubscription({ userId, updates });
  } catch (error) {
    console.error("Failed to add credits:", error);
    throw error;
  }
}

export async function resetMonthlyCredits(
  userId: string
): Promise<Subscription> {
  try {
    const subscription = await getUserSubscription(userId);

    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Calculate rollover for Pro/Advanced/Ultimate plans
    const rolloverCredits = ["pro", "advanced", "ultimate"].includes(
      subscription.plan
    )
      ? subscription.credits_remaining
      : 0;

    // Get base credits for plan
    const planCredits = getPlanCredits(subscription.plan);

    return await updateSubscription({
      userId,
      updates: {
        credits_total: planCredits + rolloverCredits,
        credits_used: 0,
        credits_remaining: planCredits + rolloverCredits,
        rollover_credits: rolloverCredits,
        current_period_start: new Date(),
        current_period_end: getNextPeriodEnd(
          subscription.billing_cycle || "monthly"
        )
      }
    });
  } catch (error) {
    console.error("Failed to reset monthly credits:", error);
    throw error;
  }
}

// ============================================================================
// USAGE EVENT TRACKING
// ============================================================================

export async function createUsageEvent({
  userId,
  eventType,
  v0ChatId,
  v0MessageId,
  inputTokens,
  outputTokens,
  model,
  status = "completed"
}: {
  userId: string;
  eventType: string;
  v0ChatId?: string;
  v0MessageId?: string;
  inputTokens: number;
  outputTokens: number;
  model?: string;
  status?: string;
}): Promise<UsageEvent> {
  try {
    const totalTokens = inputTokens + outputTokens;

    // Calculate costs (in cents)
    const inputCost = Math.ceil((inputTokens / 1_000_000) * 150); // $1.5/1M = 150 cents
    const outputCost = Math.ceil((outputTokens / 1_000_000) * 750); // $7.5/1M = 750 cents
    const totalCost = inputCost + outputCost;

    // Calculate credits (1 credit = $0.20 = 20 cents)
    const creditsDeducted = Math.ceil(totalCost / 20);

    const [usageEvent] = await db
      .insert(usage_events)
      .values({
        user_id: userId,
        event_type: eventType,
        v0_chat_id: v0ChatId || null,
        v0_message_id: v0MessageId || null,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        input_cost: inputCost,
        output_cost: outputCost,
        total_cost: totalCost,
        credits_deducted: creditsDeducted,
        model: model || null,
        status
      })
      .returning();

    // Deduct credits from subscription
    if (creditsDeducted > 0) {
      await deductCredits({
        userId,
        creditsToDeduct: creditsDeducted,
        usageEventId: usageEvent.id
      });
    }

    return usageEvent;
  } catch (error) {
    console.error("Failed to create usage event:", error);
    throw error;
  }
}

export async function getUserUsageEvents({
  userId,
  limit = 50,
  offset = 0,
  startDate,
  endDate
}: {
  userId: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<UsageEvent[]> {
  try {
    let conditions = [eq(usage_events.user_id, userId)];

    if (startDate) {
      conditions.push(gte(usage_events.created_at, startDate));
    }

    if (endDate) {
      conditions.push(lte(usage_events.created_at, endDate));
    }

    return await db
      .select()
      .from(usage_events)
      .where(and(...conditions))
      .orderBy(desc(usage_events.created_at))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("Failed to get user usage events:", error);
    throw error;
  }
}

// ============================================================================
// CREDIT PURCHASES
// ============================================================================

export async function createCreditPurchase({
  userId,
  amountUsd,
  creditsPurchased,
  stripePaymentIntentId
}: {
  userId: string;
  amountUsd: number;
  creditsPurchased: number;
  stripePaymentIntentId?: string;
}): Promise<CreditPurchase> {
  try {
    const [purchase] = await db
      .insert(credit_purchases)
      .values({
        user_id: userId,
        amount_usd: amountUsd,
        credits_purchased: creditsPurchased,
        credits_remaining: creditsPurchased,
        stripe_payment_intent_id: stripePaymentIntentId || null,
        status: "completed"
      })
      .returning();

    // Add credits to user's subscription
    await addCredits({
      userId,
      creditsToAdd: creditsPurchased,
      type: "purchase"
    });

    return purchase;
  } catch (error) {
    console.error("Failed to create credit purchase:", error);
    throw error;
  }
}

// ============================================================================
// ANALYTICS & ADMIN QUERIES
// ============================================================================

export async function getSystemAnalytics({
  startDate,
  endDate
}: {
  startDate?: Date;
  endDate?: Date;
} = {}) {
  try {
    let conditions = [];

    if (startDate) {
      conditions.push(gte(usage_events.created_at, startDate));
    }

    if (endDate) {
      conditions.push(lte(usage_events.created_at, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total usage stats
    const [usageStats] = await db
      .select({
        total_events: count(usage_events.id),
        total_tokens: sum(usage_events.total_tokens),
        total_input_tokens: sum(usage_events.input_tokens),
        total_output_tokens: sum(usage_events.output_tokens),
        total_cost: sum(usage_events.total_cost),
        total_credits_used: sum(usage_events.credits_deducted)
      })
      .from(usage_events)
      .where(whereClause);

    // User stats
    const [userStats] = await db
      .select({
        total_users: count(users.id),
        free_users: sql<number>`COUNT(CASE WHEN ${subscriptions.plan} = 'free' THEN 1 END)`,
        pro_users: sql<number>`COUNT(CASE WHEN ${subscriptions.plan} = 'pro' THEN 1 END)`,
        advanced_users: sql<number>`COUNT(CASE WHEN ${subscriptions.plan} = 'advanced' THEN 1 END)`,
        ultimate_users: sql<number>`COUNT(CASE WHEN ${subscriptions.plan} = 'ultimate' THEN 1 END)`
      })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.user_id));

    // Revenue stats (from payment_transactions)
    const [revenueStats] = await db
      .select({
        total_revenue: sum(payment_transactions.amount),
        subscription_revenue: sql<number>`SUM(CASE WHEN ${payment_transactions.type} = 'subscription' THEN ${payment_transactions.amount} ELSE 0 END)`,
        credit_revenue: sql<number>`SUM(CASE WHEN ${payment_transactions.type} = 'credit_purchase' THEN ${payment_transactions.amount} ELSE 0 END)`
      })
      .from(payment_transactions)
      .where(
        conditions.length > 0
          ? and(...conditions.map((c) => sql`${c}`))
          : undefined
      );

    return {
      usage: usageStats,
      users: userStats,
      revenue: revenueStats
    };
  } catch (error) {
    console.error("Failed to get system analytics:", error);
    throw error;
  }
}

export async function getAllUsers({
  limit = 50,
  offset = 0,
  searchQuery
}: {
  limit?: number;
  offset?: number;
  searchQuery?: string;
} = {}) {
  try {
    // This will need more sophisticated querying
    const allUsers = await db
      .select({
        user: users,
        subscription: subscriptions
      })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.user_id))
      .limit(limit)
      .offset(offset);

    return allUsers;
  } catch (error) {
    console.error("Failed to get all users:", error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPlanCredits(plan: string): number {
  const creditMap: Record<string, number> = {
    free: 15, // $3 worth = 15 credits
    pro: 100, // $20 worth = 100 credits
    advanced: 350, // $50 worth = 350 credits (updated from 250)
    ultimate: 800, // $100 worth = 800 credits
    white_label: 0 // Custom
  };

  return creditMap[plan] || 0;
}

function getNextPeriodEnd(billingCycle: string): Date {
  const now = new Date();

  if (billingCycle === "annual") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }

  // Default to monthly
  return new Date(now.setMonth(now.getMonth() + 1));
}

export async function getUserRole(userId: string): Promise<string> {
  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    return user?.role || "user";
  } catch (error) {
    console.error("Failed to get user role:", error);
    return "user";
  }
}

export async function ensureUserSubscription(
  userId: string
): Promise<Subscription> {
  let subscription = await getUserSubscription(userId);

  if (!subscription) {
    subscription = await createSubscription({
      userId,
      plan: "free",
      creditsTotal: 15,
      currentPeriodStart: new Date(),
      currentPeriodEnd: getNextPeriodEnd("monthly")
    });
  }

  return subscription;
}
