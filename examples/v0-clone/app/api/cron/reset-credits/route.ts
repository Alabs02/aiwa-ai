import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db/connection";
import { subscriptions } from "@/lib/db/schema";
import { lte, eq } from "drizzle-orm";
import { resetMonthlyCredits } from "@/lib/db/billing-queries";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find subscriptions that need reset
    const now = new Date();
    const subsToReset = await db
      .select()
      .from(subscriptions)
      .where(lte(subscriptions.current_period_end, now));

    let resetCount = 0;
    for (const sub of subsToReset) {
      await resetMonthlyCredits(sub.user_id);
      resetCount++;
    }

    return NextResponse.json({
      success: true,
      reset: resetCount
    });
  } catch (error) {
    console.error("Credit reset error:", error);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
