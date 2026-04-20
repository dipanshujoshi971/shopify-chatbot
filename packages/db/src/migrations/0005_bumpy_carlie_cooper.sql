CREATE TABLE "embedding_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"knowledge_source_id" text NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"chunks_generated" integer DEFAULT 0 NOT NULL,
	"model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "shopify_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "encrypted_shopify_refresh_token" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "shopify_refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "token_usage_daily" ADD COLUMN "input_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage_daily" ADD COLUMN "output_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "embedding_usage_merchant_idx" ON "embedding_usage" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "embedding_usage_created_at_idx" ON "embedding_usage" USING btree ("created_at");