import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import Stripe from "stripe";
import { validateCreditPurchase } from "@/lib/credit-purchase-validation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover"
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, credits } = body;

    const validation = validateCreditPurchase(amount);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (credits !== validation.credits) {
      return NextResponse.json(
        { error: "Credit calculation mismatch" },
        { status: 400 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${validation.credits} AI Credits`,
              description: "One-time credit purchase"
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        userId: session.user.id,
        credits: validation.credits?.toString(),
        type: "credit_purchase",
        amountUsd: validation.amountUsd?.toString()
      }
    } as Stripe.Checkout.SessionCreateParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Credit purchase error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
