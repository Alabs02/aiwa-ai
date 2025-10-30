'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, User } from 'lucide-react'
import { FeaturedProjectsSkeleton } from './card-skeleton'

type VisibilityFilter = 'all' | 'public' | 'private' | 'team'

interface FeaturedChat {
  id: string
  title?: string
  demo?: string
  visibility?: string
  preview_url?: string
  demo_url?: string
  owner_id?: string
  owner_email?: string
  owner_name?: string
  created_at?: string
  messages?: any[]
}

interface FeaturedProjectsProps {
  isAuthenticated?: boolean
}

export function FeaturedProjects({
  isAuthenticated = false,
}: FeaturedProjectsProps) {
  const [activeFilter, setActiveFilter] = useState<VisibilityFilter>('all')
  const [chats, setChats] = useState<FeaturedChat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const limit = 12

  useEffect(() => {
    // Reset when filter changes
    setOffset(0)
    fetchChats(activeFilter, 0, true)
  }, [activeFilter])

  const fetchChats = async (
    visibility: VisibilityFilter,
    currentOffset: number,
    reset = false,
  ) => {
    try {
      if (reset) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await fetch(
        `/api/chats/featured?visibility=${visibility}&limit=${limit}&offset=${currentOffset}`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch featured chats')
      }

      const data = await response.json()

      if (reset) {
        setChats(data.data || [])
      } else {
        setChats((prev) => [...prev, ...(data.data || [])])
      }

      setHasMore(data.pagination?.hasMore || false)
    } catch (error) {
      console.error('Error fetching featured chats:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    const newOffset = offset + limit
    setOffset(newOffset)
    fetchChats(activeFilter, newOffset, false)
  }

  // Determine available filters based on authentication
  const filters: Array<{ value: VisibilityFilter; label: string }> =
    isAuthenticated
      ? [
          { value: 'all', label: 'All' },
          { value: 'public', label: 'Public' },
          { value: 'private', label: 'Private' },
          { value: 'team', label: 'Team' },
        ]
      : [{ value: 'public', label: 'Public' }]

  // Auto-switch to public for anonymous users
  useEffect(() => {
    if (!isAuthenticated && activeFilter !== 'public') {
      setActiveFilter('public')
    }
  }, [isAuthenticated, activeFilter])

  return (
    <section className="w-full py-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Featured Projects
        </h2>
        <p className="text-neutral-400">
          Discover what the community is building with Aiwa
        </p>
      </div>

      {/* Filters */}
      {isAuthenticated && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.value
                  ? 'bg-white text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading State with Skeletons */}
      {isLoading ? (
        <FeaturedProjectsSkeleton count={6} />
      ) : chats.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-400 text-lg">
            No projects found. Be the first to share!
          </p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {chats.map((chat) => (
              <ProjectCard key={chat.id} chat={chat} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// Helper function to generate title from chat
function generateTitle(chat: FeaturedChat): string {
  if (chat.title) return chat.title

  if (chat.messages && chat.messages.length > 0) {
    const firstUserMessage = chat.messages.find(
      (msg: any) => msg.role === 'user',
    )
    if (firstUserMessage?.content) {
      const content =
        typeof firstUserMessage.content === 'string'
          ? firstUserMessage.content
          : firstUserMessage.content[0]?.text || ''

      return content.length > 50
        ? content.substring(0, 50).trim() + '...'
        : content
    }
  }

  return `Project ${chat.id.slice(0, 8)}`
}

// Helper to get user display name
function getUserDisplayName(chat: FeaturedChat): string {
  if (chat.owner_name) return chat.owner_name
  if (chat.owner_email) {
    // Extract name from email (e.g., john.doe@example.com -> John Doe)
    const username = chat.owner_email.split('@')[0]
    return username
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }
  return 'Anonymous'
}

// Helper to get initials for avatar
function getUserInitials(chat: FeaturedChat): string {
  const name = getUserDisplayName(chat)
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ProjectCard({ chat }: { chat: FeaturedChat }) {
  const [imageError, setImageError] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const hasPreview = chat.preview_url && !imageError
  const canShowIframe = chat.demo_url || chat.demo
  const displayTitle = generateTitle(chat)
  const displayName = getUserDisplayName(chat)
  const initials = getUserInitials(chat)

  return (
    <Link
      href={`/chats/${chat.id}`}
      className="group block bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-all hover:shadow-xl hover:shadow-neutral-900/50"
    >
      {/* Preview/Thumbnail */}
      <div className="aspect-video bg-neutral-800 relative overflow-hidden">
        {hasPreview ? (
          <Image
            src={chat.preview_url!}
            alt={displayTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : canShowIframe ? (
          <div className="w-full h-full relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                <Loader2 className="w-6 h-6 text-neutral-600 animate-spin" />
              </div>
            )}
            <iframe
              src={chat.demo_url || chat.demo}
              className="w-full h-full border-0 pointer-events-none"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setIframeLoaded(true)}
              style={{
                transform: 'scale(0.5)',
                transformOrigin: 'top left',
                width: '200%',
                height: '200%',
              }}
              title={displayTitle}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl font-bold text-neutral-700">
              {chat.id.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {/* Visibility Badge */}
        {chat.visibility && chat.visibility !== 'public' && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-medium bg-black/80 text-white rounded-md backdrop-blur-sm border border-neutral-700 capitalize">
              {chat.visibility}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-medium text-lg mb-1 group-hover:text-neutral-200 transition-colors line-clamp-2">
          {displayTitle}
        </h3>
        <p className="text-neutral-500 text-sm mb-3">
          Created{' '}
          {chat.created_at
            ? new Date(chat.created_at).toLocaleDateString()
            : 'recently'}
        </p>

        {/* Creator Attribution */}
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-400 border border-neutral-700">
            {initials}
          </div>

          {/* Creator Name */}
          <span className="text-sm text-neutral-500">
            by <span className="text-neutral-400">{displayName}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
