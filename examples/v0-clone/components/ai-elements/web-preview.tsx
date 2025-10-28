'use client'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  ChevronDownIcon,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  ExternalLink,
  Code2,
  Eye,
  Terminal,
} from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'

export type DeviceMode = 'desktop' | 'tablet' | 'phone'

export type WebPreviewContextValue = {
  url: string
  setUrl: (url: string) => void
  consoleOpen: boolean
  setConsoleOpen: (open: boolean) => void
  deviceMode: DeviceMode
  setDeviceMode: (mode: DeviceMode) => void
  activeTab: 'preview' | 'code'
  setActiveTab: (tab: 'preview' | 'code') => void
}

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null)

const useWebPreview = () => {
  const context = useContext(WebPreviewContext)
  if (!context) {
    throw new Error('WebPreview components must be used within a WebPreview')
  }
  return context
}

export type WebPreviewProps = ComponentProps<'div'> & {
  defaultUrl?: string
  onUrlChange?: (url: string) => void
  onDownload?: () => void
  onOpenExternal?: () => void
}

export const WebPreview = ({
  className,
  children,
  defaultUrl = '',
  onUrlChange,
  onDownload,
  onOpenExternal,
  ...props
}: WebPreviewProps) => {
  const [url, setUrl] = useState(defaultUrl)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    onUrlChange?.(newUrl)
  }

  const contextValue: WebPreviewContextValue = {
    url,
    setUrl: handleUrlChange,
    consoleOpen,
    setConsoleOpen,
    deviceMode,
    setDeviceMode,
    activeTab,
    setActiveTab,
  }

  return (
    <WebPreviewContext.Provider value={contextValue}>
      <div
        className={cn('flex size-full flex-col bg-card', className)}
        {...props}
      >
        {children}
      </div>
    </WebPreviewContext.Provider>
  )
}

export type WebPreviewNavigationProps = ComponentProps<'div'> & {
  onDownload?: () => void
  onOpenExternal?: () => void
  hasContent?: boolean
}

export const WebPreviewNavigation = ({
  className,
  children,
  onDownload,
  onOpenExternal,
  hasContent = false,
  ...props
}: WebPreviewNavigationProps) => {
  const { deviceMode, setDeviceMode, activeTab, setActiveTab, url } =
    useWebPreview()

  const deviceModes: Array<{
    mode: DeviceMode
    icon: typeof Monitor
    label: string
  }> = [
    { mode: 'desktop', icon: Monitor, label: 'Desktop' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet' },
    { mode: 'phone', icon: Smartphone, label: 'Phone' },
  ]

  return (
    <div
      className={cn('flex flex-col border-b bg-background', className)}
      {...props}
    >
      {/* Top bar with tabs and actions */}
      <div className="flex items-center justify-between px-2 py-2 border-b">
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'preview' | 'code')}
          className="w-auto"
        >
          <TabsList className="h-8 bg-muted/50">
            <TabsTrigger
              value="preview"
              className="text-xs gap-1.5 h-7 px-3 !font-button"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="text-xs gap-1.5 h-7 px-3 !font-button"
            >
              <Code2 className="h-3.5 w-3.5" />
              Code
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onDownload}
                  disabled={!hasContent}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download ZIP</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onOpenExternal}
                  // disabled={!hasContent || !url}
                  disabled={!hasContent}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in new tab</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Navigation bar with device modes and URL */}
      {activeTab === 'preview' && (
        <div className="flex items-center gap-2 p-2">
          {/* Device mode selector */}
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={!hasContent}
                    >
                      {deviceMode === 'desktop' && (
                        <Monitor className="h-4 w-4" />
                      )}
                      {deviceMode === 'tablet' && (
                        <Tablet className="h-4 w-4" />
                      )}
                      {deviceMode === 'phone' && (
                        <Smartphone className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Device mode</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="start">
              {deviceModes.map(({ mode, icon: Icon, label }) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => setDeviceMode(mode)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {deviceMode === mode && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* URL bar and other controls */}
          {children}
        </div>
      )}
    </div>
  )
}

export type WebPreviewNavigationButtonProps = ComponentProps<typeof Button> & {
  tooltip?: string
}

export const WebPreviewNavigationButton = ({
  onClick,
  disabled,
  tooltip,
  children,
  ...props
}: WebPreviewNavigationButtonProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="h-8 w-8 p-0 hover:text-foreground"
          disabled={disabled}
          onClick={onClick}
          size="sm"
          variant="ghost"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
)

export type WebPreviewUrlProps = ComponentProps<typeof Input>

export const WebPreviewUrl = ({
  value,
  onChange,
  onKeyDown,
  ...props
}: WebPreviewUrlProps) => {
  const { url, setUrl } = useWebPreview()

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const target = event.target as HTMLInputElement
      setUrl(target.value)
    }
    onKeyDown?.(event)
  }

  return (
    <Input
      className="h-8 flex-1 text-sm min-w-"
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder="Enter URL..."
      value={value ?? url}
      {...props}
    />
  )
}

export type WebPreviewBodyProps = ComponentProps<'div'> & {
  loading?: ReactNode
  iframeSrc?: string
  codeContent?: ReactNode
}

export const WebPreviewBody = ({
  className,
  loading,
  iframeSrc,
  codeContent,
  children,
  ...props
}: WebPreviewBodyProps) => {
  const { url, deviceMode, activeTab } = useWebPreview()

  const deviceDimensions = {
    desktop: 'w-full',
    tablet: 'w-[768px] max-w-full',
    phone: 'w-[375px] max-w-full',
  }

  const src = iframeSrc ?? url

  return (
    <div
      className={cn(
        'flex-1 flex items-start justify-center overflow-auto bg-muted/30',
        className,
      )}
      {...props}
    >
      {activeTab === 'preview' ? (
        <div
          className={cn(
            'h-full transition-all duration-300',
            deviceDimensions[deviceMode],
          )}
        >
          {src ? (
            <>
              <iframe
                className="size-full bg-white dark:bg-gray-950"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                src={src}
                title="Preview"
              />
              {loading}
            </>
          ) : (
            children
          )}
        </div>
      ) : (
        <div className="w-full h-full">{codeContent || children}</div>
      )}
    </div>
  )
}

export type WebPreviewConsoleProps = ComponentProps<'div'> & {
  logs?: Array<{
    level: 'log' | 'warn' | 'error'
    message: string
    timestamp: Date
  }>
}

export const WebPreviewConsole = ({
  className,
  logs = [],
  children,
  ...props
}: WebPreviewConsoleProps) => {
  const { consoleOpen, setConsoleOpen } = useWebPreview()

  return (
    <Collapsible
      className={cn('border-t bg-muted/50 font-mono text-sm', className)}
      onOpenChange={setConsoleOpen}
      open={consoleOpen}
      {...props}
    >
      <CollapsibleTrigger asChild>
        <Button
          className="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-muted/50 h-auto rounded-none"
          variant="ghost"
        >
          <span className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Console
            {logs.length > 0 && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                {logs.length}
              </span>
            )}
          </span>
          <ChevronDownIcon
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              consoleOpen && 'rotate-180',
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'px-4 pb-4',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
        )}
      >
        <div className="max-h-48 space-y-1 overflow-y-auto bg-background rounded-md p-3">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-xs">No console output</p>
          ) : (
            logs.map((log, index) => (
              <div
                className={cn(
                  'text-xs leading-relaxed',
                  log.level === 'error' && 'text-destructive',
                  log.level === 'warn' &&
                    'text-yellow-600 dark:text-yellow-500',
                  log.level === 'log' && 'text-foreground',
                )}
                key={`${log.timestamp.getTime()}-${index}`}
              >
                <span className="text-muted-foreground">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>{' '}
                {log.message}
              </div>
            ))
          )}
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
