import { ChatDetailClient } from "@/components/chats/chat-detail-client";
import { NavBar } from "@/components/shared/navbar";
import { SidebarLayout } from "@/components/shared/sidebar-layout";

export default function ChatDetailPage() {
  return (
    <>
      <NavBar />

      <SidebarLayout>
        <ChatDetailClient />
      </SidebarLayout>
    </>
  );
}
