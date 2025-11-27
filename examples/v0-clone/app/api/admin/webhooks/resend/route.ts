import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserRole } from "@/lib/db/billing-queries";
import db from "@/lib/db/connection";
import { webhook_logs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(session.user.id);
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { eventId } = await request.json();

    // Get the failed webhook log
    const [log] = await db
      .select()
      .from(webhook_logs)
      .where(eq(webhook_logs.stripe_event_id, eventId))
      .limit(1);

    if (!log || !log.raw_event) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // Re-process the event
    const event = JSON.parse(log.raw_event);

    // Call your webhook handler internally
    const webhookResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/webhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: log.raw_event
      }
    );

    if (webhookResponse.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Resend failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to resend webhook:", error);
    return NextResponse.json({ error: "Failed to resend" }, { status: 500 });
  }
}
