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

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  v0_project_id: varchar("v0_project_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  instructions: text("instructions"),
  privacy: varchar("privacy", { length: 20 }).notNull().default("private"),
  vercel_project_id: varchar("vercel_project_id", { length: 255 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export type Project = InferSelectModel<typeof projects>;

export const project_env_vars = pgTable("project_env_vars", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  v0_env_var_id: varchar("v0_env_var_id", { length: 255 }),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export type ProjectEnvVar = InferSelectModel<typeof project_env_vars>;
