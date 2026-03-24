CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_domain" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"plan_id" text DEFAULT 'starter' NOT NULL,
	"publishable_api_key" text NOT NULL,
	"encrypted_shopify_token" text,
	"clerk_org_id" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"dpa_accepted_at" timestamp,
	"frozen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_shop_domain_unique" UNIQUE("shop_domain"),
	CONSTRAINT "merchants_publishable_api_key_unique" UNIQUE("publishable_api_key"),
	CONSTRAINT "merchants_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "merchants_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "merchants_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"source" text NOT NULL,
	"event_type" text NOT NULL,
	"tenant_id" text,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE INDEX "audit_log_tenant_idx" ON "audit_log" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "merchants_status_idx" ON "merchants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_events_tenant_idx" ON "webhook_events" USING btree ("tenant_id");