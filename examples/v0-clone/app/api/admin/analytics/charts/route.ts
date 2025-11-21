import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserRole } from "@/lib/db/billing-queries";
import db from "@/lib/db/connection";
import { usage_events } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(session.user.id);
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get daily data for last 30 days
    const dailyData = await db
      .select({
        date: sql<string>`DATE(${usage_events.created_at})`,
        count: sql<number>`COUNT(*)`,
        tokens: sql<number>`SUM(${usage_events.total_tokens})`
      })
      .from(usage_events)
      .where(sql`${usage_events.created_at} >= NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${usage_events.created_at})`)
      .orderBy(sql`DATE(${usage_events.created_at})`);

    return NextResponse.json({ daily: dailyData });
  } catch (error) {
    console.error("Failed to get chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
