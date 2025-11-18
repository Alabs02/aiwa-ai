import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useChatsStore } from "@/components/shared/chat-selector.store";

export function useChats() {
  const { data: session } = useSession();
  const { chats, isLoading, setChats, setIsLoading } = useChatsStore();

  const fetchChats = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, setChats, setIsLoading]);

  // Fetch chats when session is available
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    isLoading,
    refetch: fetchChats,
  };
}