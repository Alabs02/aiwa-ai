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
  created_at: timestamp("created_at").notNull().defaultNow(),

  // Columns
  role: varchar("role", { length: 20 }).notNull().default("user"), // user, admin
  stripe_customer_id: varchar("stripe_customer_id", { length: 255 }),
  onboarding_completed: varchar("onboarding_completed", { length: 10 })
    .notNull()
    .default("false")
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

export const hub_videos = pgTable("hub_videos", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  youtube_url: varchar("youtube_url", { length: 512 }).notNull(),
  youtube_id: varchar("youtube_id", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  summary: text("summary"),
  transcript: text("transcript"),
  thumbnail_url: varchar("thumbnail_url", { length: 512 }),
  duration: integer("duration"), // in seconds
  tags: text("tags").array().default([]),
  category: varchar("category", { length: 100 }),
  view_count: integer("view_count").default(0),
  is_featured: varchar("is_featured", { length: 10 })
    .notNull()
    .default("false"),
  published_at: timestamp("published_at"),
  created_by: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export type HubVideo = InferSelectModel<typeof hub_videos>;

export const blog_posts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  cover_image: varchar("cover_image", { length: 512 }),
  tags: text("tags").array().default([]),
  category: varchar("category", { length: 100 }),
  is_published: varchar("is_published", { length: 10 })
    .notNull()
    .default("false"),
  is_featured: varchar("is_featured", { length: 10 })
    .notNull()
    .default("false"),
  view_count: integer("view_count").default(0),
  reading_time: integer("reading_time"), // minutes
  author_id: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  published_at: timestamp("published_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export type BlogPost = InferSelectModel<typeof blog_posts>;

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

// Billing & Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .unique() // FIXED: Added unique constraint to prevent duplicates
    .references(() => users.id, { onDelete: "cascade" }),

  // Plan details
  plan: varchar("plan", { length: 50 }).notNull().default("free"), // free, pro, advanced, ultimate, white_label
  billing_cycle: varchar("billing_cycle", { length: 20 }), // monthly, annual
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, cancelled, past_due, paused

  // Credits
  credits_total: integer("credits_total").notNull().default(15), // Total allocated credits
  credits_used: integer("credits_used").notNull().default(0),
  credits_remaining: integer("credits_remaining").notNull().default(15),
  rollover_credits: integer("rollover_credits").notNull().default(0), // Unused credits from previous cycle

  // Stripe details
  stripe_customer_id: varchar("stripe_customer_id", { length: 255 }),
  stripe_subscription_id: varchar("stripe_subscription_id", { length: 255 }),
  stripe_price_id: varchar("stripe_price_id", { length: 255 }),

  // Billing dates
  current_period_start: timestamp("current_period_start"),
  current_period_end: timestamp("current_period_end"),
  cancel_at_period_end: varchar("cancel_at_period_end", { length: 10 })
    .notNull()
    .default("false"),
  cancelled_at: timestamp("cancelled_at"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export type Subscription = InferSelectModel<typeof subscriptions>;

// Credit purchases (one-time credit purchases)
export const credit_purchases = pgTable("credit_purchases", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  amount_usd: integer("amount_usd").notNull(), // Amount in cents
  credits_purchased: integer("credits_purchased").notNull(),
  credits_remaining: integer("credits_remaining").notNull(),

  stripe_payment_intent_id: varchar("stripe_payment_intent_id", {
    length: 255
  }),
  status: varchar("status", { length: 20 }).notNull().default("completed"), // completed, pending, failed

  created_at: timestamp("created_at").notNull().defaultNow()
});

export type CreditPurchase = InferSelectModel<typeof credit_purchases>;

// Usage tracking - links chat generations to credit consumption
export const usage_events = pgTable("usage_events", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Event details
  event_type: varchar("event_type", { length: 50 }).notNull(), // chat_generation, image_generation, etc
  v0_chat_id: varchar("v0_chat_id", { length: 255 }),
  v0_message_id: varchar("v0_message_id", { length: 255 }),

  // Token usage from V0 API
  input_tokens: integer("input_tokens").notNull().default(0),
  output_tokens: integer("output_tokens").notNull().default(0),
  total_tokens: integer("total_tokens").notNull().default(0),

  // Cost calculation (in cents)
  input_cost: integer("input_cost").notNull().default(0), // $1.5/1M tokens = 0.00015 per token = 0.015 cents
  output_cost: integer("output_cost").notNull().default(0), // $7.5/1M tokens = 0.00075 per token = 0.075 cents
  total_cost: integer("total_cost").notNull().default(0),

  // Credits deducted (1 credit = $0.20 = 20 cents)
  credits_deducted: integer("credits_deducted").notNull().default(0),

  // Metadata
  model: varchar("model", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("completed"), // completed, failed, pending
  error_message: text("error_message"),

  created_at: timestamp("created_at").notNull().defaultNow()
});

export type UsageEvent = InferSelectModel<typeof usage_events>;

// Payment transactions
export const payment_transactions = pgTable("payment_transactions", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  type: varchar("type", { length: 50 }).notNull(), // subscription, credit_purchase, refund
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),

  stripe_payment_id: varchar("stripe_payment_id", { length: 255 }),
  stripe_invoice_id: varchar("stripe_invoice_id", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull(), // succeeded, pending, failed, refunded

  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data

  created_at: timestamp("created_at").notNull().defaultNow()
});

export type PaymentTransaction = InferSelectModel<typeof payment_transactions>;

export const webhook_logs = pgTable("webhook_logs", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),

  // Stripe event data
  stripe_event_id: varchar("stripe_event_id", { length: 255 })
    .notNull()
    .unique(),
  event_type: varchar("event_type", { length: 100 }).notNull(),

  // User context
  user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  user_email: varchar("user_email", { length: 255 }),

  // Payment details
  amount: integer("amount"),
  currency: varchar("currency", { length: 3 }),
  stripe_customer_id: varchar("stripe_customer_id", { length: 255 }),
  stripe_subscription_id: varchar("stripe_subscription_id", { length: 255 }),
  stripe_invoice_id: varchar("stripe_invoice_id", { length: 255 }),

  // Status
  status: varchar("status", { length: 20 }).notNull(), // success, failed, pending
  error_message: text("error_message"),

  // Full event payload (for debugging)
  raw_event: text("raw_event"), // JSON stringified

  // Timing
  processed_at: timestamp("processed_at"),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export type WebhookLog = InferSelectModel<typeof webhook_logs>;
