import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getChatOwnership, updateChatVisibility } from "@/lib/db/queries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();

    // Must be authenticated to update visibility
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { chatId } = await params; // 👈 Await params here
    const body = await request.json();
    const { visibility, previewUrl, demoUrl } = body;

    // Validate visibility value
    if (!["public", "private", "team"].includes(visibility)) {
      return NextResponse.json(
        {
          error: "Invalid visibility value. Must be: public, private, or team"
        },
        { status: 400 }
      );
    }

    // Check if chat exists and user owns it
    const ownership = await getChatOwnership({ v0ChatId: chatId });

    if (!ownership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Verify ownership
    if (ownership.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to modify this chat" },
        { status: 403 }
      );
    }

    // Update visibility
    const updated = await updateChatVisibility({
      v0ChatId: chatId,
      visibility,
      previewUrl,
      demoUrl
    });

    console.log("Chat visibility updated:", {
      chatId,
      visibility,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: updated[0]
    });
  } catch (error) {
    console.error("Error updating chat visibility:", error);

    return NextResponse.json(
      {
        error: "Failed to update chat visibility",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch visibility settings for a specific chat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();
    const { chatId } = await params; // 👈 Await params here

    // Get chat ownership
    const ownership = await getChatOwnership({ v0ChatId: chatId });

    if (!ownership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // For private chats, only owner can see visibility settings
    if (
      ownership.visibility === "private" &&
      ownership.user_id !== session?.user?.id
    ) {
      return NextResponse.json(
        { error: "You do not have permission to view this chat" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      visibility: ownership.visibility,
      previewUrl: ownership.preview_url,
      demoUrl: ownership.demo_url,
      ownerId: ownership.user_id
    });
  } catch (error) {
    console.error("Error fetching chat visibility:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch chat visibility",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
