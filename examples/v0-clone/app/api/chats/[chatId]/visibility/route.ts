import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import { getChatOwnership, updateChatVisibility } from "@/lib/db/queries";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

async function handleVisibilityUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { chatId } = await params;
    const body = await request.json();
    const privacyValue = body.privacy || body.visibility;

    if (
      !["public", "private", "team", "team-edit", "unlisted"].includes(
        privacyValue
      )
    ) {
      return NextResponse.json(
        { error: "Invalid privacy value" },
        { status: 400 }
      );
    }

    const ownership = await getChatOwnership({ v0ChatId: chatId });
    if (!ownership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    if (ownership.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await v0.chats.update({ chatId, privacy: privacyValue });

    const dbVisibility = ["public", "private", "team"].includes(privacyValue)
      ? (privacyValue as "public" | "private" | "team")
      : "private";

    const updated = await updateChatVisibility({
      v0ChatId: chatId,
      visibility: dbVisibility,
      previewUrl: body.previewUrl,
      demoUrl: body.demoUrl
    });

    return NextResponse.json({
      success: true,
      data: updated[0],
      privacy: privacyValue
    });
  } catch (error) {
    console.error("Error updating visibility:", error);
    return NextResponse.json(
      {
        error: "Failed to update visibility",
        details: error instanceof Error ? error.message : "Unknown"
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  return handleVisibilityUpdate(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  return handleVisibilityUpdate(request, { params });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();
    const { chatId } = await params;

    const ownership = await getChatOwnership({ v0ChatId: chatId });
    if (!ownership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (
      ownership.visibility === "private" &&
      ownership.user_id !== session?.user?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      visibility: ownership.visibility,
      privacy: ownership.visibility,
      previewUrl: ownership.preview_url,
      demoUrl: ownership.demo_url,
      ownerId: ownership.user_id
    });
  } catch (error) {
    console.error("Error fetching visibility:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch visibility",
        details: error instanceof Error ? error.message : "Unknown"
      },
      { status: 500 }
    );
  }
}
