/**
 * Sidebar Utilities
 * 
 * Helper functions and constants for the AIWA sidebar component
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const SIDEBAR_CONFIG = {
  // Storage keys
  STORAGE_KEY: 'aiwa-sidebar-collapsed',
  
  // Dimensions
  WIDTH_EXPANDED: 256, // 16rem
  WIDTH_COLLAPSED: 64, // 4rem
  
  // Offsets
  TOP_OFFSET: 60, // Height of navbar
  
  // Z-indices
  Z_INDEX: 40,
  
  // Timing
  TRANSITION_DURATION: 300, // ms
  HOVER_DELAY: 200, // ms
  
  // Chat settings
  MAX_RECENT_CHATS: 10,
  COLLAPSED_CHAT_ICONS: 5,
  
  // Breakpoints
  MOBILE_BREAKPOINT: 768, // px
} as const

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Get sidebar collapsed state from localStorage
 */
export function getSidebarState(): boolean {
  if (typeof window === 'undefined') return false
  
  const saved = localStorage.getItem(SIDEBAR_CONFIG.STORAGE_KEY)
  return saved === 'true'
}

/**
 * Set sidebar collapsed state in localStorage
 */
export function setSidebarState(isCollapsed: boolean): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(SIDEBAR_CONFIG.STORAGE_KEY, String(isCollapsed))
  
  // Dispatch custom event for cross-component synchronization
  window.dispatchEvent(
    new CustomEvent('sidebar-toggle', {
      detail: { collapsed: isCollapsed },
    })
  )
}

/**
 * Subscribe to sidebar state changes
 */
export function subscribeSidebarState(
  callback: (isCollapsed: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleStorageChange = () => {
    callback(getSidebarState())
  }

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<{ collapsed: boolean }>
    callback(customEvent.detail.collapsed)
  }

  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('sidebar-toggle', handleCustomEvent as EventListener)

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener(
      'sidebar-toggle',
      handleCustomEvent as EventListener
    )
  }
}

// ============================================================================
// CHAT FORMATTING
// ============================================================================

/**
 * Format chat display name
 */
export function formatChatName(chat: {
  id: string
  name?: string
}): string {
  if (chat.name) return chat.name
  return `Chat ${chat.id.slice(0, 8)}...`
}

/**
 * Format relative time from date string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays}d ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`
  return `${Math.floor(diffInDays / 365)}y ago`
}

/**
 * Sort chats by most recent
 */
export function sortChatsByRecent<
  T extends { updatedAt?: string; createdAt: string }
>(chats: T[]): T[] {
  return [...chats].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt).getTime()
    return dateB - dateA // Most recent first
  })
}

/**
 * Truncate chat name with ellipsis
 */
export function truncateChatName(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) return name
  return `${name.slice(0, maxLength - 3)}...`
}

// ============================================================================
// RESPONSIVE HELPERS
// ============================================================================

/**
 * Check if viewport is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < SIDEBAR_CONFIG.MOBILE_BREAKPOINT
}

/**
 * Get sidebar width based on state
 */
export function getSidebarWidth(isCollapsed: boolean): number {
  return isCollapsed
    ? SIDEBAR_CONFIG.WIDTH_COLLAPSED
    : SIDEBAR_CONFIG.WIDTH_EXPANDED
}

/**
 * Calculate content margin for layout
 */
export function getContentMargin(isCollapsed: boolean): string {
  if (isMobile()) return '0px'
  return `${getSidebarWidth(isCollapsed)}px`
}

// ============================================================================
// ANIMATION HELPERS
// ============================================================================

/**
 * Create CSS transition string
 */
export function createTransition(
  properties: string[],
  duration: number = SIDEBAR_CONFIG.TRANSITION_DURATION,
  easing: string = 'ease-in-out'
): string {
  return properties
    .map((prop) => `${prop} ${duration}ms ${easing}`)
    .join(', ')
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate chat object structure
 */
export function isValidChat(chat: any): boolean {
  return (
    typeof chat === 'object' &&
    chat !== null &&
    typeof chat.id === 'string' &&
    typeof chat.createdAt === 'string'
  )
}

/**
 * Filter valid chats from API response
 */
export function filterValidChats<T extends { id: string; createdAt: string }>(
  chats: T[]
): T[] {
  return chats.filter(isValidChat)
}

// ============================================================================
// ACCESSIBILITY
// ============================================================================

/**
 * Generate accessible button label
 */
export function getAccessibleLabel(action: string, context?: string): string {
  if (context) return `${action}: ${context}`
  return action
}

/**
 * Get ARIA label for chat item
 */
export function getChatAriaLabel(chat: {
  name?: string
  id: string
  updatedAt?: string
  createdAt: string
}): string {
  const name = formatChatName(chat)
  const time = formatRelativeTime(chat.updatedAt || chat.createdAt)
  return `${name}, last updated ${time}`
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Handle keyboard navigation for sidebar
 */
export function handleSidebarKeyboard(
  event: KeyboardEvent,
  callbacks: {
    onToggle?: () => void
    onSearch?: () => void
    onNewChat?: () => void
  }
): void {
  const { key, metaKey, ctrlKey, shiftKey } = event

  // Cmd/Ctrl + B: Toggle sidebar
  if ((metaKey || ctrlKey) && key === 'b' && callbacks.onToggle) {
    event.preventDefault()
    callbacks.onToggle()
  }

  // Cmd/Ctrl + K: Search
  if ((metaKey || ctrlKey) && key === 'k' && callbacks.onSearch) {
    event.preventDefault()
    callbacks.onSearch()
  }

  // Cmd/Ctrl + N: New chat
  if (
    (metaKey || ctrlKey) &&
    key === 'n' &&
    !shiftKey &&
    callbacks.onNewChat
  ) {
    event.preventDefault()
    callbacks.onNewChat()
  }
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Log sidebar state for debugging
 */
export function debugSidebarState(): void {
  if (process.env.NODE_ENV !== 'development') return

  console.group('🎨 Sidebar Debug Info')
  console.log('Collapsed:', getSidebarState())
  console.log('Width:', getSidebarWidth(getSidebarState()))
  console.log('Is Mobile:', isMobile())
  console.log('Config:', SIDEBAR_CONFIG)
  console.groupEnd()
}

/**
 * Measure sidebar performance
 */
export function measureSidebarPerformance(
  operation: string,
  callback: () => void
): void {
  if (process.env.NODE_ENV !== 'development') return

  const start = performance.now()
  callback()
  const end = performance.now()

  console.log(`⚡ Sidebar ${operation}: ${(end - start).toFixed(2)}ms`)
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for chat object
 */
export function isChatObject(value: unknown): value is {
  id: string
  name?: string
  createdAt: string
  updatedAt?: string
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'createdAt' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).createdAt === 'string'
  )
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  config: SIDEBAR_CONFIG,
  state: {
    get: getSidebarState,
    set: setSidebarState,
    subscribe: subscribeSidebarState,
  },
  format: {
    chatName: formatChatName,
    relativeTime: formatRelativeTime,
    truncate: truncateChatName,
    accessibleLabel: getAccessibleLabel,
    chatAriaLabel: getChatAriaLabel,
  },
  responsive: {
    isMobile,
    getWidth: getSidebarWidth,
    getContentMargin,
  },
  animation: {
    createTransition,
    debounce,
  },
  validation: {
    isValidChat,
    filterValidChats,
    isChatObject,
  },
  keyboard: {
    handleNavigation: handleSidebarKeyboard,
  },
  debug: {
    logState: debugSidebarState,
    measurePerformance: measureSidebarPerformance,
  },
}