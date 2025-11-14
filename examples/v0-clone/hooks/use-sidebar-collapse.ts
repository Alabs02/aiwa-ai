// hooks/use-sidebar-collapse.ts
import { useState, useEffect } from "react";

const SIDEBAR_STATE_KEY = "aiwa-sidebar-collapsed";

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    // Load saved state from localStorage
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    } else {
      localStorage.setItem(SIDEBAR_STATE_KEY, "true");
    }

    // Handle storage changes (cross-tab)
    const handleStorageChange = () => {
      const newState = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (newState !== null) {
        setIsCollapsed(newState === "true");
      }
    };

    // Handle custom sidebar-toggle event (same-tab)
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsCollapsed(e.detail.collapsed);
    };

    window.addEventListener("storage", handleStorageChange);
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

  return { isCollapsed };
}
