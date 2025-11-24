import "server-only";

import { and, desc, eq, or, ilike, type SQL, sql } from "drizzle-orm";

import { blog_posts, type BlogPost } from "./schema";
import db from "./connection";

// ===============================================
// BLOG POST QUERIES
// ===============================================

export async function createBlogPost({
  slug,
  title,
  excerpt,
  content,
  coverImage,
  tags,
  category,
  isPublished,
  isFeatured,
  readingTime,
  authorId,
  publishedAt
}: {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  readingTime?: number;
  authorId: string;
  publishedAt?: Date;
}): Promise<BlogPost> {
  try {
    const [result] = await db
      .insert(blog_posts)
      .values({
        slug,
        title,
        excerpt: excerpt || null,
        content,
        cover_image: coverImage || null,
        tags: tags || [],
        category: category || null,
        is_published: isPublished ? "true" : "false",
        is_featured: isFeatured ? "true" : "false",
        reading_time: readingTime || null,
        author_id: authorId,
        published_at: publishedAt || null
      })
      .returning();
    return result;
  } catch (error) {
    console.error("Failed to create blog post:", error);
    throw error;
  }
}

export async function getBlogPosts({
  limit = 20,
  offset = 0,
  category,
  searchQuery,
  publishedOnly = true,
  featuredOnly = false
}: {
  limit?: number;
  offset?: number;
  category?: string;
  searchQuery?: string;
  publishedOnly?: boolean;
  featuredOnly?: boolean;
} = {}): Promise<BlogPost[]> {
  try {
    let conditions: SQL[] = [];
    if (publishedOnly) conditions.push(eq(blog_posts.is_published, "true"));
    if (category) conditions.push(eq(blog_posts.category, category));
    if (featuredOnly) conditions.push(eq(blog_posts.is_featured, "true"));
    if (searchQuery && searchQuery.trim()) {
      const pattern = `%${searchQuery.trim()}%`;
      conditions.push(
        or(
          ilike(blog_posts.title, pattern),
          ilike(blog_posts.excerpt, pattern),
          ilike(blog_posts.content, pattern)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return await db
      .select()
      .from(blog_posts)
      .where(whereClause)
      .orderBy(desc(blog_posts.published_at))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("Failed to get blog posts:", error);
    throw error;
  }
}

export async function getBlogPostBySlug({
  slug
}: {
  slug: string;
}): Promise<BlogPost | undefined> {
  try {
    const [post] = await db
      .select()
      .from(blog_posts)
      .where(eq(blog_posts.slug, slug));
    return post;
  } catch (error) {
    console.error("Failed to get blog post:", error);
    throw error;
  }
}

export async function getBlogPostById({
  postId
}: {
  postId: string;
}): Promise<BlogPost | undefined> {
  try {
    const [post] = await db
      .select()
      .from(blog_posts)
      .where(eq(blog_posts.id, postId));
    return post;
  } catch (error) {
    console.error("Failed to get blog post:", error);
    throw error;
  }
}

export async function updateBlogPost({
  postId,
  updates
}: {
  postId: string;
  updates: Partial<{
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    cover_image: string;
    tags: string[];
    category: string;
    is_published: string;
    is_featured: string;
    reading_time: number;
    published_at: Date;
  }>;
}): Promise<BlogPost> {
  try {
    const [result] = await db
      .update(blog_posts)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(blog_posts.id, postId))
      .returning();
    return result;
  } catch (error) {
    console.error("Failed to update blog post:", error);
    throw error;
  }
}

export async function deleteBlogPost({
  postId
}: {
  postId: string;
}): Promise<void> {
  try {
    await db.delete(blog_posts).where(eq(blog_posts.id, postId));
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    throw error;
  }
}

export async function incrementBlogViewCount({
  postId
}: {
  postId: string;
}): Promise<void> {
  try {
    await db
      .update(blog_posts)
      .set({ view_count: sql`${blog_posts.view_count} + 1` })
      .where(eq(blog_posts.id, postId));
  } catch (error) {
    console.error("Failed to increment view count:", error);
  }
}

export async function getBlogCategories(): Promise<string[]> {
  try {
    const result = await db
      .selectDistinct({ category: blog_posts.category })
      .from(blog_posts)
      .where(sql`${blog_posts.category} IS NOT NULL`);
    return result
      .map((r: { category: string | null }) => r.category)
      .filter((c: string | null): c is string => c !== null);
  } catch (error) {
    console.error("Failed to get blog categories:", error);
    return [];
  }
}
