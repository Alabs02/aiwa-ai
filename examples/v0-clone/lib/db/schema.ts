import type { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  primaryKey,
  unique,
  text
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  github_access_token: varchar("github_access_token", { length: 255 }),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export type User = InferSelectModel<typeof users>;

// Simple ownership mapping for v0 chats
// The actual chat data lives in v0 API, we just track who owns what
export const chat_ownerships = pgTable(
  "chat_ownerships",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    v0_chat_id: varchar("v0_chat_id", { length: 255 }).notNull(), // v0 API chat ID
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    visibility: varchar("visibility", { length: 20 })
      .notNull()
      .default("private"), // 'public', 'private', 'team'
    title: varchar("title", { length: 255 }), // Custom user-defined title
    description: text("description"), // Custom description
    preview_url: varchar("preview_url", { length: 512 }), // Screenshot or preview URL
    demo_url: varchar("demo_url", { length: 512 }), // Live demo URL for iframe fallback
    created_at: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    // Ensure each v0 chat can only be owned by one user
    unique_v0_chat: unique().on(table.v0_chat_id)
  })
);

export type ChatOwnership = InferSelectModel<typeof chat_ownerships>;

// Track anonymous chat creation by IP for rate limiting
export const anonymous_chat_logs = pgTable("anonymous_chat_logs", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  ip_address: varchar("ip_address", { length: 45 }).notNull(), // IPv6 can be up to 45 chars
  v0_chat_id: varchar("v0_chat_id", { length: 255 }).notNull(), // v0 API chat ID
  created_at: timestamp("created_at").notNull().defaultNow()
});

export type AnonymousChatLog = InferSelectModel<typeof anonymous_chat_logs>;

// Track GitHub exports for chats
export const github_exports = pgTable("github_exports", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  v0_chat_id: varchar("v0_chat_id", { length: 255 }).notNull(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  repo_name: varchar("repo_name", { length: 255 }).notNull(),
  repo_url: varchar("repo_url", { length: 512 }).notNull(),
  is_private: varchar("is_private", { length: 10 }).notNull().default("true"), // 'true' or 'false' as string
  created_at: timestamp("created_at").notNull().defaultNow()
});

export type GitHubExport = InferSelectModel<typeof github_exports>;
