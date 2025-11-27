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
      console.warn(
        `[CREDIT DEDUCTION] Insufficient credits: User has ${subscription.credits_remaining}, attempting to deduct ${creditsToDeduct}`
      );
      throw new Error("Insufficient credits");
    }

    const newCreditsUsed = subscription.credits_used + creditsToDeduct;
    const newCreditsRemaining =
      subscription.credits_remaining - creditsToDeduct;

    console.log("[CREDIT DEDUCTION] Deducting credits:", {
      userId,
      creditsToDeduct,
      before: subscription.credits_remaining,
      after: newCreditsRemaining,
      usageEventId
    });

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

    const rolloverCredits = ["pro", "advanced", "ultimate"].includes(
      subscription.plan
    )
      ? subscription.credits_remaining
      : 0;

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

const MINIMUM_CREDITS_PER_GENERATION = 1;

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

    const inputCost = Math.ceil((inputTokens / 1_000_000) * 150);
    const outputCost = Math.ceil((outputTokens / 1_000_000) * 750);
    const totalCost = inputCost + outputCost;

    let creditsDeducted = Math.ceil(totalCost / 20);

    if (
      eventType === "chat_generation" &&
      creditsDeducted < MINIMUM_CREDITS_PER_GENERATION
    ) {
      console.warn(
        `[CREDIT CALCULATION] Calculated credits (${creditsDeducted}) below minimum, enforcing minimum of ${MINIMUM_CREDITS_PER_GENERATION}`
      );
      creditsDeducted = MINIMUM_CREDITS_PER_GENERATION;
    }

    console.log("[USAGE EVENT] Creating:", {
      userId,
      eventType,
      v0ChatId,
      v0MessageId,
      tokens: { input: inputTokens, output: outputTokens, total: totalTokens },
      costs: { input: inputCost, output: outputCost, total: totalCost },
      creditsDeducted,
      model
    });

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

    if (creditsDeducted > 0) {
      await deductCredits({
        userId,
        creditsToDeduct: creditsDeducted,
        usageEventId: usageEvent.id
      });
    }

    return usageEvent;
  } catch (error) {
    console.error("[USAGE EVENT] Failed to create:", error);
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

    // FIXED: Calculate MRR from active subscriptions, not payment history
    const activeSubscriptions = await db
      .select({
        plan: subscriptions.plan,
        billing_cycle: subscriptions.billing_cycle,
        status: subscriptions.status
      })
      .from(subscriptions)
      .where(
        sql`${subscriptions.status} = 'active' AND ${subscriptions.plan} != 'free'`
      );

    // Monthly prices in cents
    const PLAN_PRICES = {
      pro_monthly: 2000,
      pro_annual: 204, // $17/mo * 12 = $204 total, so monthly = 204/12 = $17
      advanced_monthly: 5000,
      advanced_annual: 498, // $41.5/mo * 12 = $498 total, monthly = 498/12 = $41.5
      ultimate_monthly: 10000,
      ultimate_annual: 1056 // $88/mo * 12 = $1056 total, monthly = 1056/12 = $88
    };

    let monthlyRecurringRevenue = 0;

    for (const sub of activeSubscriptions) {
      const cycle = sub.billing_cycle || "monthly";
      const key = `${sub.plan}_${cycle}` as keyof typeof PLAN_PRICES;
      const price = PLAN_PRICES[key] || 0;

      if (cycle === "annual") {
        // Annual subscriptions: divide by 12 to get monthly value
        monthlyRecurringRevenue += Math.round(price / 12);
      } else {
        monthlyRecurringRevenue += price;
      }
    }

    const annualRecurringRevenue = monthlyRecurringRevenue * 12;

    // Historical transaction data (for reporting, not MRR)
    // FIXED: Deduplicate by stripe_payment_id, but keep all NULL records
    const deduplicatedQuery = sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN type = 'subscription' THEN amount ELSE 0 END), 0) as subscription_revenue,
        COALESCE(SUM(CASE WHEN type = 'credit_purchase' THEN amount ELSE 0 END), 0) as credit_revenue
      FROM (
        (
          SELECT DISTINCT ON (stripe_payment_id) 
            amount, 
            type
          FROM payment_transactions
          WHERE stripe_payment_id IS NOT NULL
          ${conditions.length > 0 ? sql`AND ${and(...conditions)}` : sql``}
          ORDER BY stripe_payment_id, created_at DESC
        )
        UNION ALL
        (
          SELECT 
            amount, 
            type
          FROM payment_transactions
          WHERE stripe_payment_id IS NULL
          ${conditions.length > 0 ? sql`AND ${and(...conditions)}` : sql``}
        )
      ) as deduplicated
    `;

    const deduplicatedResult = await db.execute(deduplicatedQuery);
    const row = Array.isArray(deduplicatedResult)
      ? deduplicatedResult[0]
      : deduplicatedResult.rows?.[0];

    const transactionStats = {
      total_revenue: Number(row?.total_revenue || 0),
      subscription_revenue: Number(row?.subscription_revenue || 0),
      credit_revenue: Number(row?.credit_revenue || 0)
    };

    return {
      usage: usageStats,
      users: userStats,
      revenue: {
        // MRR/ARR from active subscriptions
        monthly_recurring_revenue: monthlyRecurringRevenue,
        annual_recurring_revenue: annualRecurringRevenue,
        // Historical transaction data
        total_revenue: transactionStats.total_revenue,
        subscription_revenue: transactionStats.subscription_revenue,
        credit_revenue: transactionStats.credit_revenue
      }
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

function getPlanCredits(plan: string): number {
  const creditMap: Record<string, number> = {
    free: 15,
    pro: 100,
    advanced: 350,
    ultimate: 800,
    white_label: 0
  };

  return creditMap[plan] || 0;
}

function getNextPeriodEnd(billingCycle: string): Date {
  const now = new Date();

  if (billingCycle === "annual") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }

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
