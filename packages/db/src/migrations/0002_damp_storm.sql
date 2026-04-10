CREATE TABLE "token_usage_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_conversations" integer DEFAULT 0 NOT NULL,
	"total_messages" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "token_usage_daily_merchant_idx" ON "token_usage_daily" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "token_usage_daily_date_idx" ON "token_usage_daily" USING btree ("date");