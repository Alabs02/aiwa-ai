import "server-only";

import { and, asc, desc, eq, or, ilike, type SQL, sql } from "drizzle-orm";

import { hub_videos, type HubVideo } from "./schema";
import db from "./connection";

// ===============================================
// HUB VIDEO QUERIES
// ===============================================

export async function createHubVideo({
  youtubeUrl,
  youtubeId,
  title,
  description,
  summary,
  transcript,
  thumbnailUrl,
  duration,
  tags,
  category,
  isFeatured,
  publishedAt,
  createdBy
}: {
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  description?: string;
  summary?: string;
  transcript?: string;
  thumbnailUrl?: string;
  duration?: number;
  tags?: string[];
  category?: string;
  isFeatured?: boolean;
  publishedAt?: Date;
  createdBy: string;
}): Promise<HubVideo> {
  try {
    const [result] = await db
      .insert(hub_videos)
      .values({
        youtube_url: youtubeUrl,
        youtube_id: youtubeId,
        title,
        description: description || null,
        summary: summary || null,
        transcript: transcript || null,
        thumbnail_url: thumbnailUrl || null,
        duration: duration || null,
        tags: tags || [],
        category: category || null,
        is_featured: isFeatured ? "true" : "false",
        published_at: publishedAt || null,
        created_by: createdBy
      })
      .returning();

    return result;
  } catch (error) {
    console.error("Failed to create hub video:", error);
    throw error;
  }
}

export async function getHubVideos({
  limit = 20,
  offset = 0,
  category,
  searchQuery,
  featuredOnly = false
}: {
  limit?: number;
  offset?: number;
  category?: string;
  searchQuery?: string;
  featuredOnly?: boolean;
} = {}): Promise<HubVideo[]> {
  try {
    let conditions: SQL[] = [];

    if (category) {
      conditions.push(eq(hub_videos.category, category));
    }

    if (featuredOnly) {
      conditions.push(eq(hub_videos.is_featured, "true"));
    }

    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      conditions.push(
        or(
          ilike(hub_videos.title, searchPattern),
          ilike(hub_videos.description, searchPattern),
          ilike(hub_videos.summary, searchPattern)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(hub_videos)
      .where(whereClause)
      .orderBy(desc(hub_videos.created_at))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("Failed to get hub videos:", error);
    throw error;
  }
}

export async function getHubVideoById({
  videoId
}: {
  videoId: string;
}): Promise<HubVideo | undefined> {
  try {
    const [video] = await db
      .select()
      .from(hub_videos)
      .where(eq(hub_videos.id, videoId));

    return video;
  } catch (error) {
    console.error("Failed to get hub video:", error);
    throw error;
  }
}

export async function getHubVideoByYoutubeId({
  youtubeId
}: {
  youtubeId: string;
}): Promise<HubVideo | undefined> {
  try {
    const [video] = await db
      .select()
      .from(hub_videos)
      .where(eq(hub_videos.youtube_id, youtubeId));

    return video;
  } catch (error) {
    console.error("Failed to get hub video by youtube id:", error);
    throw error;
  }
}

export async function updateHubVideo({
  videoId,
  updates
}: {
  videoId: string;
  updates: Partial<{
    title: string;
    description: string;
    summary: string;
    transcript: string;
    tags: string[];
    category: string;
    is_featured: string;
    thumbnail_url: string;
    duration: number;
    published_at: Date;
  }>;
}): Promise<HubVideo> {
  try {
    const [result] = await db
      .update(hub_videos)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(hub_videos.id, videoId))
      .returning();

    return result;
  } catch (error) {
    console.error("Failed to update hub video:", error);
    throw error;
  }
}

export async function deleteHubVideo({
  videoId
}: {
  videoId: string;
}): Promise<void> {
  try {
    await db.delete(hub_videos).where(eq(hub_videos.id, videoId));
  } catch (error) {
    console.error("Failed to delete hub video:", error);
    throw error;
  }
}

export async function incrementVideoViewCount({
  videoId
}: {
  videoId: string;
}): Promise<void> {
  try {
    await db
      .update(hub_videos)
      .set({
        view_count: sql`${hub_videos.view_count} + 1`
      })
      .where(eq(hub_videos.id, videoId));
  } catch (error) {
    console.error("Failed to increment view count:", error);
  }
}

export async function getHubVideoCategories(): Promise<string[]> {
  try {
    const result = await db
      .selectDistinct({ category: hub_videos.category })
      .from(hub_videos)
      .where(sql`${hub_videos.category} IS NOT NULL`);

    return result
      .map((r: { category: string | null }) => r.category)
      .filter((c: string | null): c is string => c !== null);
  } catch (error) {
    console.error("Failed to get video categories:", error);
    return [];
  }
}
