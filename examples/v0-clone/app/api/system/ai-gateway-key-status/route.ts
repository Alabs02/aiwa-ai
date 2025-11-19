import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

/**
 * GET /api/system/ai-gateway-key-status
 *
 * Checks if the system AI_GATEWAY_API_KEY is configured and available
 * This is used by the auto-provisioning logic to determine if it can
 * use the system key or needs to prompt the user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if system AI_GATEWAY_API_KEY exists
    const systemKey = process.env.AI_GATEWAY_API_KEY;
    const available = !!systemKey && systemKey.trim().length > 0;

    return NextResponse.json({ available });
  } catch (error) {
    console.error("System key status check error:", error);
    return NextResponse.json(
      { error: "Failed to check system key status" },
      { status: 500 }
    );
  }
}
