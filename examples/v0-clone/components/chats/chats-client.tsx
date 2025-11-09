"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/shared/app-header";
import useSWR from "swr";

interface V0Chat {
  id: string;
  object: "chat";
  name?: string;
  messages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ChatsResponse {
  object: "list";
  data: V0Chat[];
}

export function ChatsClient() {
  const { data, error, isLoading } = useSWR<ChatsResponse>("/api/chats");
  const chats = data?.data || [];

  const getFirstUserMessage = (chat: V0Chat) => {
    const firstUserMessage = chat.messages?.find((msg) => msg.role === "user");
    return firstUserMessage?.content || "No messages";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">
              Loading chats...
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading chats
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {error.message || "Failed to load chats"}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  Chats
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {chats.length} {chats.length === 1 ? "chat" : "chats"}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Link>
            </div>

            {chats.length === 0 ? (
              <div className="py-12 text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No chats yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating your first chat.
                </p>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Chat
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {chats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chats/${chat.id}`}
                    className="group block"
                  >
                    <div className="border-border dark:border-input rounded-lg border p-6 transition-shadow hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-medium text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {chat.name || getFirstUserMessage(chat)}
                          </h3>
                          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>{chat.messages?.length || 0} messages</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Updated{" "}
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
