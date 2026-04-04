import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as publicSchema from './schema/public.js';
import { createTenantSchema } from './schema/tenant.js';

export function createDbClient(connectionString: string) {
  const sql = postgres(connectionString, {
    max: 10,
    prepare: false,
    idle_timeout: 60,
    connect_timeout: 2,
  });

  const db = drizzle(sql, { schema: publicSchema });

  return { db, sql };
}

export function createTenantDbClient(connectionString: string, storeId: string) {
  const sql = postgres(connectionString, {
    max: 10,
    prepare: false,
    idle_timeout: 60,
    connect_timeout: 2,
  });

  const tenantTables = createTenantSchema(storeId);
  const db = drizzle(sql, { schema: tenantTables });

  return { db, sql, schema: tenantTables };
}

// Provisions a new tenant: creates the schema namespace then all tables.
// Uses raw SQL throughout — avoids any drizzle version conflicts across packages.
export async function provisionTenantSchema(
  connectionString: string,
  storeId: string
): Promise<void> {
  const sql = postgres(connectionString, { max: 1, prepare: false });
  const safeName = storeId.replace(/[^a-z0-9_]/g, '_');
  const s = `tenant_${safeName}`; // schema prefix shorthand

  try {
    // 1 — Create the schema namespace
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${s}"`);

    // 2 — Products (RAG source — vector embedding added in Phase 3)
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}"."products" (
        "id"                  text PRIMARY KEY NOT NULL,
        "shopify_product_id"  text NOT NULL,
        "title"               text NOT NULL,
        "description"         text,
        "price"               text NOT NULL,
        "image_url"           text,
        "in_stock"            boolean NOT NULL DEFAULT true,
        "model_version"       text,
        "created_at"          timestamp NOT NULL DEFAULT now(),
        "updated_at"          timestamp NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "products_shopify_product_id_idx"
      ON "${s}"."products" ("shopify_product_id")
    `);

    // 3 — Conversations
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}"."conversations" (
        "id"                 text PRIMARY KEY NOT NULL,
        "session_id"         text NOT NULL,
        "customer_id"        text,
        "status"             text NOT NULL DEFAULT 'active',
        "total_tokens_used"  integer NOT NULL DEFAULT 0,
        "prompt_tokens"      integer NOT NULL DEFAULT 0,
        "completion_tokens"  integer NOT NULL DEFAULT 0,
        "total_turns"        integer NOT NULL DEFAULT 0,
        "created_at"         timestamp NOT NULL DEFAULT now(),
        "updated_at"         timestamp NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "conversations_created_at_idx"
      ON "${s}"."conversations" ("created_at" DESC)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "conversations_session_id_idx"
      ON "${s}"."conversations" ("session_id")
    `);

    // 4 — Messages
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}"."messages" (
        "id"               text PRIMARY KEY NOT NULL,
        "conversation_id"  text NOT NULL,
        "role"             text NOT NULL,
        "content"          text NOT NULL,
        "created_at"       timestamp NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx"
      ON "${s}"."messages" ("conversation_id", "created_at")
    `);

    // 5 — Agent config (singleton row per tenant)
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}"."agent_config" (
        "id"                   text PRIMARY KEY NOT NULL DEFAULT 'singleton',
        "bot_name"             text NOT NULL DEFAULT 'Assistant',
        "tone"                 text NOT NULL DEFAULT 'friendly',
        "custom_instructions"  text,
        "use_emojis"           boolean NOT NULL DEFAULT false,
        "updated_at"           timestamp NOT NULL DEFAULT now()
      )
    `);

    // 6 — Support tickets
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}"."support_tickets" (
        "id"               text PRIMARY KEY NOT NULL,
        "conversation_id"  text,
        "customer_email"   text NOT NULL,
        "customer_message" text NOT NULL,
        "status"           text NOT NULL DEFAULT 'open',
        "created_at"       timestamp NOT NULL DEFAULT now(),
        "updated_at"       timestamp NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "support_tickets_status_idx"
      ON "${s}"."support_tickets" ("status", "created_at" DESC)
    `);

    // 7 — Webhook events (idempotency for per-tenant Shopify webhooks)
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "${s}"."webhook_events" (
        "id"               text PRIMARY KEY NOT NULL,
        "idempotency_key"  text NOT NULL,
        "source"           text NOT NULL,
        "event_type"       text NOT NULL,
        "processed_at"     timestamp NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_idempotency_key_idx"
      ON "${s}"."webhook_events" ("idempotency_key")
    `);

  } finally {
    await sql.end();
  }
}

export type PublicDb = ReturnType<typeof createDbClient>['db'];
export type TenantDb = ReturnType<typeof createTenantDbClient>['db'];