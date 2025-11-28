"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PromptInput,
  PromptInputImageButton,
  PromptInputImagePreview,
  PromptInputMicButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  createImageAttachment,
  createImageAttachmentFromStored,
  savePromptToStorage,
  loadPromptFromStorage,
  clearPromptFromStorage,
  type ImageAttachment
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  PromptQualityIndicator,
  PromptEnhancerDialog,
  PromptLibraryDialog
} from "@/components/prompt-enhancement";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { PreviewPanel } from "@/components/chat/preview-panel";
import { ResizableLayout } from "@/components/shared/resizable-layout";
import { BottomToolbar } from "@/components/shared/bottom-toolbar";
import { NavBar, Toolbar } from "@/components/shared";
import { ProjectSelector } from "@/components/projects/project-selector";
import { EnvVariablesDialog } from "@/components/projects/env-variables-dialog";
import { GL } from "@/components/gl";
import { Leva } from "leva";
import { suggestions } from "../constants/suggestions";
import { FeaturedTemplates } from "@/components/templates/featured-templates";
import { Button } from "@/components/ui/button";
import { Wand2, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { useChatStore } from "./home-client.store";
import { useSession } from "next-auth/react";
import { BorderBeam } from "@/components/ui/border-beam";
import { useChatsStore } from "@/components/shared/chat-selector.store";
import { UserTemplates } from "../templates/user-templates";
import { Loader } from "lucide-react";
import { CreditWarningBanner } from "@/components/shared/credit-warning-banner";
import { UpgradePromptDialog } from "@/components/shared/upgrade-prompt-dialog";
import { getFeatureAccess } from "@/lib/feature-access";
import { WelcomeUpgradeDialog } from "@/components/shared/welcome-upgrade-dialog";
import { AppFooter } from "@/components/shared/app-footer";
import { toast } from "sonner";

function SearchParamsHandler({ onReset }: { onReset: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const reset = searchParams.get("reset");
    if (reset === "true") {
      onReset();

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("reset");
      window.history.replaceState({}, "", newUrl.pathname);
    }
  }, [searchParams, onReset]);

  return null;
}

function UpgradeSearchParamsHandler() {
  const searchParams = useSearchParams();

  const { setShowWelcomeDialog } = useChatStore();

  useEffect(() => {
    const isNewUser = searchParams.get("new_user") === "true";
    const dismissed = localStorage.getItem("welcome_dialog_dismissed");

    if (isNewUser && !dismissed) {
      // Small delay for smooth UX
      setTimeout(() => {
        setShowWelcomeDialog(true);
        // Clean URL without triggering navigation
        window.history.replaceState({}, "", "/");
      }, 800);
    }
  }, [searchParams, setShowWelcomeDialog]);

  return null;
}

function AutoProvisioningOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass relative overflow-hidden rounded-2xl border border-white/[0.12] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center gap-4">
          <div className="from-primary/20 relative rounded-full bg-gradient-to-br to-purple-500/20 p-4">
            <Loader className="text-primary-foreground h-8 w-8 animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">
              Getting things ready...
            </h3>
            <p className="mt-2 text-sm text-white/60">
              Setting up your project environment
            </p>
          </div>
        </div>

        {/* Animated gradient border */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/0 to-purple-500/0 opacity-0 transition-opacity duration-200" />
      </div>
    </div>
  );
}

export function HomeClient() {
  const {
    currentChatId,
    showChatInterface,
    chatHistory,
    currentChat,
    isLoading,
    isFullscreen,
    refreshKey,
    activePanel,
    selectedProjectId,
    envVarsValid,
    isAutoProvisioning, // NEW
    showWelcomeDialog,
    setCurrentChatId,
    setShowChatInterface,
    setChatHistory,
    addChatMessage,
    setCurrentChat,
    setIsLoading,
    setIsFullscreen,
    setRefreshKey,
    setActivePanel,
    setShowWelcomeDialog,
    resetChatState,
    getSelectedProject
  } = useChatStore();

  const { setChats, setIsLoading: setIsLoadingChats } = useChatsStore();

  const { status, data: session } = useSession();
  const { isCollapsed } = useSidebarCollapse();

  const isAuthenticated = status === "authenticated";

  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [showEnhancer, setShowEnhancer] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [promptAnalysis, setPromptAnalysis] = useState<any>(null);

  const [userPlan, setUserPlan] = useState<string>("free");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");

  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousChat = useRef<string | null>(null);

  const [creditWarning, setCreditWarning] = useState({
    show: false,
    remaining: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/billing/subscription")
        .then((r) => r.json())
        .then((data) => setUserPlan(data?.plan || "free"))
        .catch(() => setUserPlan("free"));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const storedData = loadPromptFromStorage();
    if (storedData) {
      setMessage(storedData.message);
      if (storedData.attachments.length > 0) {
        const restoredAttachments = storedData.attachments.map(
          createImageAttachmentFromStored
        );
        setAttachments(restoredAttachments);
      }
    }
  }, []);

  useEffect(() => {
    if (message || attachments.length > 0) {
      savePromptToStorage(message, attachments);
    } else {
      clearPromptFromStorage();
    }
  }, [message, attachments]);

  useEffect(() => {
    if (currentChat && (currentChat as any).credits_remaining !== undefined) {
      const remaining = (currentChat as any).credits_remaining || 0;
      if ((currentChat as any).low_credit_warning) {
        setCreditWarning({ show: true, remaining });
      }
    }
  }, [currentChat]);

  const handleReset = () => {
    resetChatState();
    setMessage("");
    setAttachments([]);
    setPromptAnalysis(null);
    clearPromptFromStorage();
  };

  // FIXED: handleSendMessage - Initial submission from home page
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    if (!isAuthenticated || !envVarsValid) {
      return;
    }

    const userMessage = message.trim();
    const currentAttachments = [...attachments];

    // Get project info before clearing
    const selectedProject = getSelectedProject();
    const projectId = selectedProject?.v0_project_id;

    // Clear sessionStorage immediately upon submission
    clearPromptFromStorage();

    setMessage("");
    setAttachments([]);

    // Immediately show chat interface and add user message
    setShowChatInterface(true);
    setChatHistory([
      {
        type: "user",
        content: userMessage
      }
    ]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          streaming: true,
          ...(currentAttachments.length > 0 && {
            attachments: currentAttachments.map((att) => ({ url: att.dataUrl }))
          }),
          ...(projectId && { projectId })
        })
      });

      if (!response.ok) {
        let errorMessage =
          "Sorry, there was an error processing your message. Please try again.";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (response.status === 429) {
            errorMessage =
              "You have exceeded your maximum number of messages for the day. Please try again later.";
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          if (response.status === 429) {
            errorMessage =
              "You have exceeded your maximum number of messages for the day. Please try again later.";
          }
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("No response body for streaming");
      }

      // setIsLoading(false);

      // Add streaming assistant response
      addChatMessage({
        type: "assistant",
        content: [],
        isStreaming: true,
        stream: response.body
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      setIsLoading(false);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sorry, there was an error processing your message. Please try again.";

      setChatHistory([
        {
          type: "user",
          content: userMessage
        },
        {
          type: "assistant",
          content: errorMessage
        }
      ]);
    }
  };

  // FIXED: handleChatSendMessage - Messages in chat interface
  const handleChatSendMessage = async (
    e: React.FormEvent<HTMLFormElement>,
    attachmentUrls?: Array<{ url: string }>
  ) => {
    e.preventDefault();

    if (!message.trim() || isLoading) return;

    if (!envVarsValid) {
      return;
    }

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    const selectedProject = getSelectedProject();
    const projectId = selectedProject?.v0_project_id;

    // Add user message to chat history
    addChatMessage({ type: "user", content: userMessage });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          chatId: currentChatId,
          streaming: true,
          ...(attachmentUrls && { attachments: attachmentUrls }),
          ...(projectId && { projectId })
        })
      });

      if (!response.ok) {
        let errorMessage =
          "Sorry, there was an error processing your message. Please try again.";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (response.status === 429) {
            errorMessage =
              "You have exceeded your maximum number of messages for the day. Please try again later.";
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          if (response.status === 429) {
            errorMessage =
              "You have exceeded your maximum number of messages for the day. Please try again later.";
          }
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("No response body for streaming");
      }

      // setIsLoading(false);

      // Add streaming response
      addChatMessage({
        type: "assistant",
        content: [],
        isStreaming: true,
        stream: response.body
      });
    } catch (error) {
      console.error("Error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sorry, there was an error processing your message. Please try again.";

      addChatMessage({
        type: "assistant",
        content: errorMessage
      });
      setIsLoading(false);
    }
  };

  const handleStreamingComplete = () => {
    setIsLoading(false);
  };

  const handleFetchChats = async () => {
    if (!session?.user?.id) return;

    setIsLoadingChats(true);
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleChatData = async (data: any) => {
    console.log({ data });

    if (!currentChatId && data.id) {
      // First time receiving chat ID - set it and navigate
      setCurrentChatId(data.id);
      setCurrentChat(data);

      // Update URL to /chats/{chatId}
      const stateObject = {
        chatId: data.id,
        asPath: `/chats/${data.id}`,
        scroll: false
      };

      window.history.pushState(stateObject, "", `/chats/${data.id}`);

      console.log("Chat created with ID:", data.id);

      // Create ownership record for the new chat
      try {
        await fetch("/api/chat/ownership", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chatId: data.id
          })
        });
        console.log("Chat ownership created:", data.id);

        handleFetchChats();
      } catch (error) {
        console.error("Failed to create chat ownership:", error);
      }
    }
  };

  // FIXED: handleStreamingStarted - should set loading to false
  const handleStreamingStarted = () => {
    setIsLoading(true);
  };

  const handleUseEnhancedPrompt = (prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  };

  const handleImageFiles = async (files: File[]) => {
    const validImageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    for (const file of validImageFiles) {
      const attachment = await createImageAttachment(file);
      setAttachments((prev) => [...prev, attachment]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleImageFiles(files);
  };

  const handleOpenEnhancer = () => {
    const access = getFeatureAccess(userPlan as any);
    if (!access.canUsePromptEnhancer) {
      setBlockedFeature("Prompt Enhancer");
      setShowUpgradeDialog(true);
      return;
    }
    setShowEnhancer(true);
  };

  const handleOpenLibrary = () => {
    const access = getFeatureAccess(userPlan as any);
    if (!access.canUsePromptLibrary) {
      setBlockedFeature("Prompt Library");
      setShowUpgradeDialog(true);
      return;
    }
    setShowLibrary(true);
  };

  const handleSpeechTranscript = useCallback((transcript: string) => {
    const access = getFeatureAccess(userPlan as any);

    if (!access.canUsePromptLibrary) {
      setBlockedFeature("Transcription");
      setShowUpgradeDialog(true);
      return;
    }

    setMessage((prev) => prev + (prev ? " " : "") + transcript);
    setTimeout(() => {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value.length || 0;
      textareaRef.current?.setSelectionRange(len, len);
    }, 100);
  }, []);

  const handleSpeechError = useCallback((error: string) => {
    // Mic button already shows toasts, just log
    console.error("Speech error:", error);
  }, []);

  const getFirstOrLast = (): string | undefined => {
    if (!session?.user?.name) return undefined;

    const nameParts = session.user.name.trim().split(/\s+/);
    // Return first name if available, otherwise return last name, otherwise undefined
    return nameParts[0] || nameParts[nameParts.length - 1] || undefined;
  };

  if (showChatInterface || currentChatId) {
    return (
      <div className="dark:bg-background flex min-h-screen flex-col bg-gray-50">
        {/* Handle search params with Suspense boundary */}
        <Suspense fallback={null}>
          <SearchParamsHandler onReset={handleReset} />
          <UpgradeSearchParamsHandler />
        </Suspense>

        <NavBar />
        <AppSidebar />

        <div
          className={cn(
            "flex h-[calc(100vh-60px-40px)] flex-col md:h-[calc(100vh-60px)]",
            "md:ml-16",
            !isCollapsed && "md:ml-64"
          )}
        >
          <ResizableLayout
            className="min-h-0 flex-1"
            singlePanelMode={false}
            activePanel={activePanel === "chat" ? "left" : "right"}
            leftPanel={
              <div className="flex h-full flex-col">
                <div className={cn("flex-1 overflow-y-auto")}>
                  <CreditWarningBanner
                    creditsRemaining={creditWarning.remaining}
                    show={creditWarning.show}
                  />

                  <ChatMessages
                    chatHistory={chatHistory}
                    isLoading={isLoading}
                    currentChat={currentChat}
                    onStreamingComplete={handleStreamingComplete}
                    onChatData={handleChatData}
                    onStreamingStarted={handleStreamingStarted}
                  />
                </div>

                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  onSubmit={handleChatSendMessage}
                  isLoading={isLoading}
                  showSuggestions={false}
                />
              </div>
            }
            rightPanel={
              <PreviewPanel
                currentChat={currentChat}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
                refreshKey={refreshKey}
                isGenerating={isLoading}
                setRefreshKey={setRefreshKey}
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

        {isAuthenticated && isAutoProvisioning && <AutoProvisioningOverlay />}

        <EnvVariablesDialog />

        <WelcomeUpgradeDialog
          open={showWelcomeDialog}
          onOpenChange={setShowWelcomeDialog}
        />
      </div>
    );
  } else {
    return (
      <>
        <div className="dark:bg-background flex min-h-[calc(100vh-60px)] flex-col bg-gray-50">
          <GL hovering={hovering} />

          {/* Handle search params with Suspense boundary */}
          <Suspense fallback={null}>
            <SearchParamsHandler onReset={handleReset} />
            <UpgradeSearchParamsHandler />
          </Suspense>

          {/* Toolbar */}
          <Toolbar />

          {/* Main Content */}
          <main className="relative z-10 flex w-full flex-1 flex-col border-none border-white">
            {/* Hero Section */}
            <div className="flex min-h-[calc(100vh-60px)] flex-col items-center-safe justify-center-safe gap-y-12 px-5 md:gap-y-24 md:px-4">
              <div className="flex w-full max-w-3xl flex-col items-center-safe border-none">
                <h2 className="font-heading text-center text-2xl font-bold text-white sm:text-3xl md:text-5xl 2xl:text-6xl">
                  Vibe. Build. Deploy.
                </h2>

                <div className="font-body bg-background/65 relative mt-4 inline-block w-auto rounded-full border px-4 py-2 text-center text-base text-neutral-300/95 sm:text-lg md:text-xl">
                  Vibe-code your imagination. Bring it to life with Aiwa.
                  <BorderBeam
                    duration={10}
                    size={100}
                    colorFrom="#f6821f"
                    colorTo="#ad46ff"
                  />
                </div>

                {/* Prompt Input */}
                <div
                  className="mt-8 w-full"
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                >
                  <PromptInput
                    onSubmit={handleSendMessage}
                    className="relative w-full"
                    onImageDrop={handleImageFiles}
                    isDragOver={isDragOver}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <PromptInputImagePreview
                      attachments={attachments}
                      onRemove={handleRemoveAttachment}
                    />

                    {/* Quality indicator positioned above textarea */}
                    {message.trim().length > 0 && (
                      <div className="flex justify-end px-3 pt-2">
                        <PromptQualityIndicator
                          prompt={message}
                          onAnalysisChange={setPromptAnalysis}
                        />
                      </div>
                    )}

                    <PromptInputTextarea
                      ref={textareaRef}
                      onChange={(e) => setMessage(e.target.value)}
                      value={message}
                      placeholder="Describe what you want to build..."
                      className="min-h-[80px] text-base"
                      disabled={isLoading}
                    />
                    <PromptInputToolbar>
                      <PromptInputTools>
                        {/* Enhancement tools */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleOpenLibrary}
                          className="h-8 w-8 p-0 text-white/60 hover:text-white"
                          title="Browse prompt library"
                          disabled={isLoading}
                        >
                          <Library className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleOpenEnhancer}
                          className="h-8 w-8 p-0 text-white/60 hover:text-white"
                          title="Enhance prompt"
                          disabled={isLoading}
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>

                        <PromptInputImageButton
                          onImageSelect={handleImageFiles}
                          disabled={isLoading}
                        />
                      </PromptInputTools>
                      <PromptInputTools>
                        {isAuthenticated && <ProjectSelector />}
                        <PromptInputMicButton
                          onTranscript={handleSpeechTranscript}
                          onError={(e) => handleSpeechError(e?.toString())}
                          disabled={isLoading}
                        />
                        <PromptInputSubmit
                          disabled={
                            !message.trim() ||
                            isLoading ||
                            (isAuthenticated && !envVarsValid)
                          }
                          status={isLoading ? "streaming" : "ready"}
                        />
                      </PromptInputTools>
                    </PromptInputToolbar>
                  </PromptInput>
                </div>

                {/* Suggestions */}
                <div className="mt-4 w-full">
                  <Suggestions>
                    {suggestions.map(({ Copy, Icon, Prompt }, idx) => (
                      <Suggestion
                        key={`${Copy}-${idx}`}
                        disabled={
                          isLoading || (isAuthenticated && !envVarsValid)
                        }
                        onClick={() => {
                          setMessage(Prompt);
                          // Submit after setting message
                          setTimeout(() => {
                            const form = textareaRef.current?.form;
                            if (form) {
                              form.requestSubmit();
                            }
                          }, 0);
                        }}
                        suggestion={Copy}
                      >
                        {Icon}
                        <span>{Copy}</span>
                      </Suggestion>
                    ))}
                  </Suggestions>
                </div>
              </div>
            </div>

            {/* Featured Templates Section */}
            {isAuthenticated && (
              <UserTemplates
                userName={getFirstOrLast() ?? undefined}
                userEmail={session?.user?.email ?? undefined}
              />
            )}

            <FeaturedTemplates />
          </main>

          <AppFooter />
        </div>

        {/* Enhancement dialogs */}
        <PromptEnhancerDialog
          open={showEnhancer}
          onOpenChange={setShowEnhancer}
          initialPrompt={message}
          onUsePrompt={handleUseEnhancedPrompt}
        />

        <PromptLibraryDialog
          open={showLibrary}
          onOpenChange={setShowLibrary}
          onSelectPrompt={handleUseEnhancedPrompt}
        />

        {isAuthenticated && isAutoProvisioning && <AutoProvisioningOverlay />}

        {isAuthenticated && <EnvVariablesDialog />}

        <Leva hidden />

        <UpgradePromptDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          feature={blockedFeature}
        />

        <WelcomeUpgradeDialog
          open={showWelcomeDialog}
          onOpenChange={setShowWelcomeDialog}
        />
      </>
    );
  }
}
