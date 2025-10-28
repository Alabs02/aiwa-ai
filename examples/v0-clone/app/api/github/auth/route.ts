import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientId = process.env.GITHUB_EXPORTER_CLIENT_ID

    if (!clientId) {
      return NextResponse.json(
        { error: 'GitHub OAuth not configured' },
        { status: 500 },
      )
    }

    const redirectUri = `${request.nextUrl.origin}/api/github/callback`
    const state = Buffer.from(
      JSON.stringify({ userId: session.user.id }),
    ).toString('base64')

    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', clientId)
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri)
    githubAuthUrl.searchParams.set('scope', 'repo')
    githubAuthUrl.searchParams.set('state', state)

    return NextResponse.redirect(githubAuthUrl.toString())
  } catch (error) {
    console.error('GitHub auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate GitHub OAuth' },
      { status: 500 },
    )
  }
}
