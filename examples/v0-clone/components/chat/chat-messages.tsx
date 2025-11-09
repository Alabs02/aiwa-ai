import React, { useRef, useEffect } from "react";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { MessageRenderer } from "@/components/message-renderer";
import { sharedComponents } from "@/components/shared-components";
import { StreamingMessage } from "@v0-sdk/react";
import { useSession } from "next-auth/react";

interface ChatMessage {
  type: "user" | "assistant";
  content: string | any;
  isStreaming?: boolean;
  stream?: ReadableStream<Uint8Array> | null;
}

interface Chat {
  id: string;
  demo?: string;
  url?: string;
}

interface ChatMessagesProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  currentChat: Chat | null;
  onStreamingComplete: (finalContent: any) => void;
  onChatData: (chatData: any) => void;
  onStreamingStarted?: () => void;
}

export function ChatMessages({
  chatHistory,
  isLoading,
  currentChat,
  onStreamingComplete,
  onChatData,
  onStreamingStarted,
}: ChatMessagesProps) {
  const streamingStartedRef = useRef(false);
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get user initials from session
  const initials =
    session?.user?.email?.split("@")[0]?.slice(0, 2)?.toUpperCase() || "U";

  // Reset the streaming started flag when a new message starts loading
  useEffect(() => {
    if (isLoading) {
      streamingStartedRef.current = false;
    }
  }, [isLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  if (chatHistory.length === 0) {
    return (
      <Conversation>
        <ConversationContent>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="space-y-3 text-center">
              <div className="from-nuetral-200 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br via-neutral-500 to-neutral-800">
                <svg
                  className="h-8 w-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start a conversation
              </p>
            </div>
          </div>
        </ConversationContent>
      </Conversation>
    );
  }

  return (
    <Conversation>
      <ConversationContent>
        <div className="mx-auto max-w-4xl space-y-1 px-4 py-6">
          {chatHistory.map((msg, index) => {
            const isStringContent = typeof msg.content === "string";

            return (
              <Message from={msg.type} key={index}>
                <div className="flex items-start gap-3 w-full">
                  <MessageAvatar
                    type={msg.type}
                    initials={msg.type === "user" ? initials : "AI"}
                  />
                  <div className="min-w-0 flex-1">
                    {msg.isStreaming && msg.stream ? (
                      <StreamingMessage
                        stream={msg.stream}
                        messageId={`msg-${index}`}
                        role={msg.type}
                        onComplete={onStreamingComplete}
                        onChatData={onChatData}
                        onChunk={(chunk) => {
                          if (
                            onStreamingStarted &&
                            !streamingStartedRef.current
                          ) {
                            streamingStartedRef.current = true;
                            onStreamingStarted();
                          }
                        }}
                        onError={(error) =>
                          console.error("Streaming error:", error)
                        }
                        components={sharedComponents}
                        showLoadingIndicator={false}
                      />
                    ) : isStringContent ? (
                      <MessageContent
                        content={msg.content}
                        enableMarkdown={true}
                        enableCopy={true}
                        enableExpansion={true}
                      />
                    ) : (
                      <MessageRenderer
                        content={msg.content}
                        role={msg.type}
                        messageId={`msg-${index}`}
                        userInitials={initials}
                      />
                    )}
                  </div>
                </div>
              </Message>
            );
          })}
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-4">
              <Loader size={14} className="text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Thinking...
              </span>
            </div>
          )}
        </div>
      </ConversationContent>
    </Conversation>
  );
}
