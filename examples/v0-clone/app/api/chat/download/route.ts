import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'v0-sdk'

const v0 = createClient(
  process.env.V0_API_URL ? { baseUrl: process.env.V0_API_URL } : {},
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const versionId = searchParams.get('versionId')
    const format = searchParams.get('format') as 'zip' | 'tarball' | null
    const includeDefaultFiles = searchParams.get('includeDefaultFiles')

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
      )
    }

    let targetVersionId = versionId

    // If no versionId provided, get the latest version
    if (!targetVersionId) {
      const versions = await v0.chats.findVersions({ chatId })

      if (!versions.data || versions.data.length === 0) {
        return NextResponse.json(
          { error: 'No versions found for this chat' },
          { status: 404 },
        )
      }

      // Get the latest version (first in the list)
      targetVersionId = versions.data[0].id
    }

    // Download the version
    const downloadBuffer = await v0.chats.downloadVersion({
      chatId,
      versionId: targetVersionId,
      ...(format && { format }),
      ...(includeDefaultFiles && {
        includeDefaultFiles: includeDefaultFiles === 'true',
      }),
    })

    // Determine content type and filename
    const contentType =
      format === 'tarball' ? 'application/x-tar' : 'application/zip'
    const extension = format === 'tarball' ? 'tar.gz' : 'zip'
    const filename = `app-${chatId}-${targetVersionId}.${extension}`

    // Return the buffer with appropriate headers
    return new Response(downloadBuffer as ArrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      {
        error: 'Failed to download chat version',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
