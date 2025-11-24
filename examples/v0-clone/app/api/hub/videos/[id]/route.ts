// app/api/hub/videos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserRole } from "@/lib/db/billing-queries";
import {
  getHubVideoById,
  updateHubVideo,
  deleteHubVideo,
  incrementVideoViewCount
} from "@/lib/db/hub-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await getHubVideoById({ videoId: id });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Increment view count
    await incrementVideoViewCount({ videoId: id });

    return NextResponse.json(video);
  } catch (error) {
    console.error("Error fetching hub video:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch video",
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

    const role = await getUserRole(session.user.id);
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updates: any = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.transcript !== undefined) updates.transcript = body.transcript;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.category !== undefined) updates.category = body.category;
    if (body.isFeatured !== undefined)
      updates.is_featured = body.isFeatured ? "true" : "false";

    const updatedVideo = await updateHubVideo({
      videoId: id,
      updates
    });

    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error("Error updating hub video:", error);
    return NextResponse.json(
      {
        error: "Failed to update video",
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

    const role = await getUserRole(session.user.id);
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await deleteHubVideo({ videoId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hub video:", error);
    return NextResponse.json(
      {
        error: "Failed to delete video",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
