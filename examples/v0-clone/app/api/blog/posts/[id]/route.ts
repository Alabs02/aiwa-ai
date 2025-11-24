import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserRole } from "@/lib/db/billing-queries";
import {
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  incrementBlogViewCount
} from "@/lib/db/blog-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getBlogPostById({ postId: id });
    if (!post)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const session = await auth();
    const role = session?.user?.id
      ? await getUserRole(session.user.id)
      : "user";

    if (post.is_published === "false" && role !== "admin") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await incrementBlogViewCount({ postId: id });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch post" },
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
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getUserRole(session.user.id);
    if (role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const updates: any = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
    if (body.content !== undefined) updates.content = body.content;
    if (body.coverImage !== undefined) updates.cover_image = body.coverImage;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.category !== undefined) updates.category = body.category;
    if (body.isPublished !== undefined) {
      updates.is_published = body.isPublished ? "true" : "false";
      if (body.isPublished) updates.published_at = new Date();
    }
    if (body.isFeatured !== undefined)
      updates.is_featured = body.isFeatured ? "true" : "false";

    const updated = await updateBlogPost({ postId: id, updates });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update post" },
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
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getUserRole(session.user.id);
    if (role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await deleteBlogPost({ postId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
