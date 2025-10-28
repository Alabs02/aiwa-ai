CREATE TABLE "github_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"v0_chat_id" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"repo_name" varchar(255) NOT NULL,
	"repo_url" varchar(512) NOT NULL,
	"is_private" varchar(10) DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_access_token" varchar(255);--> statement-breakpoint
ALTER TABLE "github_exports" ADD CONSTRAINT "github_exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;