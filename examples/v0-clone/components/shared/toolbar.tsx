"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { UserNav } from "@/components/user-nav";
import { RippleButton } from "@/components/ui/ripple-button";
import { useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  className?: string;
}

function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const { update } = useSession();

  useEffect(() => {
    const shouldRefresh = searchParams.get("refresh") === "session";
    if (shouldRefresh) {
      update();
      const url = new URL(window.location.href);
      url.searchParams.delete("refresh");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams, update]);

  return null;
}

const navLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/hub", label: "Vibe Hub" },
  { href: "/billing", label: "Pricing" }
];

export function Toolbar({ className = "" }: ToolbarProps) {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>

      <motion.nav
        className={cn(
          "sticky top-0 z-50 flex h-[60px] w-full items-center justify-between px-5 md:px-6",
          className
        )}
        animate={{
          backgroundColor: isScrolled
            ? "rgba(0, 0, 0, 0.5)"
            : "rgba(0, 0, 0, 0)",
          backdropFilter: isScrolled ? "blur(12px)" : "blur(0px)"
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Left Side: Logo + Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" passHref>
            <div className="relative grid h-9 w-20 cursor-pointer grid-cols-1 overflow-hidden border-none">
              <Image
                src="/aiwa.webp"
                alt="Aiwa Brand Logo"
                fill
                priority
                draggable={false}
                className="size-full object-contain"
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  pathname === link.href ? "text-white" : "text-white/60"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Side: Auth Buttons / User Nav */}
        <div className="flex items-center gap-2">
          {status === "authenticated" ? (
            <div className="relative grid size-9 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 p-[3px] shadow-inner brightness-100 transition-all duration-300 hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 hover:brightness-110">
              <div className="relative grid size-full skew-2 grid-cols-1 rounded-full bg-black shadow-md">
                <UserNav session={session} />
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" passHref className="hidden md:block">
                <RippleButton className="text-foreground font-medium transition-all duration-300">
                  Sign In
                </RippleButton>
              </Link>

              <Link href="/register" passHref className="hidden md:block">
                <RippleButton className="text-background bg-neutral-100 font-medium transition-all duration-300 hover:bg-neutral-200">
                  Sign Up
                </RippleButton>
              </Link>

              {/* Mobile User Nav */}
              <div className="relative grid size-9 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 p-[3px] shadow-inner brightness-100 transition-all duration-300 hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 hover:brightness-110 md:hidden">
                <div className="relative grid size-full skew-2 grid-cols-1 rounded-full bg-black shadow-md">
                  <UserNav session={session} />
                </div>
              </div>
            </>
          )}
        </div>
      </motion.nav>
    </>
  );
}
