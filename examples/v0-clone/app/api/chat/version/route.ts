import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const versionId = searchParams.get("versionId");
    const includeDefaultFiles = searchParams.get("includeDefaultFiles");

    if (!chatId || !versionId) {
      return NextResponse.json(
        { error: "Chat ID and Version ID are required" },
        { status: 400 }
      );
    }

    const version = await v0.chats.getVersion({
      chatId,
      versionId,
      ...(includeDefaultFiles && {
        includeDefaultFiles: includeDefaultFiles === "true"
      })
    });

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error fetching version:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch version",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
