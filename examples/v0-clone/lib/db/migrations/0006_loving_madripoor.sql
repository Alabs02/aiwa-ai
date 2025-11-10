CREATE TABLE "prompt_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt_text" text NOT NULL,
	"enhanced_prompt" text,
	"title" varchar(255),
	"category" varchar(100),
	"tags" text[] DEFAULT '{}',
	"quality_score" varchar(20),
	"is_favorite" varchar(10) DEFAULT 'false' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompt_library" ADD CONSTRAINT "prompt_library_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;