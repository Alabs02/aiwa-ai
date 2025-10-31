'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  type ImageAttachment,
} from '@/components/ai-elements/prompt-input'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { AppHeader } from '@/components/shared/app-header'
import { ChatMessages } from '@/components/chat/chat-messages'
import { ChatInput } from '@/components/chat/chat-input'
import { PreviewPanel } from '@/components/chat/preview-panel'
import { ResizableLayout } from '@/components/shared/resizable-layout'
import { BottomToolbar } from '@/components/shared/bottom-toolbar'
import { NavBar, Toolbar } from '@/components/shared'
import { GL } from '@/components/gl'
import { Leva } from 'leva'
import { suggestions } from '../constants/suggestions'
import { FeaturedProjects } from '@/components/projects/featured'

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SearchParamsHandler({ onReset }: { onReset: () => void }) {
  const searchParams = useSearchParams()

  // Reset UI when reset parameter is present
  useEffect(() => {
    const reset = searchParams.get('reset')
    if (reset === 'true') {
      onReset()

      // Remove the reset parameter from URL without triggering navigation
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('reset')
      window.history.replaceState({}, '', newUrl.pathname)
    }
  }, [searchParams, onReset])

  return null
}

interface HomeClientProps {
  isAuthenticated?: boolean
}

export function HomeClient({ isAuthenticated = false }: HomeClientProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showChatInterface, setShowChatInterface] = useState(false)
  const [attachments, setAttachments] = useState<ImageAttachment[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [chatHistory, setChatHistory] = useState<
    Array<{
      type: 'user' | 'assistant'
      content: string | any
      isStreaming?: boolean
      stream?: ReadableStream<Uint8Array> | null
    }>
  >([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentChat, setCurrentChat] = useState<{
    id: string
    demo?: string
  } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activePanel, setActivePanel] = useState<'chat' | 'preview'>('chat')
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hovering, setHovering] = useState(false)

  const handleReset = () => {
    // Reset all chat-related state
    setShowChatInterface(false)
    setChatHistory([])
    setCurrentChatId(null)
    setCurrentChat(null)
    setMessage('')
    setAttachments([])
    setIsLoading(false)
    setIsFullscreen(false)
    setRefreshKey((prev) => prev + 1)

    // Clear any stored data
    clearPromptFromStorage()

    // Focus textarea after reset
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Auto-focus the textarea on page load and restore from sessionStorage
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }

    // Restore prompt data from sessionStorage
    const storedData = loadPromptFromStorage()
    if (storedData) {
      setMessage(storedData.message)
      if (storedData.attachments.length > 0) {
        const restoredAttachments = storedData.attachments.map(
          createImageAttachmentFromStored,
        )
        setAttachments(restoredAttachments)
      }
    }
  }, [])

  // Save prompt data to sessionStorage whenever message or attachments change
  useEffect(() => {
    if (message.trim() || attachments.length > 0) {
      savePromptToStorage(message, attachments)
    } else {
      // Clear sessionStorage if both message and attachments are empty
      clearPromptFromStorage()
    }
  }, [message, attachments])

  // Image attachment handlers
  const handleImageFiles = async (files: File[]) => {
    try {
      const newAttachments = await Promise.all(
        files.map((file) => createImageAttachment(file)),
      )
      setAttachments((prev) => [...prev, ...newAttachments])
    } catch (error) {
      console.error('Error processing image files:', error)
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const handleDragOver = () => {
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = () => {
    setIsDragOver(false)
  }

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    const currentAttachments = [...attachments]

    // Clear sessionStorage immediately upon submission
    clearPromptFromStorage()

    setMessage('')
    setAttachments([])

    // Immediately show chat interface and add user message
    setShowChatInterface(true)
    setChatHistory([
      {
        type: 'user',
        content: userMessage,
      },
    ])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          streaming: true,
          attachments: currentAttachments.map((att) => ({ url: att.dataUrl })),
        }),
      })

      if (!response.ok) {
        // Try to get the specific error message from the response
        let errorMessage =
          'Sorry, there was an error processing your message. Please try again.'
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (response.status === 429) {
            errorMessage =
              'You have exceeded your maximum number of messages for the day. Please try again later.'
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          if (response.status === 429) {
            errorMessage =
              'You have exceeded your maximum number of messages for the day. Please try again later.'
          }
        }
        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('No response body for streaming')
      }

      setIsLoading(false)

      // Add streaming assistant response
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: [],
          isStreaming: true,
          stream: response.body,
        },
      ])
    } catch (error) {
      console.error('Error creating chat:', error)
      setIsLoading(false)

      // Use the specific error message if available, otherwise fall back to generic message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Sorry, there was an error processing your message. Please try again.'

      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: errorMessage,
        },
      ])
    }
  }

  const handleStreamingComplete = () => {
    setIsLoading(false)
  }

  const handleChatData = (data: { id: string; demo?: string }) => {
    if (!currentChatId && data.id) {
      // First time receiving chat ID - set it and navigate
      setCurrentChatId(data.id)
      setCurrentChat(data)

      // Update URL to /chats/{chatId}
      window.history.pushState(null, '', `/chats/${data.id}`)

      console.log('Chat created with ID:', data.id)
    } else if (
      data.demo &&
      (!currentChat?.demo || currentChat.demo !== data.demo)
    ) {
      // Demo URL came through - update it
      setCurrentChat((prev) => (prev ? { ...prev, demo: data.demo } : null))

      // Auto-switch to preview on mobile when demo is ready
      if (window.innerWidth < 768) {
        setActivePanel('preview')
      }
    }
  }

  const handleStreamingStarted = () => {
    setIsLoading(false)
  }

  const handleChatSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    // Add user message to chat history
    setChatHistory((prev) => [...prev, { type: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatId: currentChatId,
          streaming: true,
        }),
      })

      if (!response.ok) {
        // Try to get the specific error message from the response
        let errorMessage =
          'Sorry, there was an error processing your message. Please try again.'
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (response.status === 429) {
            errorMessage =
              'You have exceeded your maximum number of messages for the day. Please try again later.'
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          if (response.status === 429) {
            errorMessage =
              'You have exceeded your maximum number of messages for the day. Please try again later.'
          }
        }
        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('No response body for streaming')
      }

      setIsLoading(false)

      // Add streaming response
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: [],
          isStreaming: true,
          stream: response.body,
        },
      ])
    } catch (error) {
      console.error('Error:', error)

      // Use the specific error message if available, otherwise fall back to generic message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Sorry, there was an error processing your message. Please try again.'

      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: errorMessage,
        },
      ])
      setIsLoading(false)
    }
  }

  if (showChatInterface) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
        {/* Handle search params with Suspense boundary */}
        <Suspense fallback={null}>
          <SearchParamsHandler onReset={handleReset} />
        </Suspense>

        {/* Navbar */}
        <NavBar />

        <div className="flex flex-col h-[calc(100vh-60px-40px)] md:h-[calc(100vh-60px)]">
          <ResizableLayout
            className="flex-1 min-h-0"
            singlePanelMode={false}
            activePanel={activePanel === 'chat' ? 'left' : 'right'}
            leftPanel={
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                  <ChatMessages
                    chatHistory={chatHistory}
                    isLoading={isLoading}
                    currentChat={currentChat}
                    onStreamingComplete={handleStreamingComplete}
                    onChatData={handleChatData}
                    onStreamingStarted={() => setIsLoading(false)}
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
      </div>
    )
  }

  return (
    <>
      <div className="min-h-svh bg-gray-50 dark:bg-black flex flex-col">
        <GL hovering={hovering} />

        {/* Handle search params with Suspense boundary */}
        <Suspense fallback={null}>
          <SearchParamsHandler onReset={handleReset} />
        </Suspense>

        {/* Toolbar */}
        <Toolbar />

        {/* Main Content */}
        <main className="relative flex-1 z-10 border-none border-white w-full flex flex-col">
          {/* Hero Section */}
          <div className="min-h-[calc(100vh-60px)] flex flex-col gap-y-12 md:gap-y-24 justify-center-safe items-center-safe px-5 md:px-4">
            <div className="max-w-3xl w-full flex flex-col items-center-safe border-none">
              <h2 className="text-center font-heading text-2xl sm:text-3xl md:text-5xl 2xl:text-6xl font-bold text-white">
                Vibe. Build. Deploy.
              </h2>

              <p className="font-body text-center text-base sm:text-lg md:text-xl text-neutral-300/95 bg-black/50 inline-block w-auto rounded-full px-4 py-2 mt-4 border">
                Vibe-code your imagination. Bring it to life with Aiwa.
              </p>

              {/* Prompt Input */}
              <div
                className="w-full mt-8"
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
              >
                <PromptInput
                  onSubmit={handleSendMessage}
                  className="w-full relative"
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
                      <PromptInputImageButton
                        onImageSelect={handleImageFiles}
                        disabled={isLoading}
                      />
                    </PromptInputTools>
                    <PromptInputTools>
                      <PromptInputMicButton
                        onTranscript={(transcript) => {
                          setMessage(
                            (prev) => prev + (prev ? ' ' : '') + transcript,
                          )
                        }}
                        onError={(error) => {
                          console.error('Speech recognition error:', error)
                        }}
                        disabled={isLoading}
                      />
                      <PromptInputSubmit
                        disabled={!message.trim() || isLoading}
                        status={isLoading ? 'streaming' : 'ready'}
                      />
                    </PromptInputTools>
                  </PromptInputToolbar>
                </PromptInput>
              </div>

              {/* Suggestions */}
              <div className="w-full mt-4">
                <Suggestions>
                  {suggestions.map(({ Copy, Icon, Prompt }, idx) => (
                    <Suggestion
                      key={`${Copy}-${idx}`}
                      onClick={() => {
                        setMessage(Prompt)
                        // Submit after setting message
                        setTimeout(() => {
                          const form = textareaRef.current?.form
                          if (form) {
                            form.requestSubmit()
                          }
                        }, 0)
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

          {/* Featured Projects Section */}
          <div className="w-full bg-black/30 backdrop-blur-sm border-t border-neutral-800">
            <FeaturedProjects isAuthenticated={isAuthenticated} />
          </div>
        </main>
      </div>

      <Leva hidden />
    </>
  )
}
