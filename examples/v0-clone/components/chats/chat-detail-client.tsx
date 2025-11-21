"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { PreviewPanel } from "@/components/chat/preview-panel";
import { ResizableLayout } from "@/components/shared/resizable-layout";
import { BottomToolbar } from "@/components/shared/bottom-toolbar";
import { CreditWarningBanner } from "@/components/shared/credit-warning-banner";
import { useChat } from "@/hooks/use-chat";
import { useStreaming } from "@/contexts/streaming-context";
import { cn } from "@/lib/utils";
import {
  type ImageAttachment,
  clearPromptFromStorage
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
  const [creditWarning, setCreditWarning] = useState({
    show: false,
    remaining: 0
  });
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
    handleSendMessage: originalHandleSendMessage,
    handleStreamingComplete,
    handleChatData
  } = useChat(chatId);

  const isGenerating = isLoading || isStreaming;

  const handleSubmitWithAttachments = useCallback(
    async (
      e: React.FormEvent<HTMLFormElement>,
      attachmentUrls?: Array<{ url: string }>
    ) => {
      clearPromptFromStorage();
      setAttachments([]);
      await originalHandleSendMessage(e, attachmentUrls);
    },
    [originalHandleSendMessage]
  );

  // Add effect to watch for credit warnings
  useEffect(() => {
    if (currentChat && (currentChat as any).credits_remaining !== undefined) {
      const remaining = (currentChat as any).credits_remaining || 0;
      if ((currentChat as any).low_credit_warning) {
        setCreditWarning({ show: true, remaining });
      }
    }
  }, [currentChat]);

  useEffect(() => {
    console.group("Chat Details");
    console.log({ isLoading, isStreaming });
    console.groupEnd();
  }, [isLoading, isStreaming]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (textareaRef.current && !isLoadingChat) {
      textareaRef.current.focus();
    }
  }, [isLoadingChat]);

  useEffect(() => {
    if (currentChat?.demo && consoleLogs.length === 0) {
      setConsoleLogs([
        {
          level: "log",
          message: "Application initialized successfully",
          timestamp: new Date()
        },
        {
          level: "log",
          message: "React components mounted",
          timestamp: new Date()
        }
      ]);
    }
  }, [currentChat?.demo, consoleLogs.length]);

  return (
    <div
      className={cn(
        "dark:bg-background min-h-[calc(100vh-60px)] bg-gray-50",
        isFullscreen && "fixed inset-0 z-50"
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
                <CreditWarningBanner
                  creditsRemaining={creditWarning.remaining}
                  show={creditWarning.show}
                />
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
