"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  IconLogout,
  IconUserSquareRounded,
  IconTemplate,
  IconSettings,
  IconCreditCard,
  IconFolders,
  IconLayoutDashboard
} from "@tabler/icons-react";
import { Sparkles, BookOpen, Video, DollarSign } from "lucide-react";
import { Session } from "next-auth";
import Link from "next/link";

interface UserNavProps {
  session: Session | null;
}

export function UserNav({ session }: UserNavProps) {
  const [credits, setCredits] = useState({ remaining: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const initials =
    session?.user?.email?.split("@")[0]?.slice(0, 2)?.toUpperCase() || "U";

  const isGuest = session?.user?.type === "guest";
  const isSignedOut = !session;

  useEffect(() => {
    if (!isSignedOut && !isGuest) {
      fetch("/api/billing/subscription")
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setCredits({
              remaining: data.credits_remaining || 0,
              total: data.credits_total || 0
            });
          }
        })
        .catch((err) => console.error("Failed to fetch credits:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isSignedOut, isGuest]);

  const creditsPercent =
    credits.total > 0 ? (credits.remaining / credits.total) * 100 : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-full skew-2 cursor-pointer !border">
          <AvatarFallback className="font-button !-skew-2 bg-transparent text-white">
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
            <p className="font-heading text-sm leading-none font-medium">
              {isSignedOut ? "Not signed in" : isGuest ? "Guest User" : "User"}
            </p>
            {session?.user?.email && (
              <p className="text-muted-foreground font-body mt-0.5 text-xs leading-none tracking-wide">
                {session.user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Mobile Nav Links - Only visible on mobile */}
        <div className="md:hidden">
          <DropdownMenuItem asChild>
            <Link href="/blog" className="font-button cursor-pointer">
              <BookOpen className="mr-2 size-4" />
              <span>Blog</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/hub" className="font-button cursor-pointer">
              <Video className="mr-2 size-4" />
              <span>Vibe Hub</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/billing" className="font-button cursor-pointer">
              <DollarSign className="mr-2 size-4" />
              <span>Pricing</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </div>

        {/* Credits Section - Only for authenticated non-guest users */}
        {!isSignedOut && !isGuest && (
          <>
            <div className="px-2 py-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  Credits
                </span>
                <span className="text-xs font-semibold">
                  {loading ? "..." : `${credits.remaining}/${credits.total}`}
                </span>
              </div>
              {!loading && (
                <Progress value={creditsPercent} className="h-1.5" />
              )}
              <Link
                href="/billing"
                className="text-primary mt-1.5 block text-xs hover:underline"
              >
                Manage Credits
              </Link>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Navigation Links - Only for authenticated users */}
        {!isSignedOut && !isGuest && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/workspace" className="font-button cursor-pointer">
                <IconLayoutDashboard className="mr-2 size-4 lg:size-5" />
                <span>Workspace</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/projects" className="font-button cursor-pointer">
                <IconFolders className="mr-2 size-4 lg:size-5" />
                <span>Projects</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/templates" className="font-button cursor-pointer">
                <IconTemplate className="mr-2 size-4 lg:size-5" />
                <span>Templates</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled asChild>
              <Link href="/settings" className="font-button cursor-pointer">
                <IconSettings className="mr-2 size-4 lg:size-5" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing" className="font-button cursor-pointer">
                <IconCreditCard className="mr-2 size-4 lg:size-5" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {(isGuest || isSignedOut) && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/register" className="font-button cursor-pointer">
                <span>Create Account</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/login" className="font-button cursor-pointer">
                <span>Sign In</span>
              </Link>
            </DropdownMenuItem>
            {!isSignedOut && <DropdownMenuSeparator />}
          </>
        )}
        {!isSignedOut && (
          <DropdownMenuItem
            onClick={async () => {
              await signOut({ callbackUrl: "/", redirect: true });
            }}
            className="font-button cursor-pointer"
          >
            <IconLogout className="mr-2 size-4 lg:size-5" />
            <span>Sign out</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
