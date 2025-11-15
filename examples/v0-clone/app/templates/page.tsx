import { FeaturedClient } from "@/components/templates/featured-client";
import { SidebarLayout } from "@/components/shared/sidebar-layout";
import { NavBar } from "@/components/shared";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";

export default async function ProjectsPage() {
  const session = await auth();

  return (
    <>
      <NavBar />

      <SidebarLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <FeaturedClient isAuthenticated={!!session?.user} />
        </Suspense>
      </SidebarLayout>
    </>
  );
}
