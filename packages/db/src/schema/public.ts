import { pgTable, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';

// Merchants table — one row per Shopify store
export const merchants = pgTable('merchants', {
  id: text('id').primaryKey(),
  shopDomain: text('shop_domain').notNull().unique(),
  status: text('status').notNull().default('active'),
  planId: text('plan_id').notNull().default('starter'),
  publishableApiKey: text('publishable_api_key').notNull().unique(),
  // AES-256-CBC encrypted Shopify access token — never stored in plaintext
  encryptedShopifyToken: text('encrypted_shopify_token'),
  clerkOrgId: text('clerk_org_id').unique(),
  clerkUserId: text('clerk_user_id').unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  // GDPR — record when merchant accepted the Data Processing Agreement
  dpaAcceptedAt: timestamp('dpa_accepted_at'),
  // Offboarding — set when app is uninstalled, schema dropped 30 days later
  frozenAt: timestamp('frozen_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('merchants_status_idx').on(table.status),
]);

// Audit log — immutable record of data events, kept 7 years for compliance
export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id'),
  actor: text('actor').notNull(),   // system | clerk_user_id | shopify
  action: text('action').notNull(), // tenant.created | tenant.deleted | data.exported
  metadata: text('metadata'),       // JSON string — no personal data stored here
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('audit_log_tenant_idx').on(table.tenantId),
  index('audit_log_action_idx').on(table.action),
]);

// Webhook events — platform-level idempotency for Stripe + app/uninstalled
// Per-tenant Shopify webhook dedup lives in each tenant schema
export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(),
  // Stripe: event.id  |  Shopify: X-Shopify-Webhook-Id header
  idempotencyKey: text('idempotency_key').notNull().unique(),
  source: text('source').notNull(),     // 'stripe' | 'shopify'
  eventType: text('event_type').notNull(),
  tenantId: text('tenant_id'),          // null for platform-level events
  processedAt: timestamp('processed_at').notNull().defaultNow(),
}, (table) => [
  index('webhook_events_tenant_idx').on(table.tenantId),
]);