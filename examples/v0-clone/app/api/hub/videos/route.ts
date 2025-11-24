// app/api/hub/videos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserRole } from "@/lib/db/billing-queries";
import {
  createHubVideo,
  getHubVideos,
  getHubVideoByYoutubeId
} from "@/lib/db/hub-queries";
import { extractYouTubeId, fetchYouTubeVideoData } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category") || undefined;
    const searchQuery = searchParams.get("q") || undefined;
    const featuredOnly = searchParams.get("featured") === "true";

    const videos = await getHubVideos({
      limit,
      offset,
      category,
      searchQuery,
      featuredOnly
    });

    return NextResponse.json({ data: videos });
  } catch (error) {
    console.error("Error fetching hub videos:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch videos",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(session.user.id);
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { youtubeUrl, tags, category, isFeatured, summary } = body;

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Extract YouTube ID
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Check if video already exists
    const existingVideo = await getHubVideoByYoutubeId({ youtubeId });
    if (existingVideo) {
      return NextResponse.json(
        { error: "Video already exists in the hub" },
        { status: 409 }
      );
    }

    // Fetch video metadata from YouTube
    const videoData = await fetchYouTubeVideoData(youtubeId);
    if (!videoData) {
      return NextResponse.json(
        { error: "Failed to fetch video data from YouTube" },
        { status: 400 }
      );
    }

    // Create video record
    const video = await createHubVideo({
      youtubeUrl,
      youtubeId,
      title: videoData.title,
      description: videoData.description,
      summary: summary || null,
      thumbnailUrl: videoData.thumbnailUrl,
      duration: videoData.duration,
      tags: tags || [],
      category: category || null,
      isFeatured: isFeatured || false,
      publishedAt: videoData.publishedAt,
      createdBy: session.user.id
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error creating hub video:", error);
    return NextResponse.json(
      {
        error: "Failed to create video",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
