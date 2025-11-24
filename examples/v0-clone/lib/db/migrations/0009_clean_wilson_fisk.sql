CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_image" varchar(512),
	"tags" text[] DEFAULT '{}',
	"category" varchar(100),
	"is_published" varchar(10) DEFAULT 'false' NOT NULL,
	"is_featured" varchar(10) DEFAULT 'false' NOT NULL,
	"view_count" integer DEFAULT 0,
	"reading_time" integer,
	"author_id" uuid NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hub_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_url" varchar(512) NOT NULL,
	"youtube_id" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"summary" text,
	"transcript" text,
	"thumbnail_url" varchar(512),
	"duration" integer,
	"tags" text[] DEFAULT '{}',
	"category" varchar(100),
	"view_count" integer DEFAULT 0,
	"is_featured" varchar(10) DEFAULT 'false' NOT NULL,
	"published_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hub_videos_youtube_id_unique" UNIQUE("youtube_id")
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hub_videos" ADD CONSTRAINT "hub_videos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;