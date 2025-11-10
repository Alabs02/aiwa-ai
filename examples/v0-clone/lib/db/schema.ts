import type { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  primaryKey,
  unique,
  text,
  integer
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  github_access_token: varchar("github_access_token", { length: 255 }),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export type User = InferSelectModel<typeof users>;

export const chat_ownerships = pgTable(
  "chat_ownerships",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    v0_chat_id: varchar("v0_chat_id", { length: 255 }).notNull(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    visibility: varchar("visibility", { length: 20 })
      .notNull()
      .default("private"),
    title: varchar("title", { length: 255 }),
    description: text("description"),
    preview_url: varchar("preview_url", { length: 512 }),
    demo_url: varchar("demo_url", { length: 512 }),
    created_at: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    unique_v0_chat: unique().on(table.v0_chat_id)
  })
);

export type ChatOwnership = InferSelectModel<typeof chat_ownerships>;

export const anonymous_chat_logs = pgTable("anonymous_chat_logs", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  ip_address: varchar("ip_address", { length: 45 }).notNull(),
  v0_chat_id: varchar("v0_chat_id", { length: 255 }).notNull(),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export type AnonymousChatLog = InferSelectModel<typeof anonymous_chat_logs>;

export const github_exports = pgTable("github_exports", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  v0_chat_id: varchar("v0_chat_id", { length: 255 }).notNull(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  repo_name: varchar("repo_name", { length: 255 }).notNull(),
  repo_url: varchar("repo_url", { length: 512 }).notNull(),
  is_private: varchar("is_private", { length: 10 }).notNull().default("true"),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export type GitHubExport = InferSelectModel<typeof github_exports>;

// Prompt library for saving and managing enhanced prompts
export const prompt_library = pgTable("prompt_library", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  prompt_text: text("prompt_text").notNull(),
  enhanced_prompt: text("enhanced_prompt"),
  title: varchar("title", { length: 255 }),
  category: varchar("category", { length: 100 }),
  tags: text("tags").array().default([]),
  quality_score: varchar("quality_score", { length: 20 }),
  is_favorite: varchar("is_favorite", { length: 10 })
    .notNull()
    .default("false"),
  usage_count: integer("usage_count").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export type PromptLibraryItem = InferSelectModel<typeof prompt_library>;
