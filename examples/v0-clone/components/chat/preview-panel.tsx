import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
  WebPreviewConsole,
} from '@/components/ai-elements/web-preview'
import { PreviewLoadingAnimation, CodeGenerationAnimation } from '@/components/ai-elements/preview-loading-animations'
import { RefreshCw, Maximize, Minimize } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface Chat {
  id: string
  demo?: string
  url?: string
}

interface PreviewPanelProps {
  currentChat: Chat | null
  isFullscreen: boolean
  setIsFullscreen: (fullscreen: boolean) => void
  refreshKey: number
  setRefreshKey: (key: number | ((prev: number) => number)) => void
  isGenerating?: boolean
  consoleLogs?: Array<{
    level: 'log' | 'warn' | 'error'
    message: string
    timestamp: Date
  }>
}

export function PreviewPanel({
  currentChat,
  isFullscreen,
  setIsFullscreen,
  refreshKey,
  setRefreshKey,
  isGenerating = false,
  consoleLogs = [],
}: PreviewPanelProps) {
  const hasContent = !!currentChat?.demo

  // const handleDownload = () => {
  //   if (!currentChat?.demo) return

  //   // Create a temporary anchor element to trigger download
  //   const link = document.createElement('a')
  //   link.href = `${currentChat.demo}/download`
  //   link.download = `app-${currentChat.id}.zip`
  //   document.body.appendChild(link)
  //   link.click()
  //   document.body.removeChild(link)
  // }

  const handleDownload = async () => {
    if (!currentChat?.id) return
  
    try {
      const params = new URLSearchParams({
        chatId: currentChat.id,
        format: 'zip',
        includeDefaultFiles: 'true',
      })
  
      const response = await fetch(`/api/chat/download?${params}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
  
      // Get the blob from the response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `app-${currentChat.id}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      // Optional: Add toast notification for user feedback
    }
  }

  const handleOpenExternal = () => {
    if (!currentChat?.demo) return
    window.open(currentChat.demo, '_blank', 'noopener,noreferrer')
  }

  const getEmptyState = () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-black">
      <div className="text-center max-w-md px-8">
        <div className="mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
            <svg
              className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No preview available
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Start a conversation to see your app come to life here
        </p>
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-black' : 'flex-1',
      )}
    >
      <WebPreview
        defaultUrl={currentChat?.demo || ''}
        onUrlChange={(url) => {
          console.log('Preview URL changed:', url)
        }}
        onDownload={handleDownload}
        onOpenExternal={handleOpenExternal}
      >
        <WebPreviewNavigation
          onDownload={handleDownload}
          onOpenExternal={handleOpenExternal}
          hasContent={hasContent}
        >
          <WebPreviewNavigationButton
            onClick={() => {
              setRefreshKey((prev) => prev + 1)
            }}
            tooltip="Refresh preview"
            disabled={!hasContent}
          >
            <RefreshCw className="h-4 w-4" />
          </WebPreviewNavigationButton>

          <WebPreviewUrl
            readOnly
            placeholder="Your app will appear here..."
            value={currentChat?.demo || ''}
          />

          <WebPreviewNavigationButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            tooltip={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            disabled={!hasContent && !isGenerating}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </WebPreviewNavigationButton>
        </WebPreviewNavigation>

        <WebPreviewBody
          key={refreshKey}
          iframeSrc={currentChat?.demo}
          loading={isGenerating ? <PreviewLoadingAnimation /> : undefined}
          codeContent={
            isGenerating ? <CodeGenerationAnimation /> : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Code view will be available soon
              </div>
            )
          }
        >
          {!hasContent && !isGenerating ? getEmptyState() : null}
        </WebPreviewBody>

        {hasContent && (
          <WebPreviewConsole logs={consoleLogs} />
        )}
      </WebPreview>
    </div>
  )
}