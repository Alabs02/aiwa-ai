import { Suspense } from "react";
import { ProjectsClient } from "@/components/projects/projects-client";
import { SidebarLayout } from "@/components/shared/sidebar-layout";
import { NavBar } from "@/components/shared/navbar";

export default function ProjectsPage() {
  return (
    <>
      <NavBar />
      <SidebarLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <ProjectsClient />
        </Suspense>
      </SidebarLayout>
    </>
  );
}
