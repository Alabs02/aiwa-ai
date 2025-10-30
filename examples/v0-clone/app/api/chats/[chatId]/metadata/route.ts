import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getChatOwnership } from '@/lib/db/queries'
import db from '@/lib/db/connection'
import { chat_ownerships } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } },
) {
  try {
    const session = await auth()

    // Must be authenticated to update metadata
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const chatId = params.chatId
    const body = await request.json()
    const { title, description } = body

    // Validate inputs
    if (title && title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be 255 characters or less' },
        { status: 400 },
      )
    }

    // Check if chat exists and user owns it
    const ownership = await getChatOwnership({ v0ChatId: chatId })

    if (!ownership) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Verify ownership
    if (ownership.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this chat' },
        { status: 403 },
      )
    }

    // Update title and/or description
    const updateData: { title?: string; description?: string } = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description

    const [updated] = await db
      .update(chat_ownerships)
      .set(updateData)
      .where(eq(chat_ownerships.v0_chat_id, chatId))
      .returning()

    console.log('Chat metadata updated:', {
      chatId,
      title,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating chat metadata:', error)

    return NextResponse.json(
      {
        error: 'Failed to update chat metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// GET endpoint to fetch metadata for a specific chat
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } },
) {
  try {
    const chatId = params.chatId

    // Get chat ownership
    const ownership = await getChatOwnership({ v0ChatId: chatId })

    if (!ownership) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json({
      title: ownership.title,
      description: ownership.description,
      visibility: ownership.visibility,
      previewUrl: ownership.preview_url,
      demoUrl: ownership.demo_url,
    })
  } catch (error) {
    console.error('Error fetching chat metadata:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch chat metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
