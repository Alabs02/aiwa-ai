CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255),
	"amount" integer,
	"currency" varchar(3),
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_invoice_id" varchar(255),
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"raw_event" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_logs_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_webhook_logs_event_type" ON "webhook_logs" ("event_type");
--> statement-breakpoint
CREATE INDEX "idx_webhook_logs_status" ON "webhook_logs" ("status");
--> statement-breakpoint
CREATE INDEX "idx_webhook_logs_user_id" ON "webhook_logs" ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_webhook_logs_created_at" ON "webhook_logs" ("created_at" DESC);