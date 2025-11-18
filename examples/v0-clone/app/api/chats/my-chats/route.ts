import { NextRequest, NextResponse } from "next/server";
import { createClient } from "v0-sdk";
import { auth } from "@/app/(auth)/auth";
import { getUserChats, getUserChatsCount } from "@/lib/db/queries";

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {}
);

// Helper to extract title from chat messages
function extractTitleFromChat(chat: any): string | null {
  if (!chat.messages || chat.messages.length === 0) return null;

  const firstUserMessage = chat.messages.find(
    (msg: any) => msg.role === "user"
  );
  if (!firstUserMessage?.content) return null;

  const content =
    typeof firstUserMessage.content === "string"
      ? firstUserMessage.content
      : firstUserMessage.content[0]?.text || "";

  return content.length > 50
    ? content.substring(0, 50).trim() + "..."
    : content;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Require authentication for this endpoint
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view your projects." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const visibility = (searchParams.get("visibility") || "all") as
      | "all"
      | "private"
      | "team";
    const sortBy = (searchParams.get("sortBy") || "last_edited") as
      | "last_edited"
      | "date_created"
      | "alphabetical";
    const orderBy = (searchParams.get("orderBy") || "desc") as "asc" | "desc";
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = parseInt(searchParams.get("offset") || "0");
    const searchQuery = searchParams.get("search") || undefined;

    console.log("Fetching user chats:", {
      userId: session.user.id,
      visibility,
      sortBy,
      orderBy,
      limit,
      offset,
      searchQuery
    });

    // Get user's ownership records with filtering and sorting
    const ownerships = await getUserChats({
      userId: session.user.id,
      visibility,
      sortBy,
      orderBy,
      limit,
      offset,
      searchQuery
    });

    // Get total count for pagination
    const totalCount = await getUserChatsCount({
      userId: session.user.id,
      visibility,
      searchQuery
    });

    // If no ownerships found, return empty array
    if (ownerships.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      });
    }

    // Get chat IDs from ownerships
    const chatIds = ownerships.map((o) => o.v0_chat_id);

    // Fetch actual chat data from v0 API
    const allChats = await v0.chats.find();

    // Filter and enrich chats with ownership data
    const enrichedChats =
      allChats.data
        ?.filter((chat) => chatIds.includes(chat.id))
        .map((chat) => {
          const ownership = ownerships.find((o) => o.v0_chat_id === chat.id);

          const displayTitle =
            ownership?.title ||
            chat.title ||
            extractTitleFromChat(chat) ||
            `Project ${chat.id.slice(0, 8)}`;

          return {
            ...chat,
            title: displayTitle,
            description: ownership?.description,
            visibility: ownership?.visibility,
            preview_url: ownership?.preview_url,
            demo_url: ownership?.demo_url,
            owner_id: ownership?.user_id,
            owner_email: ownership?.owner_email,
            created_at: ownership?.created_at
          };
        })
        .sort((a, b) => {
          // Maintain the order from the database query
          return chatIds.indexOf(a.id) - chatIds.indexOf(b.id);
        }) || [];

    console.log("User chats fetched successfully:", enrichedChats.length);

    return NextResponse.json({
      data: enrichedChats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error("User chats fetch error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to fetch your projects",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
