import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createSubscription,
  updateSubscription,
  createCreditPurchase,
  resetMonthlyCredits
} from "@/lib/db/billing-queries";
import db from "@/lib/db/connection";
import { payment_transactions } from "@/lib/db/schema";

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

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  if (session.mode === "subscription") {
    const subscriptionId = session.subscription as string;
    const stripeSubscription =
      await stripe.subscriptions.retrieve(subscriptionId);

    const plan = session.metadata?.plan || "pro";
    const billingCycle = session.metadata?.billingCycle || "monthly";
    const creditsTotal = plan === "pro" ? 100 : 250;

    // Get period dates from subscription item
    const firstItem = stripeSubscription.items.data[0];
    const periodStart = new Date((firstItem?.current_period_start || 0) * 1000);
    const periodEnd = new Date((firstItem?.current_period_end || 0) * 1000);

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

    await db.insert(payment_transactions).values({
      user_id: userId,
      type: "subscription",
      amount: session.amount_total || 0,
      currency: session.currency || "usd",
      stripe_payment_id: session.payment_intent as string,
      status: "succeeded",
      description: `${plan} ${billingCycle} subscription`
    });
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

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Get period dates from subscription item
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

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
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

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId =
    invoice.parent?.type === "subscription_details"
      ? (invoice.parent.subscription_details as any).subscription
      : ((invoice as any).subscription as string | null);

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  await resetMonthlyCredits(userId);

  await db.insert(payment_transactions).values({
    user_id: userId,
    type: "subscription",
    amount: invoice.amount_paid,
    currency: invoice.currency,
    stripe_payment_id: (invoice as any).payment_intent as string,
    stripe_invoice_id: invoice.id,
    status: "succeeded",
    description: "Monthly subscription payment"
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
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
