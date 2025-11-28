import { Suspense } from "react";
import { ChatsClient } from "@/components/chats/chats-client";
import { SidebarLayout } from "@/components/shared/sidebar-layout";
import { Toolbar } from "@/components/shared/toolbar";

export default function ChatsPage() {
  return (
    <>
      <Toolbar className="border-b" />

      <SidebarLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <ChatsClient />
        </Suspense>
      </SidebarLayout>
    </>
  );
}
