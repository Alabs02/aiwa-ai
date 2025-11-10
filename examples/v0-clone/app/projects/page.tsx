import { FeaturedClient } from "@/components/projects/featured-client";
import { SidebarLayout } from "@/components/shared/sidebar-layout";
import { NavBar } from "@/components/shared";
import { Suspense } from "react";

export default function ProjectsPage() {
  return (
    <>
      <NavBar />

      <SidebarLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <FeaturedClient />
        </Suspense>
      </SidebarLayout>
    </>
  );
}
