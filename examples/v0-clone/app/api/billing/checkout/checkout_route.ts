import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import Stripe from "stripe";
import { getUserSubscription } from "@/lib/db/billing-queries";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover"
});

const PLAN_PRICES = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  advanced_monthly: process.env.STRIPE_ADVANCED_MONTHLY_PRICE_ID!,
  advanced_annual: process.env.STRIPE_ADVANCED_ANNUAL_PRICE_ID!,
  ultimate_monthly: process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID!,
  ultimate_annual: process.env.STRIPE_ULTIMATE_ANNUAL_PRICE_ID!
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, billingCycle } = await request.json();

    if (
      !["pro", "advanced", "ultimate"].includes(plan) ||
      !["monthly", "annual"].includes(billingCycle)
    ) {
      return NextResponse.json(
        { error: "Invalid plan or billing cycle" },
        { status: 400 }
      );
    }

    const subscription = await getUserSubscription(session.user.id);

    // Get or create Stripe customer
    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { userId: session.user.id }
      });
      customerId = customer.id;
    }

    const priceKey = `${plan}_${billingCycle}` as keyof typeof PLAN_PRICES;
    const priceId = PLAN_PRICES[priceKey];

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      metadata: {
        userId: session.user.id,
        plan,
        billingCycle
      }
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
