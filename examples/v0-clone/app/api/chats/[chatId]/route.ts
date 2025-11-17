import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import {
  getChatOwnership,
  updateChatName,
  deleteChatOwnership
} from "@/lib/db/queries";

// Create v0 client with custom baseUrl if V0_API_URL is set
const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();
    const { chatId } = await params;

    console.log("Fetching chat details for ID:", chatId);

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    if (session?.user?.id) {
      // Authenticated user - check ownership
      const ownership = await getChatOwnership({ v0ChatId: chatId });

      if (!ownership) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      if (ownership.user_id !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // Anonymous user - allow access to any chat (they can only access via direct URL)
      console.log("Anonymous access to chat:", chatId);
    }

    // Fetch chat details using v0 SDK
    const chatDetails = await v0.chats.getById({ chatId });

    console.log("Chat details fetched:", chatDetails);

    return NextResponse.json(chatDetails);
  } catch (error) {
    console.error("Error fetching chat details:", error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to fetch chat details",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PATCH /api/chats/[chatId] - Rename chat
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();

    // Must be authenticated to update chat
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { chatId } = await params;
    const body = await request.json();
    const { name, privacy } = body;

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

    // Update chat using v0 SDK
    const updateData: { name?: string; privacy?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (privacy !== undefined) updateData.privacy = privacy;

    // Validate privacy if provided
    if (
      privacy &&
      !["private", "public", "team", "team-edit", "unlisted"].includes(privacy)
    ) {
      return NextResponse.json(
        { error: "Invalid privacy value" },
        { status: 400 }
      );
    }

    const updatedChat = await v0.chats.update({
      chatId,
      ...(name && { name }),
      ...(privacy && {
        privacy: privacy as
          | "private"
          | "public"
          | "team"
          | "team-edit"
          | "unlisted"
      })
    });
    // Update local database with title if name was changed
    if (name !== undefined) {
      await updateChatName({
        v0ChatId: chatId,
        title: name
      });
    }

    console.log("Chat updated:", {
      chatId,
      name,
      privacy,
      userId: session.user.id
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error("Error updating chat:", error);

    return NextResponse.json(
      {
        error: "Failed to update chat",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// DELETE /api/chats/[chatId] - Delete chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();

    // Must be authenticated to delete chat
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { chatId } = await params;

    // Check if chat exists and user owns it
    const ownership = await getChatOwnership({ v0ChatId: chatId });

    if (!ownership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Verify ownership
    if (ownership.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this chat" },
        { status: 403 }
      );
    }

    // Delete chat using v0 SDK
    const result = await v0.chats.delete({ chatId });

    // Delete local database record
    await deleteChatOwnership({ v0ChatId: chatId });

    console.log("Chat deleted:", {
      chatId,
      userId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting chat:", error);

    return NextResponse.json(
      {
        error: "Failed to delete chat",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
