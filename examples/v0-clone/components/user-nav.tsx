'use client'

import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconLogout, IconUserSquareRounded } from '@tabler/icons-react'
import { Session } from 'next-auth'

interface UserNavProps {
  session: Session | null
}

export function UserNav({ session }: UserNavProps) {
  const initials =
    session?.user?.email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U'

  const isGuest = session?.user?.type === 'guest'
  const isSignedOut = !session

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-full skew-2 !border">
          <AvatarFallback className="bg-transparent !-skew-2 text-white font-button">
            {isSignedOut ? (
              <IconUserSquareRounded className="size-4 lg:size-5" />
            ) : (
              initials
            )}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-heading">
              {isSignedOut ? 'Not signed in' : isGuest ? 'Guest User' : 'User'}
            </p>
            {session?.user?.email && (
              <p className="text-xs mt-0.5 tracking-wide leading-none text-muted-foreground font-body">
                {session.user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(isGuest || isSignedOut) && (
          <>
            <DropdownMenuItem asChild>
              <a href="/register" className="cursor-pointer font-button">
                <span>Create Account</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/login" className="cursor-pointer font-button">
                <span>Sign In</span>
              </a>
            </DropdownMenuItem>
            {!isSignedOut && <DropdownMenuSeparator />}
          </>
        )}
        {!isSignedOut && (
          <DropdownMenuItem
            onClick={async () => {
              // Clear any local session data first
              await signOut({ callbackUrl: '/', redirect: true })
            }}
            className="cursor-pointer font-button"
          >
            <IconLogout className="mr-2 size-4 lg:size-5" />
            <span>Sign out</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
