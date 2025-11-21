import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

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
