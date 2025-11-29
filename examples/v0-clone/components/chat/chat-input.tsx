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
import { UpgradePromptDialog } from "@/components/shared/upgrade-prompt-dialog";
import { useFeatureAccess } from "@/hooks/use-feature-access";

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

  // Feature access hook - replaces manual plan state
  const featureAccess = useFeatureAccess();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");

  const handleSpeechTranscript = useCallback(
    (transcript: string) => {
      if (!featureAccess.canUseTranscribe) {
        setBlockedFeature("Speech-to-Text");
        setShowUpgradeDialog(true);
        return;
      }

      const newMessage = message + (message ? " " : "") + transcript;
      setMessage(newMessage);

      setTimeout(() => {
        const textarea = textareaRef?.current;
        if (textarea) {
          textarea.focus();
          const length = newMessage.length;
          textarea.setSelectionRange(length, length);
        }
      }, 100);
    },
    [message, setMessage, textareaRef, featureAccess.canUseTranscribe]
  );

  const handleSpeechError = useCallback((error: string) => {
    console.error("Speech recognition error:", error);
    // Error toast already handled by mic button
  }, []);

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

  const handleDragOver = useCallback(() => setIsDragOver(true), []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDrop = useCallback(() => setIsDragOver(false), []);

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

  const handleOpenEnhancer = () => {
    if (!featureAccess.canUsePromptEnhancer) {
      setBlockedFeature("Prompt Enhancer");
      setShowUpgradeDialog(true);
      return;
    }
    setShowEnhancer(true);
  };

  const handleOpenLibrary = () => {
    if (!featureAccess.canUsePromptLibrary) {
      setBlockedFeature("Prompt Library");
      setShowUpgradeDialog(true);
      return;
    }
    setShowLibrary(true);
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
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleOpenLibrary}
                className="h-8 w-8 p-0 text-white/60 hover:text-white"
                title="Browse prompt library"
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
              >
                <Wand2 className="h-4 w-4" />
              </Button>

              <PromptInputImageButton onImageSelect={handleImageFiles} />
            </PromptInputTools>
            <PromptInputTools>
              <PromptInputMicButton
                onTranscript={handleSpeechTranscript}
                onError={(e) => handleSpeechError(e?.toString())}
                disabled={isLoading}
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
            {[
              "Landing page",
              "Todo app",
              "Dashboard",
              "Blog",
              "E-commerce",
              "Portfolio",
              "Chat app",
              "Calculator"
            ].map((suggestion) => (
              <Suggestion
                key={suggestion}
                onClick={() => {
                  setMessage(suggestion);
                  setTimeout(() => {
                    textareaRef?.current?.form?.requestSubmit();
                  }, 0);
                }}
                suggestion={suggestion}
              />
            ))}
          </Suggestions>
        </div>
      )}

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

      <UpgradePromptDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature={blockedFeature}
      />
    </div>
  );
}
