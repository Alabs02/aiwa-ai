import db from "../lib/db/connection";
import { subscriptions } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover"
});

// USER TO FIX
const USER_EMAIL = "carvenjizaks@gmail.com";
const USER_ID = "570a0f9b-6613-4638-853e-6e803a512f4a";

async function fixSubscription() {
  console.log("🔍 Looking for Stripe customer...\n");

  const customers = await stripe.customers.list({
    email: USER_EMAIL,
    limit: 1
  });

  if (customers.data.length === 0) {
    console.error("❌ No Stripe customer found with this email");
    process.exit(1);
  }

  const customer = customers.data[0];
  console.log(`✓ Found customer: ${customer.id}`);

  const subs = await stripe.subscriptions.list({
    customer: customer.id,
    status: "active",
    limit: 1
  });

  if (subs.data.length === 0) {
    console.error("❌ No active subscription found");
    process.exit(1);
  }

  const subscription = subs.data[0];
  const priceId = subscription.items.data[0]?.price.id;

  // Get period dates from first subscription item
  const firstItem = subscription.items.data[0];
  const periodStart = firstItem?.current_period_start;
  const periodEnd = firstItem?.current_period_end;

  console.log(`✓ Found subscription: ${subscription.id}`);
  console.log(`✓ Price ID: ${priceId}`);
  console.log(`✓ Status: ${subscription.status}`);
  console.log(`✓ Period: ${periodStart} - ${periodEnd}`);

  // Determine plan from price ID
  let plan = "pro";
  let billingCycle = "monthly";
  let creditsTotal = 100;

  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID) {
    plan = "pro";
    billingCycle = "monthly";
    creditsTotal = 100;
  } else if (priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) {
    plan = "pro";
    billingCycle = "annual";
    creditsTotal = 100;
  } else if (priceId === process.env.STRIPE_ADVANCED_MONTHLY_PRICE_ID) {
    plan = "advanced";
    billingCycle = "monthly";
    creditsTotal = 250;
  } else if (priceId === process.env.STRIPE_ADVANCED_ANNUAL_PRICE_ID) {
    plan = "advanced";
    billingCycle = "annual";
    creditsTotal = 250;
  }

  console.log(`\n📦 Updating to: ${plan} (${billingCycle})`);

  const [updated] = await db
    .update(subscriptions)
    .set({
      plan,
      billing_cycle: billingCycle,
      status: subscription.status,
      credits_total: creditsTotal,
      credits_remaining: creditsTotal,
      credits_used: 0,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000) : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000) : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date()
    })
    .where(eq(subscriptions.user_id, USER_ID))
    .returning();

  console.log("\n✅ Subscription updated successfully!");
  console.log(JSON.stringify(updated, null, 2));

  process.exit(0);
}

fixSubscription().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
