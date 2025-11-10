"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { PreviewPanel } from "@/components/chat/preview-panel";
import { ResizableLayout } from "@/components/shared/resizable-layout";
import { NavBar } from "@/components/shared";
import { BottomToolbar } from "@/components/shared/bottom-toolbar";
import { useChat } from "@/hooks/use-chat";
import { useStreaming } from "@/contexts/streaming-context";
import { cn } from "@/lib/utils";
import {
  type ImageAttachment,
  clearPromptFromStorage,
} from "@/components/ai-elements/prompt-input";

export function ChatDetailClient() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [activePanel, setActivePanel] = useState<"chat" | "preview">("chat");
  const [consoleLogs, setConsoleLogs] = useState<
    Array<{
      level: "log" | "warn" | "error";
      message: string;
      timestamp: Date;
    }>
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { handoff } = useStreaming();

  const {
    message,
    setMessage,
    currentChat,
    isLoading,
    setIsLoading,
    isStreaming,
    chatHistory,
    isLoadingChat,
    handleSendMessage,
    handleStreamingComplete,
    handleChatData,
  } = useChat(chatId);

  // Determine if generation is happening (loading or streaming)
  const isGenerating = isLoading || isStreaming;

  // Wrapper function to handle attachments
  const handleSubmitWithAttachments = (
    e: React.FormEvent<HTMLFormElement>,
    attachmentUrls?: Array<{ url: string }>,
  ) => {
    // Clear sessionStorage immediately upon submission
    clearPromptFromStorage();
    // Clear attachments after sending
    setAttachments([]);
    return handleSendMessage(e, attachmentUrls);
  };

  // Handle fullscreen keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Auto-focus the textarea on page load
  useEffect(() => {
    if (textareaRef.current && !isLoadingChat) {
      textareaRef.current.focus();
    }
  }, [isLoadingChat]);

  // Simulate console logs (in a real app, these would come from the iframe)
  useEffect(() => {
    if (currentChat?.demo && consoleLogs.length === 0) {
      // Add some sample console logs
      setConsoleLogs([
        {
          level: "log",
          message: "Application initialized successfully",
          timestamp: new Date(),
        },
        {
          level: "log",
          message: "React components mounted",
          timestamp: new Date(),
        },
      ]);
    }
  }, [currentChat?.demo, consoleLogs.length]);

  return (
    <div
      className={cn(
        "dark:bg-background min-h-[calc(100vh-60px)] bg-gray-50",
        isFullscreen && "fixed inset-0 z-50",
      )}
    >
      <div className="flex h-[calc(100vh-60px-1px)] flex-col md:h-[calc(100vh-60px-1px)]">
        <ResizableLayout
          className="min-h-0 flex-1"
          singlePanelMode={false}
          activePanel={activePanel === "chat" ? "left" : "right"}
          leftPanel={
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto">
                <ChatMessages
                  chatHistory={chatHistory}
                  isLoading={isLoading}
                  currentChat={currentChat || null}
                  onStreamingComplete={handleStreamingComplete}
                  onChatData={handleChatData}
                  onStreamingStarted={() => setIsLoading(false)}
                />
              </div>

              <ChatInput
                message={message}
                setMessage={setMessage}
                onSubmit={handleSubmitWithAttachments}
                isLoading={isLoading}
                showSuggestions={false}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                textareaRef={textareaRef}
              />
            </div>
          }
          rightPanel={
            <PreviewPanel
              currentChat={currentChat || null}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              refreshKey={refreshKey}
              setRefreshKey={setRefreshKey}
              isGenerating={isGenerating}
              consoleLogs={consoleLogs}
            />
          }
        />

        <div className="md:hidden">
          <BottomToolbar
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            hasPreview={!!currentChat}
          />
        </div>
      </div>
    </div>
  );
}
