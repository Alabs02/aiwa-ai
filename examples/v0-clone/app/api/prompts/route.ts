import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  savePromptToLibrary,
  getUserPrompts,
  getUserPromptStats
} from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { promptText, enhancedPrompt, title, category, tags, qualityScore } =
      body;

    if (!promptText) {
      return NextResponse.json(
        { error: "Prompt text is required" },
        { status: 400 }
      );
    }

    const savedPrompt = await savePromptToLibrary({
      userId: session.user.id,
      promptText,
      enhancedPrompt,
      title,
      category,
      tags,
      qualityScore
    });

    return NextResponse.json(savedPrompt);
  } catch (error) {
    console.error("Error saving prompt:", error);
    return NextResponse.json(
      {
        error: "Failed to save prompt",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category") || undefined;
    const searchQuery = searchParams.get("q") || undefined;
    const favoritesOnly = searchParams.get("favorites") === "true";
    const statsOnly = searchParams.get("stats") === "true";

    if (statsOnly) {
      const stats = await getUserPromptStats({ userId: session.user.id });
      return NextResponse.json(stats);
    }

    const prompts = await getUserPrompts({
      userId: session.user.id,
      limit,
      offset,
      category,
      searchQuery,
      favoritesOnly
    });

    return NextResponse.json({ data: prompts });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch prompts",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
