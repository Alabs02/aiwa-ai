import { NextRequest, NextResponse } from "next/server";
import { createClient, type ChatDetail } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import { createChatOwnership } from "@/lib/db/queries";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    console.log("[FORK] Fetching original chat:", chatId);

    const originalChat = (await v0.chats.getById({ chatId })) as ChatDetail;

    if (!originalChat?.latestVersion) {
      return NextResponse.json(
        { error: "Template has no version" },
        { status: 400 }
      );
    }

    console.log("[FORK] Downloading version with assets...");

    // Download the complete version as zip (includes images)
    const zipBuffer = await v0.chats.downloadVersion({
      chatId,
      versionId: originalChat.latestVersion.id,
      format: "zip",
      includeDefaultFiles: true
    });

    console.log(`[FORK] Downloaded ${zipBuffer.byteLength} bytes`);

    // Convert ArrayBuffer to base64
    const base64Zip = Buffer.from(zipBuffer).toString("base64");

    // Create data URL
    const zipDataUrl = `data:application/zip;base64,${base64Zip}`;

    // Init from zip (preserves all assets including images)
    const duplicatedChat = (await v0.chats.init({
      type: "zip",
      chatPrivacy: "private",
      ...(originalChat.projectId && { projectId: originalChat.projectId }),
      zip: {
        url: zipDataUrl
      },
      lockAllFiles: false
    })) as ChatDetail;

    console.log("[FORK] Chat created:", duplicatedChat.id);

    // Update name (init from zip defaults to "archive")
    if (originalChat.name) {
      try {
        await v0.chats.update({
          chatId: duplicatedChat.id,
          name: `${originalChat.name} (Copy)`
        });
        console.log("[FORK] Name updated");
      } catch (updateError) {
        console.warn("[FORK] Could not update name:", updateError);
      }
    }

    // Register ownership
    try {
      await createChatOwnership({
        v0ChatId: duplicatedChat.id,
        userId: session.user.id
      });

      console.log("[FORK] Ownership registered");
    } catch (dbError) {
      console.error("[FORK] Failed to register ownership:", dbError);
    }

    return NextResponse.json({
      id: duplicatedChat.id,
      demo: duplicatedChat.demo,
      messages: duplicatedChat.messages,
      latestVersion: duplicatedChat.latestVersion,
      webUrl: duplicatedChat.webUrl,
      forkedFrom: chatId
    });
  } catch (error) {
    console.error("[FORK] Error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fork template"
      },
      { status: 500 }
    );
  }
}
