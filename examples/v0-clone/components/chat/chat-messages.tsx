import React, { useRef, useEffect } from "react";
import {
  Message,
  MessageContent,
  MessageAvatar
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { MessageRenderer } from "@/components/message-renderer";
import { sharedComponents } from "@/components/shared-components";
import { StreamingMessage } from "@v0-sdk/react";
import { useSession } from "next-auth/react";
import { SparklesIcon } from "lucide-react";

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
  onStreamingStarted
}: ChatMessagesProps) {
  const streamingStartedRef = useRef(false);
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initials =
    session?.user?.email?.split("@")[0]?.slice(0, 2)?.toUpperCase() || "U";

  useEffect(() => {
    if (isLoading) {
      streamingStartedRef.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  if (chatHistory.length === 0) {
    return (
      <Conversation>
        <ConversationContent>
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="animate-pulse-subtle absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neutral-200 via-neutral-500 to-neutral-800 p-0.5 shadow-lg">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
                    <SparklesIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Start a conversation
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Ask me to build anything, and I'll create it for you in
                  real-time
                </p>
              </div>
            </div>
          </div>
        </ConversationContent>
      </Conversation>
    );
  }

  return (
    <Conversation>
      <ConversationContent>
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
          {chatHistory.map((msg, index) => {
            const isStringContent = typeof msg.content === "string";

            return (
              <Message from={msg.type} key={index}>
                <div className="flex w-full items-start gap-3">
                  <div className="shrink-0">
                    <MessageAvatar
                      type={msg.type}
                      initials={msg.type === "user" ? initials : "AI"}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {msg.isStreaming && msg.stream ? (
                      <div className="message-streaming">
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
                      </div>
                    ) : isStringContent ? (
                      <MessageContent
                        content={msg.content}
                        enableMarkdown={true}
                        enableCopy={true}
                        enableExpansion={true}
                        className="message-enter"
                      />
                    ) : (
                      <div className="message-enter">
                        <MessageRenderer
                          content={msg.content}
                          role={msg.type}
                          messageId={`msg-${index}`}
                          userInitials={initials}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Message>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <MessageAvatar type="assistant" initials="AI" />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200/50 bg-gradient-to-br from-neutral-50/50 to-neutral-100/30 px-4 py-3 backdrop-blur-sm dark:border-neutral-800/50 dark:from-neutral-900/30 dark:to-neutral-800/20">
                <Loader
                  size={14}
                  className="text-purple-600 dark:text-purple-400"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Thinking
                </span>
                <div className="flex gap-1">
                  <span className="size-1 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.3s] dark:bg-purple-400" />
                  <span className="size-1 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.15s] dark:bg-purple-400" />
                  <span className="size-1 animate-bounce rounded-full bg-purple-500 dark:bg-purple-400" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ConversationContent>
    </Conversation>
  );
}
