import { useState, useCallback } from 'react'

/**
 * Hook for handling copy to clipboard functionality
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      return false
    }
  }, [])

  return { copied, copyToClipboard }
}

/**
 * Hook for handling message expansion/collapse
 */
export function useMessageExpansion(content: string, threshold: number = 400) {
  const [expanded, setExpanded] = useState(false)

  const isLongMessage = content.length > threshold
  const displayContent =
    !expanded && isLongMessage ? content.slice(0, threshold) + '...' : content

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  return {
    expanded,
    isLongMessage,
    displayContent,
    toggleExpanded,
  }
}

/**
 * Hook for formatting user initials from email or name
 */
export function useUserInitials(
  email?: string | null,
  name?: string | null,
): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  if (email) {
    return email.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U'
  }

  return 'U'
}

/**
 * Hook for handling message timestamps
 */
export function useMessageTimestamp(timestamp?: Date | string) {
  const formatTimestamp = useCallback((ts?: Date | string) => {
    if (!ts) return null

    const date = typeof ts === 'string' ? new Date(ts) : ts
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now'
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days} ${days === 1 ? 'day' : 'days'} ago`
    }

    // More than 7 days, show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }, [])

  return formatTimestamp(timestamp)
}
