import '@/plugins/fonts'
import './globals.css'

import type { Metadata } from 'next'
import { StreamingProvider } from '@/contexts/streaming-context'
import { SWRProvider } from '@/components/providers/swr-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

export const metadata: Metadata = {
  title: 'Aiwa — Vibe. Build. Deploy. ✨',
  description:
    'Aiwa is the AI fullstack partner that lets you build and deploy production-ready websites and apps just by chatting. No coding required.',
  keywords: [
    'Aiwa',
    'AI website builder',
    'AI web app generator',
    'v0 alternative',
    'AI coding assistant',
    'no-code app builder',
    'AI fullstack engineer',
    'build with AI',
    'AI web development',
    'Lovable alternative',
    'Orchids alternative',
  ],
  authors: [{ name: 'Aiwa Team' }],
  creator: 'Aiwa',
  metadataBase: new URL('https://aiwa.build'),
  openGraph: {
    title: 'Aiwa | Vibe. Build. Deploy.',
    description:
      'Build production-ready websites and web apps instantly by chatting with Aiwa, your AI fullstack partner.',
    url: 'https://aiwa.build',
    siteName: 'Aiwa',
    images: [
      {
        url: '/aiwa-hero.webp',
        width: 1200,
        height: 630,
        alt: 'Aiwa App Hero Section Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aiwa — Vibe. Build. Deploy. ✨',
    description:
      'Create and deploy fullstack apps instantly by chatting with Aiwa. Build what you imagine, no coding required.',
    images: ['/aiwa-hero.webp'],
    creator: '@aiwa_build',
  },
  icons: {
    icon: '/aiwa.webp',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="antialiased">
        <SessionProvider>
          <SWRProvider>
            <StreamingProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <ToastProvider />
              </ThemeProvider>
            </StreamingProvider>
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
