import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'v0-sdk'
import { auth } from '@/app/(auth)/auth'
import { getFeaturedChats, getFeaturedChatsCount } from '@/lib/db/queries'

// Create v0 client with custom baseUrl if V0_API_URL is set
const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {},
)

// Helper to extract title from chat messages
function extractTitleFromChat(chat: any): string | null {
  if (!chat.messages || chat.messages.length === 0) return null

  const firstUserMessage = chat.messages.find((msg: any) => msg.role === 'user')
  if (!firstUserMessage?.content) return null

  const content =
    typeof firstUserMessage.content === 'string'
      ? firstUserMessage.content
      : firstUserMessage.content[0]?.text || ''

  return content.length > 50 ? content.substring(0, 50).trim() + '...' : content
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const searchParams = request.nextUrl.searchParams

    // Get query parameters
    const visibility = (searchParams.get('visibility') || 'all') as
      | 'all'
      | 'public'
      | 'private'
      | 'team'
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('Fetching featured chats:', {
      visibility,
      limit,
      offset,
      userId: session?.user?.id,
    })

    // For anonymous users, force public visibility
    const effectiveVisibility =
      !session?.user?.id && visibility !== 'public' ? 'public' : visibility

    // Get ownership records with visibility filter (includes user info)
    const ownerships = await getFeaturedChats({
      visibility: effectiveVisibility,
      userId: session?.user?.id,
      limit,
      offset,
    })

    // Get total count for pagination
    const totalCount = await getFeaturedChatsCount({
      visibility: effectiveVisibility,
      userId: session?.user?.id,
    })

    // If no ownerships found, return empty array
    if (ownerships.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      })
    }

    // Get chat IDs from ownerships
    const chatIds = ownerships.map((o) => o.v0_chat_id)

    // Fetch actual chat data from v0 API
    const allChats = await v0.chats.find()

    // Filter and enrich chats with ownership data and user info
    const enrichedChats =
      allChats.data
        ?.filter((chat) => chatIds.includes(chat.id))
        .map((chat) => {
          const ownership = ownerships.find((o) => o.v0_chat_id === chat.id)

          // Determine title priority:
          // 1. Custom title from ownership
          // 2. Title from v0 API
          // 3. Extract from first message
          // 4. Fallback to ID
          const displayTitle =
            ownership?.title ||
            chat.title ||
            extractTitleFromChat(chat) ||
            `Project ${chat.id.slice(0, 8)}`

          return {
            ...chat,
            title: displayTitle,
            description: ownership?.description,
            visibility: ownership?.visibility,
            preview_url: ownership?.preview_url,
            demo_url: ownership?.demo_url,
            owner_id: ownership?.user_id,
            owner_email: ownership?.owner_email, // User attribution!
            owner_name: ownership?.owner_name, // User attribution!
            created_at: ownership?.created_at,
          }
        })
        .sort((a, b) => {
          // Sort by the order in ownerships array
          return chatIds.indexOf(a.id) - chatIds.indexOf(b.id)
        }) || []

    console.log('Featured chats fetched successfully:', enrichedChats.length)

    return NextResponse.json({
      data: enrichedChats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error('Featured chats fetch error:', error)

    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch featured chats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
