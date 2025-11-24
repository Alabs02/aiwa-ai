import { notFound } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { Toolbar } from "@/components/shared/toolbar";
import { BlogPostClient } from "@/components/blog/blog-post-client";
import { getBlogPostBySlug } from "@/lib/db/blog-queries";
import { getUserRole } from "@/lib/db/billing-queries";
import { AppFooter } from "@/components/shared/app-footer";

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const post = await getBlogPostBySlug({ slug });

  if (!post) notFound();

  const role = session?.user?.id ? await getUserRole(session.user.id) : "user";
  if (post.is_published === "false" && role !== "admin") notFound();

  return (
    <>
      <Toolbar />
      <BlogPostClient post={post} userId={session?.user?.id} />
      <AppFooter />
    </>
  );
}
