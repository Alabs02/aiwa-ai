import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const versions = await v0.chats.findVersions({
      chatId,
      ...(limit && { limit: parseInt(limit) }),
      ...(cursor && { cursor })
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch versions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
