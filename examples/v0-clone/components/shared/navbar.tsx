'use client'

import { useState, useEffect, Suspense, FC } from 'react'
import { useSession } from 'next-auth/react'

import Link from 'next/link'
import Image from 'next/image'
import { ChatSelector } from './chat-selector'
import { MobileMenu } from './mobile-menu'
import { UserNav } from '@/components/user-nav'
import { RippleButton } from '@/components/ui/ripple-button'
import { usePathname, useSearchParams } from 'next/navigation'

interface NavbarProps {
  className?: string
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SearchParamsHandler() {
  const searchParams = useSearchParams()
  const { update } = useSession()

  // Force session refresh when redirected after auth
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh') === 'session'

    if (shouldRefresh) {
      // Force session update
      update()

      // Clean up URL without causing navigation
      const url = new URL(window.location.href)
      url.searchParams.delete('refresh')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [searchParams, update])

  return null
}

export function NavBar({ className = '' }: NavbarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isHomepage = pathname === '/'

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault()
      // Add reset parameter to trigger UI reset
      window.location.href = '/?reset=true'
    }
    // If not on homepage, let the Link component handle navigation normally
  }

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>

      <nav className="sticky top-0 z-50 border-b border-border dark:border-input flex items-center justify-between h-[60px] w-full px-5 md:px-4">
        <div className="flex items-center md:gap-4">
          <Link href={'/'} onClick={handleLogoClick} passHref>
            <div className="relative grid grid-cols-1 h-9 w-20 border-none overflow-hidden cursor-pointer">
              <Image
                src={'/aiwa.webp'}
                alt={'Aiwa Brand Logo'}
                fill
                priority
                draggable={false}
                className="size-full object-contain"
              />
            </div>
          </Link>

          {/* Hide ChatSelector on mobile */}
          <div className="hidden lg:block">
            <ChatSelector />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 transition-all duration-300 will-change-auto transform-gpu">
          {session ? (
            <div className="size-9 p-[3px] relative grid place-items-center shadow-inner rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 brightness-100 hover:brightness-110 transition-all duration-300 cursor-pointer">
              <div className="size-full grid grid-cols-1 relative bg-black rounded-full shadow-md skew-2">
                <UserNav session={session} />
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" passHref>
                <RippleButton className="font-medium hover:bg-neutral-800/90 transition-all duration-300">
                  Sign In
                </RippleButton>
              </Link>

              <Link href="/register" passHref>
                <RippleButton className="bg-neutral-100 text-background font-medium hover:bg-neutral-200 transition-all duration-300">
                  Sign Up
                </RippleButton>
              </Link>
            </>
          )}
        </div>

        <div className="size-9 p-[3px] relative grid place-items-center md:hidden shadow-inner rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 brightness-100 hover:brightness-110 transition-all duration-300 cursor-pointer will-change-auto transform-gpu">
          <div className="size-full grid grid-cols-1 relative bg-black rounded-full shadow-md skew-2">
            <UserNav session={session} />
          </div>
        </div>
      </nav>
    </>
  )
}
