import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getUserSubscription,
  createSubscription,
  updateSubscription,
  createCreditPurchase,
  resetMonthlyCredits
} from "@/lib/db/billing-queries";
import db from "@/lib/db/connection";
import { eq } from "drizzle-orm";
import { payment_transactions, webhook_logs, users } from "@/lib/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover"
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Log webhook receipt
  await logWebhookEvent(event, "pending");

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
        break;
    }

    // Mark as successful
    await updateWebhookLog(event.id, "success");
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);

    // Log failure
    await updateWebhookLog(
      event.id,
      "failed",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function logWebhookEvent(event: Stripe.Event, status: string) {
  try {
    const data = event.data.object as any;

    // Extract user context
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (data.metadata?.userId) {
      userId = data.metadata.userId;
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId as string)) // Type assertion
        .limit(1);
      userEmail = user?.email || null;
    }

    await db.insert(webhook_logs).values({
      stripe_event_id: event.id,
      event_type: event.type,
      user_id: userId,
      user_email: userEmail,
      amount: data.amount_total || data.amount_paid || data.amount || null,
      currency: data.currency || null,
      stripe_customer_id:
        typeof data.customer === "string" ? data.customer : null,
      stripe_subscription_id:
        typeof data.subscription === "string" ? data.subscription : null,
      stripe_invoice_id: data.id || null,
      status,
      raw_event: JSON.stringify(event),
      processed_at: status === "success" ? new Date() : null
    });
  } catch (error) {
    console.error("Failed to log webhook:", error);
  }
}

async function updateWebhookLog(
  eventId: string,
  status: string,
  errorMessage?: string
) {
  try {
    await db
      .update(webhook_logs)
      .set({
        status,
        error_message: errorMessage || null,
        processed_at: status === "success" ? new Date() : null
      })
      .where(eq(webhook_logs.stripe_event_id, eventId));
  } catch (error) {
    console.error("Failed to update webhook log:", error);
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  if (!userId) return;

  if (session.mode === "subscription") {
    const subscriptionId = session.subscription as string;
    const stripeSubscription =
      await stripe.subscriptions.retrieve(subscriptionId);

    const plan = session.metadata?.plan || "pro";
    const billingCycle = session.metadata?.billingCycle || "monthly";

    const creditsMap: Record<string, number> = {
      pro: 100,
      advanced: 350,
      ultimate: 800
    };
    const creditsTotal = creditsMap[plan] || 100;

    const firstItem = stripeSubscription.items.data[0];
    const periodStart = new Date((firstItem?.current_period_start || 0) * 1000);
    const periodEnd = new Date((firstItem?.current_period_end || 0) * 1000);

    const existingSubscription = await getUserSubscription(userId);

    if (existingSubscription) {
      const creditsUsed = existingSubscription.credits_used || 0;
      const creditsRemaining = creditsTotal - creditsUsed;

      await updateSubscription({
        userId,
        updates: {
          plan,
          billing_cycle: billingCycle,
          status:
            stripeSubscription.status === "active" ? "active" : "past_due",
          credits_total: creditsTotal,
          credits_used: creditsUsed,
          credits_remaining: creditsRemaining,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: firstItem.price.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: "false"
        }
      });
    } else {
      await createSubscription({
        userId,
        plan,
        billingCycle,
        creditsTotal,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: firstItem.price.id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd
      });
    }
  } else if (session.mode === "payment") {
    const credits = parseInt(session.metadata?.credits || "0");
    const amount = parseInt(session.metadata?.amount || "0");

    await createCreditPurchase({
      userId,
      amountUsd: amount,
      creditsPurchased: credits,
      stripePaymentIntentId: session.payment_intent as string
    });

    await db.insert(payment_transactions).values({
      user_id: userId,
      type: "credit_purchase",
      amount,
      currency: session.currency || "usd",
      stripe_payment_id: session.payment_intent as string,
      status: "succeeded",
      description: `${credits} credits purchase`
    });
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const firstItem = subscription.items.data[0];
  const periodStart = new Date((firstItem?.current_period_start || 0) * 1000);
  const periodEnd = new Date((firstItem?.current_period_end || 0) * 1000);

  await updateSubscription({
    userId,
    updates: {
      status: subscription.status === "active" ? "active" : "past_due",
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end ? "true" : "false"
    }
  });
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await updateSubscription({
    userId,
    updates: {
      status: "cancelled",
      cancelled_at: new Date()
    }
  });
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId =
    invoice.parent?.type === "subscription_details"
      ? (invoice.parent.subscription_details as any).subscription
      : ((invoice as any).subscription as string | null);

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  await resetMonthlyCredits(userId);

  const paymentId = invoice.id;

  const existing = await db
    .select()
    .from(payment_transactions)
    .where(eq(payment_transactions.stripe_invoice_id, paymentId))
    .limit(1);

  if (existing.length > 0) {
    console.log("[WEBHOOK] Invoice already recorded:", paymentId);
    return;
  }

  await db.insert(payment_transactions).values({
    user_id: userId,
    type: "subscription",
    amount: invoice.amount_paid,
    currency: invoice.currency,
    stripe_payment_id: invoice.receipt_number,
    stripe_invoice_id: invoice.id,
    status: "succeeded",
    description: "Monthly subscription payment"
  });
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId =
    invoice.parent?.type === "subscription_details"
      ? (invoice.parent.subscription_details as any).subscription
      : ((invoice as any).subscription as string | null);

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  await updateSubscription({
    userId,
    updates: { status: "past_due" }
  });
}
