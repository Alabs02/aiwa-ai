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
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Library } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    attachments?: Array<{ url: string }>
  ) => void;
  className?: string;
  isLoading: boolean;
  showSuggestions: boolean;
  attachments?: ImageAttachment[];
  onAttachmentsChange?: (attachments: ImageAttachment[]) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  message,
  setMessage,
  onSubmit,
  className,
  isLoading,
  showSuggestions,
  attachments = [],
  onAttachmentsChange,
  textareaRef
}: ChatInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEnhancer, setShowEnhancer] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [promptAnalysis, setPromptAnalysis] = useState<any>(null);

  const handleImageFiles = useCallback(
    async (files: File[]) => {
      if (!onAttachmentsChange) return;

      try {
        const newAttachments = await Promise.all(
          files.map((file) => createImageAttachment(file))
        );
        onAttachmentsChange([...attachments, ...newAttachments]);
      } catch (error) {
        console.error("Error processing image files:", error);
      }
    },
    [attachments, onAttachmentsChange]
  );

  const handleRemoveAttachment = useCallback(
    (id: string) => {
      if (!onAttachmentsChange) return;
      onAttachmentsChange(attachments.filter((att) => att.id !== id));
    },
    [attachments, onAttachmentsChange]
  );

  const handleDragOver = useCallback(() => {
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(() => {
    setIsDragOver(false);
  }, []);

  useEffect(() => {
    if (message.trim() || attachments.length > 0) {
      savePromptToStorage(message, attachments);
    } else {
      clearPromptFromStorage();
    }
  }, [message, attachments]);

  useEffect(() => {
    if (!message && attachments.length === 0) {
      const storedData = loadPromptFromStorage();
      if (storedData) {
        setMessage(storedData.message);
        if (storedData.attachments.length > 0 && onAttachmentsChange) {
          const restoredAttachments = storedData.attachments.map(
            createImageAttachmentFromStored
          );
          onAttachmentsChange(restoredAttachments);
        }
      }
    }
  }, [message, attachments, setMessage, onAttachmentsChange]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      clearPromptFromStorage();

      const attachmentUrls = attachments.map((att) => ({ url: att.dataUrl }));
      onSubmit(e, attachmentUrls.length > 0 ? attachmentUrls : undefined);
    },
    [onSubmit, attachments]
  );

  const handleUseEnhancedPrompt = (enhancedPrompt: string) => {
    setMessage(enhancedPrompt);
  };

  return (
    <div className={cn("px-4 md:pb-4", className)}>
      <div className="flex gap-2">
        <PromptInput
          onSubmit={handleSubmit}
          className="relative mx-auto w-full max-w-2xl"
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
            className="min-h-[60px]"
            placeholder="Continue the conversation..."
          />

          <PromptInputToolbar>
            <PromptInputTools>
              {/* New enhancement tools */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowLibrary(true)}
                className="h-8 w-8 p-0 text-white/60 hover:text-white"
                title="Browse prompt library"
              >
                <Library className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowEnhancer(true)}
                className="h-8 w-8 p-0 text-white/60 hover:text-white"
                title="Enhance prompt"
              >
                <Wand2 className="h-4 w-4" />
              </Button>

              <PromptInputImageButton onImageSelect={handleImageFiles} />
            </PromptInputTools>
            <PromptInputTools>
              <PromptInputMicButton
                onTranscript={(transcript) => {
                  setMessage(message + (message ? " " : "") + transcript);
                }}
                onError={(error) => {
                  console.error("Speech recognition error:", error);
                }}
              />
              <PromptInputSubmit
                disabled={!message}
                status={isLoading ? "streaming" : "ready"}
              />
            </PromptInputTools>
          </PromptInputToolbar>
        </PromptInput>
      </div>

      {showSuggestions && (
        <div className="mx-auto mt-2 max-w-2xl">
          <Suggestions>
            <Suggestion
              onClick={() => {
                setMessage("Landing page");
                setTimeout(() => {
                  const form = textareaRef?.current?.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 0);
              }}
              suggestion="Landing page"
            />
            <Suggestion
              onClick={() => {
                setMessage("Todo app");
                setTimeout(() => {
                  const form = textareaRef?.current?.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 0);
              }}
              suggestion="Todo app"
            />
            <Suggestion
              onClick={() => {
                setMessage("Dashboard");
                setTimeout(() => {
                  const form = textareaRef?.current?.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 0);
              }}
              suggestion="Dashboard"
            />
            <Suggestion
              onClick={() => {
                setMessage("Blog");
                setTimeout(() => {
                  const form = textareaRef?.current?.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 0);
              }}
              suggestion="Blog"
            />
            <Suggestion
              onClick={() => {
                setMessage("E-commerce");
                setTimeout(() => {
                  const form = textareaRef?.current?.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 0);
              }}
              suggestion="E-commerce"
            />
            <Suggestion
              onClick={() => {
                setMessage("Portfolio");
                setTimeout(() => {
                  const form = textareaRef?.current?.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 0);
              }}
              suggestion="Portfolio"
            />
            <Suggestion
              onClick={() => {
                setMessage("Chat app");
                setTimeout(() => {
                  const form = textareaRef?.current?.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 0);
              }}
              suggestion="Chat app"
            />
            <Suggestion
              onClick={() => {
                setMessage("Calculator");
                setTimeout(() => {
                  const form = textareaRef?.current?.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 0);
              }}
              suggestion="Calculator"
            />
          </Suggestions>
        </div>
      )}

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
    </div>
  );
}
