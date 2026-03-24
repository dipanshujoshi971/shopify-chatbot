import { pgSchema, text, timestamp, integer, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export function createTenantSchema(storeId: string) {
  const schema = pgSchema(`tenant_${storeId}`);

  const products = schema.table('products', {
    id: text('id').primaryKey(),
    shopifyProductId: text('shopify_product_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    price: text('price').notNull(),
    imageUrl: text('image_url'),
    inStock: boolean('in_stock').notNull().default(true),
    // Embedding model version — needed to detect stale vectors on model upgrade
    modelVersion: text('model_version'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  }, (table) => [
    uniqueIndex('products_shopify_product_id_idx').on(table.shopifyProductId),
  ]);

  const conversations = schema.table('conversations', {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    customerId: text('customer_id'),
    status: text('status').notNull().default('active'),
    totalTokensUsed: integer('total_tokens_used').notNull().default(0),
    totalTurns: integer('total_turns').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  }, (table) => [
    index('conversations_created_at_idx').on(table.createdAt),
    index('conversations_session_id_idx').on(table.sessionId),
  ]);

  const messages = schema.table('messages', {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id').notNull(),
    role: text('role').notNull(),
    content: text('content').notNull(), // JSON string
    createdAt: timestamp('created_at').notNull().defaultNow(),
  }, (table) => [
    index('messages_conversation_id_idx').on(table.conversationId),
  ]);

  const agentConfig = schema.table('agent_config', {
    id: text('id').primaryKey().default('singleton'),
    botName: text('bot_name').notNull().default('Assistant'),
    tone: text('tone').notNull().default('friendly'),
    customInstructions: text('custom_instructions'),
    useEmojis: boolean('use_emojis').notNull().default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  });

  const supportTickets = schema.table('support_tickets', {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id'),
    customerEmail: text('customer_email').notNull(),
    customerMessage: text('customer_message').notNull(),
    status: text('status').notNull().default('open'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  }, (table) => [
    index('support_tickets_status_idx').on(table.status),
  ]);

  // Per-tenant webhook dedup — idempotency for Shopify product/inventory webhooks
  const webhookEvents = schema.table('webhook_events', {
    id: text('id').primaryKey(),
    idempotencyKey: text('idempotency_key').notNull(),
    source: text('source').notNull(),
    eventType: text('event_type').notNull(),
    processedAt: timestamp('processed_at').notNull().defaultNow(),
  }, (table) => [
    uniqueIndex('webhook_events_idempotency_key_idx').on(table.idempotencyKey),
  ]);

  return { products, conversations, messages, agentConfig, supportTickets, webhookEvents };
}

export type TenantTables = ReturnType<typeof createTenantSchema>;