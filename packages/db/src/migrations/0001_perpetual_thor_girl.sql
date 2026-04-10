ALTER TABLE "merchants" ADD COLUMN "clerk_user_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_clerk_user_id_unique" UNIQUE("clerk_user_id");