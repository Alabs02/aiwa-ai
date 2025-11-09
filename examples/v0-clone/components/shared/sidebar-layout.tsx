"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./app-sidebar";
import { useState, useEffect } from "react";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

// LocalStorage key for sidebar state
const SIDEBAR_STATE_KEY = "aiwa-sidebar-collapsed";

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed

  // Sync with localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    } else {
      // Set default collapsed state in localStorage
      localStorage.setItem(SIDEBAR_STATE_KEY, "true");
    }

    // Listen for changes to sidebar state
    const handleStorageChange = () => {
      const newState = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (newState !== null) {
        setIsCollapsed(newState === "true");
      }
    };

    // Use custom event for same-tab updates
    window.addEventListener("storage", handleStorageChange);

    // Add a custom event listener for same-tab updates
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsCollapsed(e.detail.collapsed);
    };
    window.addEventListener(
      "sidebar-toggle" as any,
      handleSidebarToggle as any
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "sidebar-toggle" as any,
        handleSidebarToggle as any
      );
    };
  }, []);

  if (
    pathname.includes("/login") ||
    pathname.includes("/logiregister") ||
    pathname === "/"
  ) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <AppSidebar />

      <main
        className={cn(
          "transition-all duration-300 ease-in-out",
          // No margin on mobile
          "md:ml-16",
          // Desktop margins based on collapse state
          !isCollapsed && "md:ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
}
