import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserRole } from "@/lib/db/billing-queries";
import {
  createBlogPost,
  getBlogPosts,
  getBlogPostBySlug
} from "@/lib/db/blog-queries";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await auth();
    const role = session?.user?.id
      ? await getUserRole(session.user.id)
      : "user";

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category") || undefined;
    const searchQuery = searchParams.get("q") || undefined;
    const featuredOnly = searchParams.get("featured") === "true";
    const publishedOnly =
      role !== "admin" || searchParams.get("all") !== "true";

    const posts = await getBlogPosts({
      limit,
      offset,
      category,
      searchQuery,
      publishedOnly,
      featuredOnly
    });

    return NextResponse.json({ data: posts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getUserRole(session.user.id);
    if (role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      title,
      excerpt,
      content,
      coverImage,
      tags,
      category,
      isPublished,
      isFeatured
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);
    const existing = await getBlogPostBySlug({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    const readingTime = calculateReadingTime(content);
    const publishedAt = isPublished ? new Date() : undefined;

    const post = await createBlogPost({
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
      authorId: session.user.id,
      publishedAt
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
