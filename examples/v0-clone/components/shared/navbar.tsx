"use client";

import { useState, useEffect, Suspense, FC } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

import Link from "next/link";
import Image from "next/image";
import { ChatSelector } from "./chat-selector";
import { UserNav } from "@/components/user-nav";
import { RippleButton } from "@/components/ui/ripple-button";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";

interface NavbarProps {
  className?: string;
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const { update } = useSession();

  // Force session refresh when redirected after auth
  useEffect(() => {
    const shouldRefresh = searchParams.get("refresh") === "session";

    if (shouldRefresh) {
      // Force session update
      update();

      // Clean up URL without causing navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("refresh");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams, update]);

  return null;
}

export function NavBar({ className = "" }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isHomepage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault();
      window.location.href = "/?reset=true";
    }
  };

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>

      <motion.nav
        className="border-border dark:border-input sticky top-0 z-50 flex h-[60px] w-full items-center justify-between border-b px-5 md:px-4"
        animate={{
          backgroundColor: isScrolled
            ? "rgba(0, 0, 0, 0.5)"
            : "rgba(0, 0, 0, 0)",
          backdropFilter: isScrolled ? "blur(12px)" : "blur(0px)",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        <div className="flex items-center md:gap-4">
          <Link href={"/"} onClick={handleLogoClick} passHref>
            <div className="relative grid h-9 w-20 cursor-pointer grid-cols-1 overflow-hidden border-none">
              <Image
                src={"/aiwa.webp"}
                alt={"Aiwa Brand Logo"}
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

        <div className="hidden transform-gpu items-center gap-2 transition-all duration-300 will-change-auto md:flex">
          {session ? (
            <div className="relative grid size-9 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 p-[3px] shadow-inner brightness-100 transition-all duration-300 hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 hover:brightness-110">
              <div className="relative grid size-full skew-2 grid-cols-1 rounded-full bg-black shadow-md">
                <UserNav session={session} />
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" passHref>
                <RippleButton className="font-medium transition-all duration-300 hover:bg-neutral-800/90">
                  Sign In
                </RippleButton>
              </Link>

              <Link href="/register" passHref>
                <RippleButton className="text-background bg-neutral-100 font-medium transition-all duration-300 hover:bg-neutral-200">
                  Sign Up
                </RippleButton>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <div className="relative grid size-9 transform-gpu cursor-pointer place-items-center rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 p-[3px] shadow-inner brightness-100 transition-all duration-300 will-change-auto hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 hover:brightness-110 md:hidden">
            <div className="relative grid size-full skew-2 grid-cols-1 rounded-full bg-black shadow-md">
              <UserNav session={session} />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const event = new CustomEvent("toggle-mobile-sidebar");
              window.dispatchEvent(event);
            }}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </motion.nav>
    </>
  );
}
