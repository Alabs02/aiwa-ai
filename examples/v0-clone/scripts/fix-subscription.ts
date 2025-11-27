import db from "../lib/db/connection";
import { subscriptions } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import {
  updateSubscription,
  getUserSubscription
} from "@/lib/db/billing-queries";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover"
});

// CARVEN'S ACCOUNT - Pro → Advanced Upgrade
const USER_EMAIL = "carvenjizaks@gmail.com";
const USER_ID = "570a0f9b-6613-4638-853e-6e803a512f4a";
const CREDITS_ALREADY_USED = 4; // From Pro plan (4/100)

async function fixSubscription() {
  console.log("🔍 Looking for Stripe customer...\n");
  console.log(`User: ${USER_EMAIL}`);
  console.log(`User ID: ${USER_ID}\n`);

  // Get current subscription to preserve used credits
  const currentSub = await getUserSubscription(USER_ID);
  console.log("📊 Current subscription state:");
  console.log(JSON.stringify(currentSub, null, 2));
  console.log();

  // Find Stripe customer
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

  // Find active subscription
  const subss = await stripe.subscriptions.list({
    customer: customer.id,
    limit: 5
  });

  console.log("============ SUBSS ===============");
  console.dir(subss, { depth: 0 });

  const subs = subss.data.filter((s) => s.customer === customer.id);

  console.log("============ SUBS ===============");
  console.dir(subs, { depth: 0 });

  if (subs.length === 0) {
    console.error("❌ No subscription found for this customer");
    process.exit(1);
  }

  const subscription = subs[0];
  const priceId = subscription.items.data[0]?.price.id;

  // Get period dates from first subscription item
  const firstItem = subscription.items.data[0];
  const periodStart = firstItem?.current_period_start;
  const periodEnd = firstItem?.current_period_end;

  console.log(`✓ Found subscription: ${subscription.id}`);
  console.log(`✓ Price ID: ${priceId}`);
  console.log(`✓ Status: ${subscription.status}`);
  console.log(
    `✓ Period: ${new Date(periodStart! * 1000).toISOString()} - ${new Date(periodEnd! * 1000).toISOString()}`
  );

  // Determine plan from price ID
  let plan = "advanced";
  let billingCycle = "monthly";
  let creditsTotal = 350;

  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID) {
    plan = "pro";
    billingCycle = "monthly";
    creditsTotal = 100;
  } else if (priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) {
    plan = "pro";
    billingCycle = "annual";
    creditsTotal = 1200;
  } else if (priceId === process.env.STRIPE_ADVANCED_MONTHLY_PRICE_ID) {
    plan = "advanced";
    billingCycle = "monthly";
    creditsTotal = 350;
  } else if (priceId === process.env.STRIPE_ADVANCED_ANNUAL_PRICE_ID) {
    plan = "advanced";
    billingCycle = "annual";
    creditsTotal = 4200;
  } else if (priceId === process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID) {
    plan = "ultimate";
    billingCycle = "monthly";
    creditsTotal = 800;
  } else if (priceId === process.env.STRIPE_ULTIMATE_ANNUAL_PRICE_ID) {
    plan = "ultimate";
    billingCycle = "annual";
    creditsTotal = 9600;
  }

  console.log(`\n📦 Upgrading to: ${plan} (${billingCycle})`);
  console.log(`💳 Total credits for plan: ${creditsTotal}`);

  // Calculate credits preserving the 4 already used
  const creditsUsed = CREDITS_ALREADY_USED;
  const creditsRemaining = creditsTotal - creditsUsed;

  console.log(`📊 Credit allocation:`);
  console.log(`   - Total: ${creditsTotal}`);
  console.log(`   - Used: ${creditsUsed} (preserved from Pro plan)`);
  console.log(`   - Remaining: ${creditsRemaining}`);

  const updated = await updateSubscription({
    userId: USER_ID,
    updates: {
      plan,
      billing_cycle: billingCycle,
      status: subscription.status,
      credits_total: creditsTotal,
      credits_used: creditsUsed,
      credits_remaining: creditsRemaining,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000) : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000) : null,
      cancel_at_period_end: subscription.cancel_at_period_end
        ? "true"
        : "false",
      updated_at: new Date()
    }
  });

  console.log("\n✅ Subscription updated successfully!");
  console.log("\n📋 Updated subscription details:");
  console.log(JSON.stringify(updated, null, 2));

  console.log("\n🎉 Carven's account has been upgraded from Pro to Advanced!");
  console.log(`   Old: Pro - 4/100 credits used`);
  console.log(
    `   New: Advanced - ${creditsUsed}/${creditsTotal} credits (${creditsRemaining} remaining)`
  );

  process.exit(0);
}

fixSubscription().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
