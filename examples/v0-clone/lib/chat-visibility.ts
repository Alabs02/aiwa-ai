// Utility functions for managing chat visibility

export type ChatVisibility = "public" | "private" | "team";

/**
 * Determines if a user can view a chat based on visibility settings
 */
export function canViewChat({
  chatVisibility,
  chatOwnerId,
  currentUserId,
  userTeamIds = []
}: {
  chatVisibility: ChatVisibility;
  chatOwnerId: string;
  currentUserId?: string;
  userTeamIds?: string[];
}): boolean {
  // Public chats are visible to everyone
  if (chatVisibility === "public") {
    return true;
  }

  // Must be authenticated to view non-public chats
  if (!currentUserId) {
    return false;
  }

  // Private chats only visible to owner
  if (chatVisibility === "private") {
    return chatOwnerId === currentUserId;
  }

  // Team chats visible to team members
  if (chatVisibility === "team") {
    // TODO: Implement team membership check
    // For now, return true if user has team IDs
    return userTeamIds.length > 0;
  }

  return false;
}

/**
 * Gets the appropriate visibility options for a user
 */
export function getVisibilityOptions(isAuthenticated: boolean): Array<{
  value: ChatVisibility | "all";
  label: string;
  description: string;
}> {
  if (!isAuthenticated) {
    return [
      {
        value: "public",
        label: "Public",
        description: "Projects shared with everyone"
      }
    ];
  }

  return [
    {
      value: "all",
      label: "All",
      description: "All visible projects"
    },
    {
      value: "public",
      label: "Public",
      description: "Projects shared with everyone"
    },
    {
      value: "private",
      label: "Private",
      description: "Your private projects"
    },
    {
      value: "team",
      label: "Team",
      description: "Projects shared with your team"
    }
  ];
}

/**
 * Generates a preview URL using a screenshot service
 * This is a placeholder - implement with your preferred screenshot service
 */
export async function generatePreviewUrl(
  chatId: string,
  demoUrl: string
): Promise<string | null> {
  try {
    // Option 1: Use a screenshot service API
    // const response = await fetch(`https://api.screenshot.service/capture`, {
    //   method: 'POST',
    //   body: JSON.stringify({ url: demoUrl }),
    // })
    // const { screenshotUrl } = await response.json()
    // return screenshotUrl

    // Option 2: Use Puppeteer/Playwright in a serverless function
    // const response = await fetch('/api/generate-preview', {
    //   method: 'POST',
    //   body: JSON.stringify({ chatId, url: demoUrl }),
    // })
    // const { previewUrl } = await response.json()
    // return previewUrl

    // Option 3: Use a third-party service like screenshotapi.net
    // return `https://shot.screenshotapi.net/screenshot?url=${encodeURIComponent(demoUrl)}&width=1200&height=630`

    console.warn("Preview generation not implemented");
    return null;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
}

/**
 * Validates a visibility value
 */
export function isValidVisibility(value: string): value is ChatVisibility {
  return ["public", "private", "team"].includes(value);
}

/**
 * Gets a user-friendly label for visibility
 */
export function getVisibilityLabel(visibility: ChatVisibility): string {
  const labels: Record<ChatVisibility, string> = {
    public: "Public",
    private: "Private",
    team: "Team"
  };
  return labels[visibility];
}

/**
 * Gets a description for a visibility type
 */
export function getVisibilityDescription(visibility: ChatVisibility): string {
  const descriptions: Record<ChatVisibility, string> = {
    public: "Anyone can view this project",
    private: "Only you can view this project",
    team: "Team members can view this project"
  };
  return descriptions[visibility];
}

/**
 * Gets an icon name for a visibility type (for your icon library)
 */
export function getVisibilityIcon(visibility: ChatVisibility): string {
  const icons: Record<ChatVisibility, string> = {
    public: "Globe",
    private: "Lock",
    team: "Users"
  };
  return icons[visibility];
}

/**
 * Client-side helper to update chat visibility
 */
export async function updateChatVisibilityClient({
  chatId,
  visibility,
  previewUrl,
  demoUrl
}: {
  chatId: string;
  visibility: ChatVisibility;
  previewUrl?: string;
  demoUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/chats/${chatId}/visibility`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        visibility,
        previewUrl,
        demoUrl
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating visibility:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Format relative time for "Created X ago"
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return then.toLocaleDateString();
}

/**
 * Client-side hook for fetching featured chats (React Hook)
 */
export function useFeaturedChats(visibility: ChatVisibility | "all") {
  // This is a placeholder - implement with your state management
  // Could use React Query, SWR, or plain useState + useEffect
  // Example with fetch:
  // const [chats, setChats] = useState([])
  // const [loading, setLoading] = useState(true)
  //
  // useEffect(() => {
  //   fetch(`/api/chats/featured?visibility=${visibility}`)
  //     .then(res => res.json())
  //     .then(data => setChats(data.data))
  //     .finally(() => setLoading(false))
  // }, [visibility])
  //
  // return { chats, loading }
}
