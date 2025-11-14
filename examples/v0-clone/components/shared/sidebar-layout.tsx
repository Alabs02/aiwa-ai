"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./app-sidebar";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarCollapse();

  if (
    pathname.includes("/login") ||
    pathname.includes("/register") ||
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
          "md:ml-16",
          !isCollapsed && "md:ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
}
