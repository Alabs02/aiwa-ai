import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import Stripe from "stripe";
import { getUserSubscription } from "@/lib/db/billing-queries";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover"
});

const CREDIT_PACKAGES = {
  50: { price: 1000, credits: 50 }, // $10
  100: { price: 2000, credits: 100 }, // $20
  200: { price: 4000, credits: 200 } // $40
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { credits } = await request.json();

    if (!CREDIT_PACKAGES[credits as keyof typeof CREDIT_PACKAGES]) {
      return NextResponse.json(
        { error: "Invalid credit package" },
        { status: 400 }
      );
    }

    const pkg = CREDIT_PACKAGES[credits as keyof typeof CREDIT_PACKAGES];
    const subscription = await getUserSubscription(session.user.id);

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { userId: session.user.id }
      });
      customerId = customer.id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${pkg.credits} AIWA Credits`,
              description: "One-time credit purchase"
            },
            unit_amount: pkg.price
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?purchase_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      metadata: {
        userId: session.user.id,
        type: "credit_purchase",
        credits: pkg.credits.toString(),
        amount: pkg.price.toString()
      }
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Credit purchase error:", error);
    return NextResponse.json(
      { error: "Failed to create purchase session" },
      { status: 500 }
    );
  }
}
