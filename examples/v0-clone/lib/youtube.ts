// lib/youtube.ts

export interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  publishedAt: Date;
  channelTitle: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Parse ISO 8601 duration format (PT#H#M#S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video metadata from YouTube Data API
 */
export async function fetchYouTubeVideoData(
  videoId: string
): Promise<YouTubeVideoData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YOUTUBE_API_KEY not configured");
    return null;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.error("Video not found");
      return null;
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    return {
      id: videoId,
      title: snippet.title,
      description: snippet.description,
      thumbnailUrl:
        snippet.thumbnails.maxres?.url ||
        snippet.thumbnails.high?.url ||
        snippet.thumbnails.medium?.url ||
        snippet.thumbnails.default?.url,
      duration: parseDuration(contentDetails.duration),
      publishedAt: new Date(snippet.publishedAt),
      channelTitle: snippet.channelTitle
    };
  } catch (error) {
    console.error("Failed to fetch YouTube data:", error);
    return null;
  }
}

/**
 * Generate YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Format duration in seconds to readable string (e.g., "5:30", "1:23:45")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
