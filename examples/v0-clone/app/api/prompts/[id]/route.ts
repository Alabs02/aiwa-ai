import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getPromptById,
  updatePromptInLibrary,
  deletePromptFromLibrary,
  incrementPromptUsage
} from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const prompt = await getPromptById({
      promptId: id,
      userId: session.user.id
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch prompt",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if this is just incrementing usage
    if (body.action === "increment_usage") {
      await incrementPromptUsage({ promptId: id, userId: session.user.id });
      return NextResponse.json({ success: true });
    }

    const updates: any = {};

    if (body.promptText !== undefined) updates.prompt_text = body.promptText;
    if (body.enhancedPrompt !== undefined)
      updates.enhanced_prompt = body.enhancedPrompt;
    if (body.title !== undefined) updates.title = body.title;
    if (body.category !== undefined) updates.category = body.category;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.qualityScore !== undefined)
      updates.quality_score = body.qualityScore;
    if (body.isFavorite !== undefined)
      updates.is_favorite = body.isFavorite ? "true" : "false";

    const updatedPrompt = await updatePromptInLibrary({
      promptId: id,
      userId: session.user.id,
      updates
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error("Error updating prompt:", error);
    return NextResponse.json(
      {
        error: "Failed to update prompt",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await deletePromptFromLibrary({
      promptId: id,
      userId: session.user.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return NextResponse.json(
      {
        error: "Failed to delete prompt",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
