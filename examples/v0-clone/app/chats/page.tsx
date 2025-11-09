import { Suspense } from "react";
import { ChatsClient } from "@/components/chats/chats-client";
import { SidebarLayout } from "@/components/shared/sidebar-layout";

export default function ChatsPage() {
  return (
    <SidebarLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <ChatsClient />
      </Suspense>
    </SidebarLayout>
  );
}
