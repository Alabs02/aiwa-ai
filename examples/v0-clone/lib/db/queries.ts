import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
  or,
  ilike,
} from "drizzle-orm";

import {
  users,
  chat_ownerships,
  anonymous_chat_logs,
  github_exports,
  type User,
  type ChatOwnership,
  type AnonymousChatLog,
  type GitHubExport,
} from "./schema";
import { generateUUID } from "../utils";
import { generateHashedPassword } from "./utils";
import db from "./connection";

// Extended type for chat ownership with user info
export type ChatOwnershipWithUser = ChatOwnership & {
  owner_email?: string;
  owner_name?: string;
};

// Featured chats queries with user information
export async function getFeaturedChats({
  visibility = "all",
  userId,
  limit = 12,
  offset = 0,
  searchQuery,
}: {
  visibility?: "all" | "public" | "private" | "team";
  userId?: string;
  limit?: number;
  offset?: number;
  searchQuery?: string;
}): Promise<ChatOwnershipWithUser[]> {
  try {
    let conditions: SQL[] = [];

    if (visibility === "public") {
      conditions.push(eq(chat_ownerships.visibility, "public"));
    } else if (visibility === "private" && userId) {
      conditions.push(
        and(
          eq(chat_ownerships.visibility, "private"),
          eq(chat_ownerships.user_id, userId),
        )!,
      );
    } else if (visibility === "team") {
      conditions.push(eq(chat_ownerships.visibility, "team"));
    } else if (visibility === "all" && userId) {
      conditions.push(
        or(
          eq(chat_ownerships.visibility, "public"),
          eq(chat_ownerships.visibility, "team"),
          and(
            eq(chat_ownerships.visibility, "private"),
            eq(chat_ownerships.user_id, userId),
          )!,
        )!,
      );
    } else {
      conditions.push(eq(chat_ownerships.visibility, "public"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build query with joins
    let query = db
      .select({
        id: chat_ownerships.id,
        v0_chat_id: chat_ownerships.v0_chat_id,
        user_id: chat_ownerships.user_id,
        visibility: chat_ownerships.visibility,
        title: chat_ownerships.title,
        description: chat_ownerships.description,
        preview_url: chat_ownerships.preview_url,
        demo_url: chat_ownerships.demo_url,
        created_at: chat_ownerships.created_at,
        owner_email: users.email,
      })
      .from(chat_ownerships)
      .leftJoin(users, eq(chat_ownerships.user_id, users.id));

    // Apply visibility filter
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      const searchConditions = or(
        ilike(chat_ownerships.title, searchPattern),
        ilike(chat_ownerships.description, searchPattern),
        ilike(users.email, searchPattern),
      );

      if (whereClause && searchConditions) {
        query = query.where(and(whereClause, searchConditions)) as any;
      } else if (searchConditions) {
        query = query.where(searchConditions) as any;
      }
    }

    // Order and paginate
    const chatsWithUsers = await query
      .orderBy(desc(chat_ownerships.created_at))
      .limit(limit)
      .offset(offset);

    return chatsWithUsers as ChatOwnershipWithUser[];
  } catch (error) {
    console.error("Failed to get featured chats from database");
    throw error;
  }
}

export async function getFeaturedChatsCount({
  visibility = "all",
  userId,
  searchQuery,
}: {
  visibility?: "all" | "public" | "private" | "team";
  userId?: string;
  searchQuery?: string;
}): Promise<number> {
  try {
    let conditions: SQL[] = [];

    if (visibility === "public") {
      conditions.push(eq(chat_ownerships.visibility, "public"));
    } else if (visibility === "private" && userId) {
      conditions.push(
        and(
          eq(chat_ownerships.visibility, "private"),
          eq(chat_ownerships.user_id, userId),
        )!,
      );
    } else if (visibility === "team") {
      conditions.push(eq(chat_ownerships.visibility, "team"));
    } else if (visibility === "all" && userId) {
      conditions.push(
        or(
          eq(chat_ownerships.visibility, "public"),
          eq(chat_ownerships.visibility, "team"),
          and(
            eq(chat_ownerships.visibility, "private"),
            eq(chat_ownerships.user_id, userId),
          )!,
        )!,
      );
    } else {
      conditions.push(eq(chat_ownerships.visibility, "public"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build query with joins for search
    let query = db
      .select({ count: count(chat_ownerships.id) })
      .from(chat_ownerships)
      .leftJoin(users, eq(chat_ownerships.user_id, users.id));

    // Apply visibility filter
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      const searchConditions = or(
        ilike(chat_ownerships.title, searchPattern),
        ilike(chat_ownerships.description, searchPattern),
        ilike(users.email, searchPattern),
      );

      if (whereClause && searchConditions) {
        query = query.where(and(whereClause, searchConditions)) as any;
      } else if (searchConditions) {
        query = query.where(searchConditions) as any;
      }
    }

    const [result] = await query;

    return result?.count || 0;
  } catch (error) {
    console.error("Failed to get featured chats count from database");
    throw error;
  }
}

export async function updateChatVisibility({
  v0ChatId,
  visibility,
  previewUrl,
  demoUrl,
}: {
  v0ChatId: string;
  visibility: "public" | "private" | "team";
  previewUrl?: string;
  demoUrl?: string;
}) {
  try {
    return await db
      .update(chat_ownerships)
      .set({
        visibility,
        preview_url: previewUrl,
        demo_url: demoUrl,
      })
      .where(eq(chat_ownerships.v0_chat_id, v0ChatId))
      .returning();
  } catch (error) {
    console.error("Failed to update chat visibility in database");
    throw error;
  }
}

// Original queries below (keeping them all)...
export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(users).where(eq(users.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(
  email: string,
  password: string,
): Promise<User[]> {
  try {
    const hashedPassword = generateHashedPassword(password);
    return await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
      })
      .returning();
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function createGuestUser(): Promise<User[]> {
  try {
    const guestId = generateUUID();
    const guestEmail = `guest-${guestId}@example.com`;

    return await db
      .insert(users)
      .values({
        email: guestEmail,
        password: null,
      })
      .returning();
  } catch (error) {
    console.error("Failed to create guest user in database");
    throw error;
  }
}

// Chat ownership functions
export async function createChatOwnership({
  v0ChatId,
  userId,
}: {
  v0ChatId: string;
  userId: string;
}) {
  try {
    return await db
      .insert(chat_ownerships)
      .values({
        v0_chat_id: v0ChatId,
        user_id: userId,
      })
      .onConflictDoNothing({ target: chat_ownerships.v0_chat_id });
  } catch (error) {
    console.error("Failed to create chat ownership in database");
    throw error;
  }
}

export async function getChatOwnership({ v0ChatId }: { v0ChatId: string }) {
  try {
    const [ownership] = await db
      .select()
      .from(chat_ownerships)
      .where(eq(chat_ownerships.v0_chat_id, v0ChatId));
    return ownership;
  } catch (error) {
    console.error("Failed to get chat ownership from database");
    throw error;
  }
}

export async function getChatIdsByUserId({
  userId,
}: {
  userId: string;
}): Promise<string[]> {
  try {
    const ownerships = await db
      .select({ v0ChatId: chat_ownerships.v0_chat_id })
      .from(chat_ownerships)
      .where(eq(chat_ownerships.user_id, userId))
      .orderBy(desc(chat_ownerships.created_at));

    return ownerships.map((o: { v0ChatId: string }) => o.v0ChatId);
  } catch (error) {
    console.error("Failed to get chat IDs by user from database");
    throw error;
  }
}

export async function deleteChatOwnership({ v0ChatId }: { v0ChatId: string }) {
  try {
    return await db
      .delete(chat_ownerships)
      .where(eq(chat_ownerships.v0_chat_id, v0ChatId));
  } catch (error) {
    console.error("Failed to delete chat ownership from database");
    throw error;
  }
}

// Rate limiting functions
export async function getChatCountByUserId({
  userId,
  differenceInHours,
}: {
  userId: string;
  differenceInHours: number;
}): Promise<number> {
  try {
    const hoursAgo = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);

    const [stats] = await db
      .select({ count: count(chat_ownerships.id) })
      .from(chat_ownerships)
      .where(
        and(
          eq(chat_ownerships.user_id, userId),
          gte(chat_ownerships.created_at, hoursAgo),
        ),
      );

    return stats?.count || 0;
  } catch (error) {
    console.error("Failed to get chat count by user from database");
    throw error;
  }
}

export async function getChatCountByIP({
  ipAddress,
  differenceInHours,
}: {
  ipAddress: string;
  differenceInHours: number;
}): Promise<number> {
  try {
    const hoursAgo = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);

    const [stats] = await db
      .select({ count: count(anonymous_chat_logs.id) })
      .from(anonymous_chat_logs)
      .where(
        and(
          eq(anonymous_chat_logs.ip_address, ipAddress),
          gte(anonymous_chat_logs.created_at, hoursAgo),
        ),
      );

    return stats?.count || 0;
  } catch (error) {
    console.error("Failed to get chat count by IP from database");
    throw error;
  }
}

export async function createAnonymousChatLog({
  ipAddress,
  v0ChatId,
}: {
  ipAddress: string;
  v0ChatId: string;
}) {
  try {
    return await db.insert(anonymous_chat_logs).values({
      ip_address: ipAddress,
      v0_chat_id: v0ChatId,
    });
  } catch (error) {
    console.error("Failed to create anonymous chat log in database");
    throw error;
  }
}

// GitHub integration functions
export async function saveGitHubToken({
  userId,
  accessToken,
}: {
  userId: string;
  accessToken: string;
}) {
  try {
    return await db
      .update(users)
      .set({ github_access_token: accessToken })
      .where(eq(users.id, userId))
      .returning();
  } catch (error) {
    console.error("Failed to save GitHub token to database");
    throw error;
  }
}

export async function getUserWithGitHubToken(
  userId: string,
): Promise<User | undefined> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  } catch (error) {
    console.error("Failed to get user with GitHub token from database");
    throw error;
  }
}

export async function createGitHubExport({
  v0ChatId,
  userId,
  repoName,
  repoUrl,
  isPrivate,
}: {
  v0ChatId: string;
  userId: string;
  repoName: string;
  repoUrl: string;
  isPrivate: boolean;
}) {
  try {
    return await db
      .insert(github_exports)
      .values({
        v0_chat_id: v0ChatId,
        user_id: userId,
        repo_name: repoName,
        repo_url: repoUrl,
        is_private: isPrivate ? "true" : "false",
      })
      .returning();
  } catch (error) {
    console.error("Failed to create GitHub export record in database");
    throw error;
  }
}

export async function getGitHubExportsByChatId({
  v0ChatId,
}: {
  v0ChatId: string;
}): Promise<GitHubExport[]> {
  try {
    return await db
      .select()
      .from(github_exports)
      .where(eq(github_exports.v0_chat_id, v0ChatId))
      .orderBy(desc(github_exports.created_at));
  } catch (error) {
    console.error("Failed to get GitHub exports from database");
    throw error;
  }
}

export async function getGitHubExportsByUserId({
  userId,
}: {
  userId: string;
}): Promise<GitHubExport[]> {
  try {
    return await db
      .select()
      .from(github_exports)
      .where(eq(github_exports.user_id, userId))
      .orderBy(desc(github_exports.created_at));
  } catch (error) {
    console.error("Failed to get user GitHub exports from database");
    throw error;
  }
}
