import { Toolbar } from "@/components/shared/toolbar";
import { BlogClient } from "@/components/blog/blog-client";
import { AppFooter } from "@/components/shared/app-footer";

export default async function BlogPage() {
  return (
    <>
      <Toolbar />
      <BlogClient />
      <AppFooter />
    </>
  );
}
