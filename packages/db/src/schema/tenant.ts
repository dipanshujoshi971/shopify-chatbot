import { pgSchema, text, timestamp, integer, boolean, index, uniqueIndex, uuid, customType } from 'drizzle-orm/pg-core';

const vector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: unknown): number[] {
    return (value as string)
      .slice(1, -1)
      .split(',')
      .map(Number);
  },
});

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
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
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

  const knowledgeSources = schema.table('knowledge_sources', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    fileName: text('file_name').notNull(),
    r2Key: text('r2_key').notNull(),
    status: text('status', { enum: ['processing', 'ready', 'failed'] }).notNull().default('processing'),
    chunkCount: integer('chunk_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  });

  const knowledgeChunks = schema.table('knowledge_chunks', {
    id: uuid('id').primaryKey().defaultRandom(),
    knowledgeSourceId: uuid('knowledge_source_id')
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  }, (table) => [
    index('knowledge_chunks_source_idx').on(table.knowledgeSourceId),
  ]);

  return { products, conversations, messages, agentConfig, supportTickets, webhookEvents, knowledgeSources, knowledgeChunks };
}

export type TenantTables = ReturnType<typeof createTenantSchema>;