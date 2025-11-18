import { WorkspaceClient } from "@/components/workspace/workspace-client";
import { SidebarLayout } from "@/components/shared/sidebar-layout";
import { Toolbar } from "@/components/shared";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Workspace | Aiwa",
  description: "Manage and organize your web app projects"
};

export default async function WorkspacePage() {
  const session = await auth();

  // Require authentication for workspace
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <Toolbar className="border-border border-b" />

      <SidebarLayout>
        <Suspense
          fallback={
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-600 border-t-white" />
                <p className="mt-4 text-neutral-400">Loading workspace...</p>
              </div>
            </div>
          }
        >
          <WorkspaceClient />
        </Suspense>
      </SidebarLayout>
    </>
  );
}
