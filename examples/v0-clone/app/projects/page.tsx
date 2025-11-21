import { Suspense } from "react";
import { ProjectsClient } from "@/components/projects/projects-client";
import { SidebarLayout } from "@/components/shared/sidebar-layout";
import { Toolbar } from "@/components/shared/toolbar";

export default function ProjectsPage() {
  return (
    <>
      <Toolbar className="border-b" />

      <SidebarLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <ProjectsClient />
        </Suspense>
      </SidebarLayout>
    </>
  );
}
