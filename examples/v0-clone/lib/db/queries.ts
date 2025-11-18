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
  ilike
} from "drizzle-orm";

import {
  users,
  chat_ownerships,
  anonymous_chat_logs,
  github_exports,
  prompt_library,
  projects,
  project_env_vars,
  type User,
  type ChatOwnership,
  type AnonymousChatLog,
  type GitHubExport,
  type PromptLibraryItem,
  type Project,
  type ProjectEnvVar
} from "./schema";
import { generateUUID } from "../utils";
import { generateHashedPassword } from "./utils";
import db from "./connection";

// Extended type for chat ownership with user info
export type ChatOwnershipWithUser = ChatOwnership & {
  owner_email?: string;
  owner_name?: string;
};

export type ProjectWithEnvVars = Project & {
  env_vars: ProjectEnvVar[];
  chat_count?: number;
};

// Featured chats queries with user information
export async function getFeaturedChats({
  visibility = "all",
  userId,
  limit = 12,
  offset = 0,
  searchQuery
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
          eq(chat_ownerships.user_id, userId)
        )!
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
            eq(chat_ownerships.user_id, userId)
          )!
        )!
      );
    } else {
      conditions.push(eq(chat_ownerships.visibility, "public"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
        owner_email: users.email
      })
      .from(chat_ownerships)
      .leftJoin(users, eq(chat_ownerships.user_id, users.id));

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      const searchConditions = or(
        ilike(chat_ownerships.title, searchPattern),
        ilike(chat_ownerships.description, searchPattern),
        ilike(users.email, searchPattern)
      );

      if (whereClause && searchConditions) {
        query = query.where(and(whereClause, searchConditions)) as any;
      } else if (searchConditions) {
        query = query.where(searchConditions) as any;
      }
    }

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
  searchQuery
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
          eq(chat_ownerships.user_id, userId)
        )!
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
            eq(chat_ownerships.user_id, userId)
          )!
        )!
      );
    } else {
      conditions.push(eq(chat_ownerships.visibility, "public"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select({ count: count(chat_ownerships.id) })
      .from(chat_ownerships)
      .leftJoin(users, eq(chat_ownerships.user_id, users.id));

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      const searchConditions = or(
        ilike(chat_ownerships.title, searchPattern),
        ilike(chat_ownerships.description, searchPattern),
        ilike(users.email, searchPattern)
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
  demoUrl
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
        demo_url: demoUrl
      })
      .where(eq(chat_ownerships.v0_chat_id, v0ChatId))
      .returning();
  } catch (error) {
    console.error("Failed to update chat visibility in database");
    throw error;
  }
}

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
  password: string
): Promise<User[]> {
  try {
    const hashedPassword = generateHashedPassword(password);
    return await db
      .insert(users)
      .values({
        email,
        password: hashedPassword
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
        password: null
      })
      .returning();
  } catch (error) {
    console.error("Failed to create guest user in database");
    throw error;
  }
}

export async function createChatOwnership({
  v0ChatId,
  userId
}: {
  v0ChatId: string;
  userId: string;
}) {
  try {
    return await db
      .insert(chat_ownerships)
      .values({
        v0_chat_id: v0ChatId,
        user_id: userId
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
  userId
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

export async function getChatCountByUserId({
  userId,
  differenceInHours
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
          gte(chat_ownerships.created_at, hoursAgo)
        )
      );

    return stats?.count || 0;
  } catch (error) {
    console.error("Failed to get chat count by user from database");
    throw error;
  }
}

export async function getChatCountByIP({
  ipAddress,
  differenceInHours
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
          gte(anonymous_chat_logs.created_at, hoursAgo)
        )
      );

    return stats?.count || 0;
  } catch (error) {
    console.error("Failed to get chat count by IP from database");
    throw error;
  }
}

export async function createAnonymousChatLog({
  ipAddress,
  v0ChatId
}: {
  ipAddress: string;
  v0ChatId: string;
}) {
  try {
    return await db.insert(anonymous_chat_logs).values({
      ip_address: ipAddress,
      v0_chat_id: v0ChatId
    });
  } catch (error) {
    console.error("Failed to create anonymous chat log in database");
    throw error;
  }
}

export async function saveGitHubToken({
  userId,
  accessToken
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
  userId: string
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
  isPrivate
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
        is_private: isPrivate ? "true" : "false"
      })
      .returning();
  } catch (error) {
    console.error("Failed to create GitHub export record in database");
    throw error;
  }
}

export async function getGitHubExportsByChatId({
  v0ChatId
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
  userId
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

// ===============================================
// PROMPT LIBRARY QUERIES
// ===============================================

export async function savePromptToLibrary({
  userId,
  promptText,
  enhancedPrompt,
  title,
  category,
  tags,
  qualityScore
}: {
  userId: string;
  promptText: string;
  enhancedPrompt?: string;
  title?: string;
  category?: string;
  tags?: string[];
  qualityScore?: string;
}): Promise<PromptLibraryItem> {
  try {
    const [result] = await db
      .insert(prompt_library)
      .values({
        user_id: userId,
        prompt_text: promptText,
        enhanced_prompt: enhancedPrompt,
        title: title || null,
        category: category || null,
        tags: tags || [],
        quality_score: qualityScore || null
      })
      .returning();

    return result;
  } catch (error) {
    console.error("Failed to save prompt to library");
    throw error;
  }
}

export async function getUserPrompts({
  userId,
  limit = 50,
  offset = 0,
  category,
  searchQuery,
  favoritesOnly = false
}: {
  userId: string;
  limit?: number;
  offset?: number;
  category?: string;
  searchQuery?: string;
  favoritesOnly?: boolean;
}): Promise<PromptLibraryItem[]> {
  try {
    let conditions: SQL[] = [eq(prompt_library.user_id, userId)];

    if (category) {
      conditions.push(eq(prompt_library.category, category));
    }

    if (favoritesOnly) {
      conditions.push(eq(prompt_library.is_favorite, "true"));
    }

    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      conditions.push(
        or(
          ilike(prompt_library.prompt_text, searchPattern),
          ilike(prompt_library.title, searchPattern),
          ilike(prompt_library.enhanced_prompt, searchPattern)
        )!
      );
    }

    const whereClause = and(...conditions);

    return await db
      .select()
      .from(prompt_library)
      .where(whereClause)
      .orderBy(desc(prompt_library.created_at))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("Failed to get user prompts from library");
    throw error;
  }
}

export async function getPromptById({
  promptId,
  userId
}: {
  promptId: string;
  userId: string;
}): Promise<PromptLibraryItem | undefined> {
  try {
    const [result] = await db
      .select()
      .from(prompt_library)
      .where(
        and(eq(prompt_library.id, promptId), eq(prompt_library.user_id, userId))
      );

    return result;
  } catch (error) {
    console.error("Failed to get prompt by ID");
    throw error;
  }
}

export async function updatePromptInLibrary({
  promptId,
  userId,
  updates
}: {
  promptId: string;
  userId: string;
  updates: Partial<{
    prompt_text: string;
    enhanced_prompt: string;
    title: string;
    category: string;
    tags: string[];
    quality_score: string;
    is_favorite: string;
  }>;
}): Promise<PromptLibraryItem> {
  try {
    const [result] = await db
      .update(prompt_library)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(
        and(eq(prompt_library.id, promptId), eq(prompt_library.user_id, userId))
      )
      .returning();

    return result;
  } catch (error) {
    console.error("Failed to update prompt in library");
    throw error;
  }
}

export async function deletePromptFromLibrary({
  promptId,
  userId
}: {
  promptId: string;
  userId: string;
}): Promise<void> {
  try {
    await db
      .delete(prompt_library)
      .where(
        and(eq(prompt_library.id, promptId), eq(prompt_library.user_id, userId))
      );
  } catch (error) {
    console.error("Failed to delete prompt from library");
    throw error;
  }
}

export async function incrementPromptUsage({
  promptId,
  userId
}: {
  promptId: string;
  userId: string;
}): Promise<void> {
  try {
    const prompt = await getPromptById({ promptId, userId });
    if (prompt) {
      await db
        .update(prompt_library)
        .set({
          usage_count: prompt.usage_count + 1,
          updated_at: new Date()
        })
        .where(
          and(
            eq(prompt_library.id, promptId),
            eq(prompt_library.user_id, userId)
          )
        );
    }
  } catch (error) {
    console.error("Failed to increment prompt usage");
    throw error;
  }
}

export async function getUserPromptStats({
  userId
}: {
  userId: string;
}): Promise<{
  total: number;
  favorites: number;
  categories: { category: string; count: number }[];
}> {
  try {
    const [totalResult] = await db
      .select({ count: count(prompt_library.id) })
      .from(prompt_library)
      .where(eq(prompt_library.user_id, userId));

    const [favoritesResult] = await db
      .select({ count: count(prompt_library.id) })
      .from(prompt_library)
      .where(
        and(
          eq(prompt_library.user_id, userId),
          eq(prompt_library.is_favorite, "true")
        )
      );

    // Get category breakdown
    const categoryResults = await db
      .select({
        category: prompt_library.category,
        count: count(prompt_library.id)
      })
      .from(prompt_library)
      .where(eq(prompt_library.user_id, userId))
      .groupBy(prompt_library.category);

    return {
      total: totalResult?.count || 0,
      favorites: favoritesResult?.count || 0,
      categories: categoryResults
        .filter((r: any) => r.category)
        .map((r: any) => ({
          category: r.category as string,
          count: r.count
        }))
    };
  } catch (error) {
    console.error("Failed to get user prompt stats");
    throw error;
  }
}

export async function createProject({
  userId,
  v0ProjectId,
  name,
  description,
  icon,
  instructions,
  privacy,
  vercelProjectId
}: {
  userId: string;
  v0ProjectId: string;
  name: string;
  description?: string;
  icon?: string;
  instructions?: string;
  privacy?: string;
  vercelProjectId?: string;
}): Promise<Project> {
  try {
    const [result] = await db
      .insert(projects)
      .values({
        user_id: userId,
        v0_project_id: v0ProjectId,
        name,
        description: description || null,
        icon: icon || null,
        instructions: instructions || null,
        privacy: privacy || "private",
        vercel_project_id: vercelProjectId || null
      })
      .returning();

    return result;
  } catch (error) {
    console.error("Failed to create project in database");
    throw error;
  }
}

export async function getProjectsByUserId({
  userId
}: {
  userId: string;
}): Promise<Project[]> {
  try {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.user_id, userId))
      .orderBy(desc(projects.created_at));
  } catch (error) {
    console.error("Failed to get user projects from database");
    throw error;
  }
}

export async function getProjectById({
  projectId,
  userId
}: {
  projectId: string;
  userId: string;
}): Promise<Project | undefined> {
  try {
    const [result] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)));

    return result;
  } catch (error) {
    console.error("Failed to get project by ID from database");
    throw error;
  }
}

export async function getProjectByV0Id({
  v0ProjectId,
  userId
}: {
  v0ProjectId: string;
  userId: string;
}): Promise<Project | undefined> {
  try {
    const [result] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.v0_project_id, v0ProjectId),
          eq(projects.user_id, userId)
        )
      );

    return result;
  } catch (error) {
    console.error("Failed to get project by v0 ID from database");
    throw error;
  }
}

export async function updateProject({
  projectId,
  userId,
  updates
}: {
  projectId: string;
  userId: string;
  updates: Partial<{
    name: string;
    description: string | null;
    icon: string | null;
    instructions: string | null;
    privacy: string;
    vercel_project_id: string | null;
  }>;
}): Promise<Project> {
  try {
    const [result] = await db
      .update(projects)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)))
      .returning();

    return result;
  } catch (error) {
    console.error("Failed to update project in database");
    throw error;
  }
}

export async function deleteProject({
  projectId,
  userId
}: {
  projectId: string;
  userId: string;
}): Promise<void> {
  try {
    await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)));
  } catch (error) {
    console.error("Failed to delete project from database");
    throw error;
  }
}

export async function createProjectEnvVar({
  projectId,
  v0EnvVarId,
  key,
  value
}: {
  projectId: string;
  v0EnvVarId?: string;
  key: string;
  value: string;
}): Promise<ProjectEnvVar> {
  try {
    const [result] = await db
      .insert(project_env_vars)
      .values({
        project_id: projectId,
        v0_env_var_id: v0EnvVarId || null,
        key,
        value
      })
      .returning();

    return result;
  } catch (error) {
    console.error("Failed to create project env var in database");
    throw error;
  }
}

export async function getProjectEnvVars({
  projectId
}: {
  projectId: string;
}): Promise<ProjectEnvVar[]> {
  try {
    return await db
      .select()
      .from(project_env_vars)
      .where(eq(project_env_vars.project_id, projectId))
      .orderBy(asc(project_env_vars.key));
  } catch (error) {
    console.error("Failed to get project env vars from database");
    throw error;
  }
}

export async function getProjectEnvVarsByV0Id({
  v0ProjectId
}: {
  v0ProjectId: string;
}): Promise<ProjectEnvVar[]> {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.v0_project_id, v0ProjectId)
    });

    if (!project) {
      throw new Error("Project not found");
    }

    return await db
      .select()
      .from(project_env_vars)
      .where(eq(project_env_vars.project_id, project.id))
      .orderBy(asc(project_env_vars.key));
  } catch (error) {
    console.error("Failed to get project env vars by v0 ID:", error);
    throw error;
  }
}

export async function updateProjectEnvVar({
  envVarId,
  value
}: {
  envVarId: string;
  value: string;
}): Promise<ProjectEnvVar> {
  try {
    const [result] = await db
      .update(project_env_vars)
      .set({
        value,
        updated_at: new Date()
      })
      .where(eq(project_env_vars.id, envVarId))
      .returning();

    return result;
  } catch (error) {
    console.error("Failed to update project env var in database");
    throw error;
  }
}

export async function deleteProjectEnvVar({
  envVarId
}: {
  envVarId: string;
}): Promise<void> {
  try {
    await db.delete(project_env_vars).where(eq(project_env_vars.id, envVarId));
  } catch (error) {
    console.error("Failed to delete project env var from database");
    throw error;
  }
}

export async function getProjectWithEnvVars({
  projectId,
  userId
}: {
  projectId: string;
  userId: string;
}): Promise<ProjectWithEnvVars | undefined> {
  try {
    const project = await getProjectById({ projectId, userId });
    if (!project) return undefined;

    const envVars = await getProjectEnvVars({ projectId });

    return {
      ...project,
      env_vars: envVars
    };
  } catch (error) {
    console.error("Failed to get project with env vars from database");
    throw error;
  }
}

export async function upsertProjectEnvVar({
  projectId,
  key,
  value,
  v0EnvVarId
}: {
  projectId: string;
  key: string;
  value: string;
  v0EnvVarId?: string;
}): Promise<ProjectEnvVar> {
  try {
    const existingVars = await db
      .select()
      .from(project_env_vars)
      .where(
        and(
          eq(project_env_vars.project_id, projectId),
          eq(project_env_vars.key, key)
        )
      );

    if (existingVars.length > 0) {
      const [result] = await db
        .update(project_env_vars)
        .set({
          value,
          v0_env_var_id: v0EnvVarId || existingVars[0].v0_env_var_id,
          updated_at: new Date()
        })
        .where(eq(project_env_vars.id, existingVars[0].id))
        .returning();
      return result;
    }

    return await createProjectEnvVar({
      projectId,
      v0EnvVarId,
      key,
      value
    });
  } catch (error) {
    console.error("Failed to upsert project env var in database");
    throw error;
  }
}

export async function getProjectsWithChatCount({
  userId
}: {
  userId: string;
}): Promise<ProjectWithEnvVars[]> {
  try {
    const userProjects = await getProjectsByUserId({ userId });

    const projectsWithData = await Promise.all(
      userProjects.map(async (project) => {
        const envVars = await getProjectEnvVars({ projectId: project.id });

        const [chatCountResult] = await db
          .select({ count: count(chat_ownerships.id) })
          .from(chat_ownerships)
          .leftJoin(projects, eq(chat_ownerships.user_id, projects.user_id))
          .where(
            and(
              eq(projects.id, project.id),
              eq(chat_ownerships.user_id, userId)
            )
          );

        return {
          ...project,
          env_vars: envVars,
          chat_count: chatCountResult?.count || 0
        };
      })
    );

    return projectsWithData;
  } catch (error) {
    console.error("Failed to get projects with chat count from database");
    throw error;
  }
}

export async function updateChatName({
  v0ChatId,
  title
}: {
  v0ChatId: string;
  title: string;
}) {
  try {
    return await db
      .update(chat_ownerships)
      .set({ title })
      .where(eq(chat_ownerships.v0_chat_id, v0ChatId))
      .returning();
  } catch (error) {
    console.error("Failed to update chat name in database");
    throw error;
  }
}

export async function deleteChatOwnership({ v0ChatId }: { v0ChatId: string }) {
  try {
    await db
      .delete(chat_ownerships)
      .where(eq(chat_ownerships.v0_chat_id, v0ChatId));
  } catch (error) {
    console.error("Failed to delete chat ownership from database");
    throw error;
  }
}

export async function getUserChats({
  userId,
  visibility = "all",
  sortBy = "last_edited",
  orderBy = "desc",
  limit = 12,
  offset = 0,
  searchQuery
}: {
  userId: string;
  visibility?: "all" | "private" | "team";
  sortBy?: "last_edited" | "date_created" | "alphabetical";
  orderBy?: "asc" | "desc";
  limit?: number;
  offset?: number;
  searchQuery?: string;
}): Promise<ChatOwnershipWithUser[]> {
  try {
    let conditions: SQL[] = [eq(chat_ownerships.user_id, userId)];

    // Apply visibility filter
    if (visibility === "private") {
      conditions.push(eq(chat_ownerships.visibility, "private"));
    } else if (visibility === "team") {
      conditions.push(eq(chat_ownerships.visibility, "team"));
    } else if (visibility === "all") {
      conditions.push(
        or(
          eq(chat_ownerships.visibility, "private"),
          eq(chat_ownerships.visibility, "team"),
          eq(chat_ownerships.visibility, "public")
        )!
      );
    }

    const whereClause = and(...conditions);

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
        owner_email: users.email
      })
      .from(chat_ownerships)
      .leftJoin(users, eq(chat_ownerships.user_id, users.id))
      .where(whereClause);

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      const searchConditions = or(
        ilike(chat_ownerships.title, searchPattern),
        ilike(chat_ownerships.description, searchPattern)
      );

      if (searchConditions) {
        query = query.where(and(whereClause, searchConditions)) as any;
      }
    }

    // Apply sorting
    const orderFn = orderBy === "asc" ? asc : desc;

    if (sortBy === "alphabetical") {
      query = query.orderBy(orderFn(chat_ownerships.title)) as any;
    } else if (sortBy === "date_created") {
      query = query.orderBy(orderFn(chat_ownerships.created_at)) as any;
    } else {
      // last_edited - default (using created_at as proxy for now)
      query = query.orderBy(orderFn(chat_ownerships.created_at)) as any;
    }

    const chatsWithUsers = await query.limit(limit).offset(offset);

    return chatsWithUsers as ChatOwnershipWithUser[];
  } catch (error) {
    console.error("Failed to get user chats from database");
    throw error;
  }
}

// Get count of user's chats
export async function getUserChatsCount({
  userId,
  visibility = "all",
  searchQuery
}: {
  userId: string;
  visibility?: "all" | "private" | "team";
  searchQuery?: string;
}): Promise<number> {
  try {
    let conditions: SQL[] = [eq(chat_ownerships.user_id, userId)];

    // Apply visibility filter
    if (visibility === "private") {
      conditions.push(eq(chat_ownerships.visibility, "private"));
    } else if (visibility === "team") {
      conditions.push(eq(chat_ownerships.visibility, "team"));
    } else if (visibility === "all") {
      conditions.push(
        or(
          eq(chat_ownerships.visibility, "private"),
          eq(chat_ownerships.visibility, "team"),
          eq(chat_ownerships.visibility, "public")
        )!
      );
    }

    const whereClause = and(...conditions);

    let query = db
      .select({ count: count(chat_ownerships.id) })
      .from(chat_ownerships)
      .where(whereClause);

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      const searchConditions = or(
        ilike(chat_ownerships.title, searchPattern),
        ilike(chat_ownerships.description, searchPattern)
      );

      if (searchConditions) {
        query = query.where(and(whereClause, searchConditions)) as any;
      }
    }

    const [result] = await query;

    return result?.count || 0;
  } catch (error) {
    console.error("Failed to get user chats count from database");
    throw error;
  }
}
